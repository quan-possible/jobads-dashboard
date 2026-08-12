The KPI strip's tile — uppercase label with its denominator, one big tabular number, a ▲/▼ delta chip and a sparkline; exactly one tile per strip gets `accent`.

    <KpiTile accent label="Postings index" value="88" context="2019 = 100" delta={-12} deltaLabel="vs baseline" spark={series} />
    <KpiTile label="Vs last year" value="8.4%" valueTrend={-8.4} context="year over year" spark={series} />
    <KpiTile label="Median wage" value="—" context="insufficient sample" />

delta and valueTrend are percentage POINTS, not proportions. Render "—" rather than a thin estimate.
