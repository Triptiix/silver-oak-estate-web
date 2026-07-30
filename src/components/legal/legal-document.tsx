import type { ReactNode } from "react";

/**
 * Shared shell for the published legal documents: title, effective/updated
 * dates and an accessible table of contents linking to each section.
 */
export function LegalDocument({
  title,
  effectiveDate,
  lastUpdated,
  sections,
  children,
}: {
  title: string;
  effectiveDate: string;
  lastUpdated: string;
  sections: readonly (readonly [string, string])[];
  children: ReactNode;
}) {
  return (
    <article className="legal-document">
      <h1 className="text-4xl font-bold">{title}</h1>
      <dl className="mt-4 flex flex-wrap gap-x-8 gap-y-1 text-sm text-[var(--soe-color-ink-muted)]">
        <div className="flex gap-2">
          <dt className="font-semibold">Effective date:</dt>
          <dd>{effectiveDate}</dd>
        </div>
        <div className="flex gap-2">
          <dt className="font-semibold">Last updated:</dt>
          <dd>{lastUpdated}</dd>
        </div>
      </dl>

      <nav
        aria-labelledby="legal-contents-heading"
        className="mt-8 rounded-[var(--soe-radius-card)] border border-[var(--soe-surface-control-border)]/30 p-5"
      >
        <h2 id="legal-contents-heading" className="text-base font-bold">
          Contents
        </h2>
        <ol className="mt-3 grid gap-x-8 gap-y-1 text-sm sm:grid-cols-2">
          {sections.map(([id, label]) => (
            <li key={id}>
              <a
                href={`#${id}`}
                className="inline-flex min-h-11 items-center underline decoration-stone-300 underline-offset-4 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[var(--soe-color-focus-ring)] focus-visible:ring-offset-2 sm:min-h-0 sm:py-1"
              >
                {label}
              </a>
            </li>
          ))}
        </ol>
      </nav>

      {/*
        The `@tailwindcss/typography` plugin is not installed, so `prose` would
        be inert and every heading would render at body size. These explicit
        rules give the document a real visual hierarchy without adding a
        dependency.
      */}
      <div
        className="mt-12 space-y-10
          [&_a]:underline [&_a]:decoration-stone-400 [&_a]:underline-offset-4
          [&_h2]:mb-3 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:tracking-tight
          [&_li]:leading-[var(--soe-leading-body)]
          [&_ol]:mt-3 [&_ol]:list-decimal [&_ol]:space-y-2 [&_ol]:pl-6
          [&_p]:mt-3 [&_p]:leading-[var(--soe-leading-body)]
          [&_table]:mt-4 [&_table]:w-full [&_table]:border-collapse [&_table]:text-left [&_table]:text-sm
          [&_td]:border-t [&_td]:border-[var(--soe-surface-control-border)]/30 [&_td]:py-3 [&_td]:pr-4 [&_td]:align-top
          [&_th]:border-t [&_th]:border-[var(--soe-surface-control-border)]/30 [&_th]:py-3 [&_th]:pr-4 [&_th]:align-top [&_th]:font-semibold
          [&_thead_th]:border-b-2 [&_thead_th]:border-[var(--soe-color-brand)]/40
          [&_ul]:mt-3 [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-6"
      >
        {children}
      </div>
    </article>
  );
}

/** One numbered section of a legal document, addressable from the contents. */
export function LegalSection({
  id,
  heading,
  children,
}: {
  id: string;
  heading: string;
  children: ReactNode;
}) {
  return (
    <section id={id} aria-labelledby={`${id}-heading`} className="scroll-mt-24">
      <h2 id={`${id}-heading`}>{heading}</h2>
      {children}
    </section>
  );
}
