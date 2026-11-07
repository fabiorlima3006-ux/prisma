import { z } from 'zod';
import { marketData } from '@/lib/data';
import { internalError, json, limited, ok, resolveAsset } from '../../guard';

const rangeSchema = z.enum(['1m', '6m', '1y']);

export async function GET(
  req: Request,
  ctx: { params: Promise<{ ticker: string }> },
): Promise<Response> {
  const blocked = limited(req);
  if (blocked) return blocked;
  try {
    const { ticker } = await ctx.params;
    const asset = resolveAsset(ticker);
    if (asset === 'invalid') return json({ error: 'invalid-ticker' }, 400);
    const range = rangeSchema.safeParse(new URL(req.url).searchParams.get('range') ?? '1y');
    if (!range.success) return json({ error: 'invalid-range' }, 400);
    if (asset === 'not-found') return json({ error: 'not-found' }, 404);
    return ok(await marketData.getHistory(asset, range.data));
  } catch (err) {
    return internalError('history', err);
  }
}
