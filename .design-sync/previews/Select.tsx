import { Select } from "web";

// The filter control from FilterSpine. Square by design (--radius-control: 0)
// and it signals "not the default" by switching the border to orange, which is
// the whole reason the non-default cell exists.
//
// NarrowedSelection: any option other than the first switches the border to
// orange. NoOptionsAvailable: an empty option set renders a disabled
// placeholder rather than crashing.

const REGIONS = [
  { value: "All Canada", label: "All Canada" },
  { value: "Alberta", label: "Alberta" },
  { value: "British Columbia", label: "British Columbia" },
  { value: "Ontario", label: "Ontario" },
  { value: "Quebec", label: "Quebec" },
];

const noop = () => {};

export const DefaultSelection = () => (
  <div style={{ maxWidth: 260 }}>
    <Select id="preview-geo" label="Region" value="All Canada" options={REGIONS} onChange={noop} />
  </div>
);

export const NarrowedSelection = () => (
  <div style={{ maxWidth: 260 }}>
    <Select id="preview-geo-set" label="Region" value="Alberta" options={REGIONS} onChange={noop} />
  </div>
);

export const InAFilterRow = () => (
  <div style={{ display: "flex", gap: 16, flexWrap: "wrap", maxWidth: 560 }}>
    <Select id="preview-row-geo" label="Region" value="Alberta" options={REGIONS} onChange={noop} />
    <Select
      id="preview-row-occ"
      label="Occupation"
      value="All occupations"
      options={[
        { value: "All occupations", label: "All occupations" },
        { value: "Health occupations", label: "Health occupations" },
        { value: "Trades and transport", label: "Trades and transport" },
      ]}
      onChange={noop}
    />
  </div>
);

export const NoOptionsAvailable = () => (
  <div style={{ maxWidth: 260 }}>
    <Select id="preview-empty" label="Industry" value={undefined} options={[]} onChange={noop} />
  </div>
);
