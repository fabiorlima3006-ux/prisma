import Link from 'next/link';
import { Badge, Card } from '@/components/ui';
import { LEVEL_LABEL, LEVEL_TONE, articlesLabel } from './labels';
import type { Track } from './registry';

export function TrackCard({ track }: { track: Track }) {
  return (
    <Card as="article" interactive className="flex h-full flex-col p-5">
      <Badge tone={LEVEL_TONE[track.slug]} className="self-start">
        {LEVEL_LABEL[track.slug]}
      </Badge>
      <h2 className="mt-3 text-base font-bold text-text">{track.title}</h2>
      <p className="mt-1 flex-1">{track.description}</p>
      <p className="mt-3 font-mono text-xs">{articlesLabel(track.articles.length)}</p>
      <Link
        href={`/educacao/${track.slug}`}
        className="mt-2 inline-block font-semibold text-accent"
      >
        Conhecer →
      </Link>
    </Card>
  );
}
