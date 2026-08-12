A decorative 24-point trend line for KPI tiles — soft area fill, end dot, tabular context alongside; orange for the lead metric, teal for the rest.

    <Sparkline data={series} stroke="var(--teal)" />
    <Sparkline data={series} stroke="var(--orange)" width={132} height={34} />

Min-max normalised, so a nearly flat series still fills the box — do not read amplitude from it.
