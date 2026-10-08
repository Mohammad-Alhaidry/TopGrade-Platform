// Math in question content. Banks write it in TeX between \( and \), e.g. "Find \(\lim_{x\to 2} \frac{x^2-4}{x-2}\)",
// and Temml (assets/vendor/temml, MIT) draws it as MathML, which browsers lay out natively. Temml is loaded only
// for a course with "math": true, so other courses carry none of its weight.

const VENDOR = 'assets/vendor/temml/';
const MATH = /\\\((.+?)\\\)/gs;
let loading = null;

/** Loads Temml once (script + its stylesheet). Resolves false if it could not load: math then shows as TeX. */
export function loadMath() {
  loading ??= new Promise((resolve) => {
    for (const file of ['Temml-Local.css', 'stix-two-math.css']) {
      const css = document.createElement('link');
      css.rel = 'stylesheet';
      css.href = new URL(`${VENDOR}${file}`, document.baseURI).href;
      document.head.append(css);
    }
    const script = document.createElement('script');
    script.src = new URL(`${VENDOR}temml.min.js`, document.baseURI).href;
    script.onload = () => resolve(Boolean(globalThis.temml));
    script.onerror = () => { loading = null; resolve(false); };
    document.head.append(script);
  });
  return loading;
}

/** Text with its \( ... \) parts drawn as math. Plain text (or no Temml) comes back unchanged. */
export function rich(text) {
  const temml = globalThis.temml;
  if (!temml || typeof text !== 'string' || !text.includes('\\(')) return text;
  const out = [];
  let last = 0;
  for (const m of text.matchAll(MATH)) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const span = document.createElement('span');
    span.className = 'math';
    try {
      // Display style, as the book prints it: full-size fractions, limits written under "lim" (readable on a phone).
      temml.render(`\\displaystyle ${m[1]}`, span, { throwOnError: true });
    } catch {
      span.textContent = m[1];
    }
    out.push(span);
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}
