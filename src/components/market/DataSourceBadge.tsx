import { Badge } from '@/components/ui';
import type { DataMeta } from '@/lib/data/types';
import { formatDateTime } from '@/lib/format';

export function DataSourceBadge({ meta }: { meta: DataMeta }) {
  if (meta.isDemo) return <Badge tone="demo">DADOS DEMONSTRATIVOS</Badge>;
  return (
    <Badge tone="real">
      Fonte: {meta.attribution} · atualizado em {formatDateTime(meta.asOf)}
    </Badge>
  );
}
