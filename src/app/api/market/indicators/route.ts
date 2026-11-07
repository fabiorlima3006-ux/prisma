import { marketData } from '@/lib/data';
import type { DataResult, IndicatorId, IndicatorValue } from '@/lib/data/types';
import { internalError, limited, ok } from '../guard';

const IDS: IndicatorId[] = ['selic', 'cdi', 'ipca12m', 'ipcaMonth', 'ptax', 'tr'];

export async function GET(req: Request): Promise<Response> {
  const blocked = limited(req);
  if (blocked) return blocked;
  try {
    const results = await Promise.all(IDS.map((id) => marketData.getIndicator(id)));
    const body = {} as Record<IndicatorId, DataResult<IndicatorValue>>;
    IDS.forEach((id, i) => {
      body[id] = results[i] as DataResult<IndicatorValue>;
    });
    return ok(body);
  } catch (err) {
    return internalError('indicators', err);
  }
}
