Swaps one chart between measures — an orange-pill segmented tablist with roving arrow-key focus over pre-rendered variants.

    <MapToggle ariaLabel="Measure" options={[{value:"count",label:"Count"},{value:"share",label:"Share"}]} views={{count:<Chart/>, share:<Chart/>}} />

Put it inside a Figure's `actions` slot, or directly above the chart body. All variants must be pre-rendered — no measure logic in the browser.
