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

// Where a long formula may wrap: before a top-level relation or arrow, and after a top-level comma ("top level" =
// outside every group, bracket, \left..\right and environment). Each piece is drawn on its own, so a chain like
// "a = b \Rightarrow c = d" can continue on the next line instead of running off a phone screen. Only for
// left-to-right lines: in a right-to-left line the pieces would be laid out in reverse.
const BREAK_BEFORE = /^\\(?:Rightarrow|Leftrightarrow|Longrightarrow|implies|iff|ne|neq|approx|le|ge|leq|geq|cup|cap)(?![a-zA-Z])|^[=<>]/;
const WRAP_FROM = 24;

export function texPieces(tex) {
  if (tex.replace(/\s/g, '').length < WRAP_FROM) return [tex];
  // A formula wrapped whole in brackets, "(a=1, b=2, c=3)", may break inside them.
  const wrapped = /^\s*(\\left\s*)?\(([\s\S]*?)(\\right\s*)?\)\s*$/.exec(tex);
  if (wrapped && balancedParens(wrapped[2])) {
    const inner = texPieces(wrapped[2]);
    if (inner.length > 1) return inner.map((x, i) => `${i ? '' : '('}${x}${i === inner.length - 1 ? ')' : ''}`);
  }
  const pieces = [];
  let depth = 0;
  let start = 0;
  for (let i = 0; i < tex.length; i++) {
    const rest = tex.slice(i);
    const word = /^\\(begin|end|left|right|[a-zA-Z]+|.)/.exec(rest);
    if (word) {
      if (word[1] === 'begin' || word[1] === '{') depth++;
      else if (word[1] === 'end' || word[1] === '}') depth--;
      else if (depth === 0 && i > start && BREAK_BEFORE.test(rest)) { pieces.push(tex.slice(start, i)); start = i; }
      // \left( and \right) count through their bracket below; skip only the command name here.
      i += word[0].length - 1;
      continue;
    }
    const c = tex[i];
    if ('{(['.includes(c)) depth++;
    else if ('})]'.includes(c)) depth = Math.max(0, depth - 1);
    else if (depth === 0 && i > start && BREAK_BEFORE.test(rest)) { pieces.push(tex.slice(start, i)); start = i; }
    else if (depth === 0 && c === ',') { pieces.push(tex.slice(start, i + 1)); start = i + 1; }
  }
  pieces.push(tex.slice(start));
  return pieces.map((x) => x.trim()).filter(Boolean);
}

function balancedParens(tex) {
  let depth = 0;
  for (const c of tex) {
    if (c === '(') depth++;
    else if (c === ')' && --depth < 0) return false;
  }
  return depth === 0;
}

/**
 * Last resort for a formula with no place to break (one long product, a wide matrix): drawn slightly smaller so
 * it fits its line instead of running off a small phone. Call after the formulas are on the page.
 */
export function fitMath(root) {
  for (const m of root.querySelectorAll('.math')) {
    m.style.fontSize = '';
    let box = m.parentElement;
    while (box && getComputedStyle(box).display.startsWith('inline')) box = box.parentElement;
    if (!box) continue;
    const cs = getComputedStyle(box);
    const room = box.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
    const need = m.scrollWidth;
    if (room > 0 && need > room + 1) m.style.fontSize = `${Math.max(0.6, Math.floor((room / need) * 100) / 100)}em`;
  }
}

function drawMath(tex) {
  const span = document.createElement('span');
  span.className = 'math';
  try {
    // Display style, as the book prints it: full-size fractions, limits written under "lim" (readable on a phone).
    globalThis.temml.render(`\\displaystyle ${tex}`, span, { throwOnError: true });
  } catch {
    span.textContent = tex;
  }
  return span;
}

/**
 * Text with its \( ... \) parts drawn as math. Plain text (or no Temml) comes back unchanged. `wrap` (for
 * left-to-right lines only) lets a long formula continue on the next line, see texPieces.
 */
export function rich(text, { wrap = false } = {}) {
  if (!globalThis.temml || typeof text !== 'string' || !text.includes('\\(')) return text;
  const out = [];
  let last = 0;
  for (const m of text.matchAll(MATH)) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const pieces = wrap ? texPieces(m[1]) : [m[1]];
    // Between pieces: a plain break opportunity before a relation (MathML already spaces it), a space after a comma.
    pieces.forEach((tex, i) => out.push(...(i ? [BREAK_BEFORE.test(tex) ? document.createElement('wbr') : ' '] : []), drawMath(tex)));
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}
