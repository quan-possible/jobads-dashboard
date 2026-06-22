# AI-exposure reference asset

## occupation_ai_exposure.parquet

Broad-NOC (10 single-digit groups) **task-based AI exposure**, built by
[`tools/build_ai_exposure.py`](../../tools/build_ai_exposure.py). Read at request
time like the bundled geojson — never recomputed live.

**Metric:** Eloundou, Manning, Mishkin & Rock, *"GPTs are GPTs: An Early Look at
the Labor Market Impact Potential of Large Language Models"* (2023). Headline = **β**
(share of an occupation's tasks an LLM **plus tools** could cut by ≥50% of the time);
α (LLM alone) and γ/ζ (LLM + all complementary software) are carried as bounds.
Human panel ratings are primary; the model ("dv") ratings fill occupations the panel
did not score.

- Source: `openai/GPTs-are-GPTs` → `data/occ_level.csv` (MIT). Keyed at O\*NET-SOC.

**Crosswalk:** O\*NET-SOC → NOC 2021 from `bcgov/onet-noc2021-crosswalk`
(`output/3.0.0/onet_to_noc2021_mapping.csv`, Apache-2.0), which is built from
Statistics Canada's official **SOC 2018(US) ↔ NOC 2016** and **NOC 2016 ↔ NOC 2021**
concordances (StatCan Open Licence). We use the NOC **2021** output directly because
the dashboard's postings are cut on NOC 2021 broad groups — the NOC 2016 first digit
does *not* align with NOC 2021 (the 2021 TEER restructuring dissolved the old
"0 = Management" top digit), so taking the first digit of a raw 2016 concordance would
mis-bin the exposure.

**Roll-up:** each O\*NET occupation is split across the NOC codes it maps to by the
crosswalk's mapping-strength weight; broad-group β is the strength-weighted mean.
It is **not** employment-weighted (no public NOC-employment table is bundled); the
broad ranking is robust to this. 97% of Eloundou's occupations join the crosswalk.

**Caveats (shown in the UI):** exposure is US-task-based, mapped onto Canadian
occupations — a *potential-exposure* signal, not realized automation — and shown only
at the broad NOC level. No causal claims.

**Columns:** `noc_code` ("0".."9"), `noc_name`, `exposure_beta`, `exposure_beta_dv`,
`exposure_alpha`, `exposure_gamma`, `n_occupations`, `method`.

### Rebuild

```
python tools/build_ai_exposure.py            # download sources (cached) + build
python tools/build_ai_exposure.py --offline  # use the cached sources only
```

Downloaded sources are cached under `_sources/` (gitignored, regenerable).
