// The "Core → Deep" section break shared by the researcher pages: a hairline
// rule, an eyebrow, and a one-line lede introducing the deeper charts below.

export function DeepDivider({ eyebrow, lede }: { eyebrow: string; lede: string }) {
  return (
    <section className="container-x pt-8 pb-1">
      <div className="border-t border-card-border pt-6">
        <div className="eyebrow mb-1.5">{eyebrow}</div>
        <p className="lede max-w-2xl">{lede}</p>
      </div>
    </section>
  );
}
