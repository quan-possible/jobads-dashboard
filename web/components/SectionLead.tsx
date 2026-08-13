/** Editorial numbered section marker shared by dense public analytical routes. */
export function SectionLead({
  number,
  label,
}: {
  number: string;
  label: string;
  asOf?: string;
  locale?: "en" | "fr";
}) {
  return (
    <div className="mb-4 flex min-w-0 flex-wrap items-baseline gap-x-3 gap-y-1 border-t-2 border-navy pt-3">
      <span className="num text-2xl font-bold leading-none text-sand">{number}</span>
      <h2 className="min-w-0 max-w-[75%] break-words t-meta font-bold uppercase tracking-[0.02em] text-navy-deep">{label}</h2>
    </div>
  );
}
