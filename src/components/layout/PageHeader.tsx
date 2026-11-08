import { JsonLd } from '@/components/JsonLd';
import { breadcrumbJsonLd } from '@/lib/seo/json-ld';
import { Breadcrumbs, type Crumb } from './Breadcrumbs';

export function PageHeader({
  eyebrow,
  title,
  description,
  breadcrumbs,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  breadcrumbs?: Crumb[];
}) {
  return (
    <section className="hero-grid -mt-[var(--header-h)] bg-hero pt-[var(--header-h)] text-white">
      <div className="mx-auto max-w-6xl px-4 pt-10 pb-12 sm:px-6">
        {breadcrumbs && breadcrumbs.length > 0 && (
          <div className="mb-4">
            <Breadcrumbs items={breadcrumbs} />
            <JsonLd data={breadcrumbJsonLd(breadcrumbs)} />
          </div>
        )}
        {eyebrow && (
          <p className="mb-2 font-mono text-xs tracking-wider text-[#2fd3ff]">{`// ${eyebrow}`}</p>
        )}
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">{title}</h1>
        {description && <p className="mt-3 max-w-2xl text-base text-white/75">{description}</p>}
      </div>
    </section>
  );
}
