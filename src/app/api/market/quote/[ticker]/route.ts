import { marketData } from '@/lib/data';
import { internalError, json, limited, ok, resolveAsset } from '../../guard';

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
    if (asset === 'not-found') return json({ error: 'not-found' }, 404);
    return ok(await marketData.getQuote(asset));
  } catch (err) {
    return internalError('quote', err);
  }
}
