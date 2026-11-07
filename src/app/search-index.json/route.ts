import { buildSearchIndex } from '@/lib/search/build-index';

export const dynamic = 'force-static';

export async function GET() {
  return Response.json(await buildSearchIndex(), {
    headers: { 'Cache-Control': 'public, max-age=3600' },
  });
}
