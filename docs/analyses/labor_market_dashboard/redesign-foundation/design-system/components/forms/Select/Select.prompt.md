The dashboard's filter select — micro uppercase label above a SQUARE select with a hand-drawn chevron; the border turns orange when a non-default value is chosen, and an empty option set renders a disabled em-dash placeholder.

    <Select id="geo" label="Region" options={[{value:"ca",label:"Canada"},{value:"ab",label:"Alberta"}]} onChange={setGeo} />

First option is treated as the default/reset state.
