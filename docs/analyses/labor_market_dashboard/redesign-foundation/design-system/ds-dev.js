/* Dev shim — renders design-system previews before the compiler has generated
   _ds_bundle.js. Inert once the real bundle exists (it defines window.ACLMR first).

   Owns every JSX transform on the page: Babel 8 standalone defaults to the
   automatic JSX runtime (which emits an ESM import that a classic <script>
   cannot run), so nothing here uses <script type="text/babel">. Preview code
   lives in <script type="text/plain" data-card> / [data-screen] blocks and is
   transformed with the classic runtime and executed here. */
(function () {
  var CLASSIC = { presets: [["react", { runtime: "classic" }]] };

  var self = document.currentScript;
  var ROOT = (function () {
    var s = self && self.src;
    return s ? s.split("?")[0].replace(/[^/]*$/, "") : "./";
  })();

  var SOURCES = [
    "components/brand/PixelTiles/PixelTiles.jsx",
    "components/brand/Brand/Brand.jsx",
    "components/navigation/LocaleToggle/LocaleToggle.jsx",
    "components/navigation/CtaButton/CtaButton.jsx",
    "components/navigation/TopNav/TopNav.jsx",
    "components/navigation/Footer/Footer.jsx",
    "components/forms/Select/Select.jsx",
    "components/data/Sparkline/Sparkline.jsx",
    "components/data/KpiTile/KpiTile.jsx",
    "components/data/Figure/Figure.jsx",
    "components/data/KeyPoints/KeyPoints.jsx",
    "components/data/CoverageBar/CoverageBar.jsx",
    "components/data/DeepDivider/DeepDivider.jsx",
    "components/data/MapToggle/MapToggle.jsx",
    "components/data/ErrorCard/ErrorCard.jsx"
  ];
  var NAMES = SOURCES.map(function (p) { return p.split("/").pop().replace(".jsx", ""); });

  function strip(src) {
    return src.split("\n")
      .filter(function (l) { return l.trim().indexOf("import ") !== 0; })
      .join("\n")
      .replace(/^\s*export\s+function/gm, "function");
  }

  function run(code, extraNames, extraVals) {
    var out = window.Babel.transform(code, CLASSIC).code;
    var names = ["React", "ReactDOM", "useState", "useId"].concat(extraNames || []);
    var vals = [window.React, window.ReactDOM, window.React.useState, window.React.useId].concat(extraVals || []);
    return Function.apply(null, names.concat([out])).apply(null, vals);
  }

  function fetchText(p) { return fetch(ROOT + p).then(function (r) { return r.text(); }); }

  // Prefer the compiled bundle when the design-system compiler has emitted it.
  function loadBundle() {
    if (window.ACLMR) return Promise.resolve(true);
    // Probe with fetch first: injecting a <script> for a bundle that does not
    // exist yet logs a console error on every preview load.
    return fetch(ROOT + "_ds_bundle.js", { method: "HEAD" })
      .then(function (r) {
        if (!r.ok) return false;
        return new Promise(function (resolve) {
          var el = document.createElement("script");
          el.src = ROOT + "_ds_bundle.js";
          el.onload = function () { resolve(!!window.ACLMR); };
          el.onerror = function () { resolve(false); };
          document.head.appendChild(el);
        });
      })
      .catch(function () { return false; });
  }

  function buildFromSources() {
    if (window.ACLMR) return Promise.resolve(window.ACLMR);
    return Promise.all(SOURCES.map(fetchText)).then(function (srcs) {
      var code = srcs.map(strip).join("\n\n") +
        "\nwindow.ACLMR = {" + NAMES.map(function (n) { return n + ": " + n; }).join(", ") + "};";
      run(code);
      return window.ACLMR;
    });
  }

  function buildLibrary() {
    return loadBundle().then(function (ok) {
      return ok ? window.ACLMR : buildFromSources();
    });
  }

  // Sibling screen files (UI kits): "./PulseScreen.jsx,./ExploreScreen.jsx"
  function loadScreens(NS) {
    var list = (self && self.getAttribute("data-screens")) || "";
    if (!list) return Promise.resolve(NS);
    var base = location.href.replace(/[^/]*$/, "");
    return Promise.all(list.split(",").map(function (p) {
      return fetch(base + p.trim().replace(/^\.\//, "")).then(function (r) { return r.text(); });
    })).then(function (srcs) {
      srcs.forEach(function (s) { run(strip(s), ["NS"], [NS]); });
      return NS;
    });
  }

  function runBlocks(NS) {
    var blocks = document.querySelectorAll("script[type='text/plain'][data-card]");
    for (var i = 0; i < blocks.length; i++) run(blocks[i].textContent, ["NS"], [NS]);
  }

  window.ACLMRReady = buildLibrary().then(loadScreens).then(function (NS) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", function () { runBlocks(NS); });
    } else {
      runBlocks(NS);
    }
    return NS;
  });
})();
