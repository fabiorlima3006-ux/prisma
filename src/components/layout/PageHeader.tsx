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
    <section
      className="-mt-[var(--header-h)] bg-hero pt-[var(--header-h)] text-white"
      style={{
        backgroundImage:
          'linear-gradient(rgba(255,255,255,.035) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.035) 1px,transparent 1px)',
        backgroundSize: '28px 28px',
      }}
    >
      <div className="mx-auto max-w-6xl px-4 pt-10 pb-12 sm:px-6">
        {breadcrumbs && breadcrumbs.length > 0 && (
          <div className="mb-4">
            <Breadcrumbs items={breadcrumbs} />
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
