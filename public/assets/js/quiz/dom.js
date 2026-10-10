// Minimal element builder: h('button', { class: 'x', onclick }, 'Label', child, ...).
// Attribute values of false/null/undefined are skipped; on* keys become listeners.
export function h(tag, attrs = {}, ...children) {
  const el = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs ?? {})) {
    if (value === false || value === null || value === undefined) continue;
    if (key.startsWith('on')) el.addEventListener(key.slice(2), value);
    else if (key === 'class') el.className = value;
    else if (key === 'dataset') Object.assign(el.dataset, value);
    else if (key === 'value') el.value = value;
    // Through CSSOM, not a style attribute, so the Content-Security-Policy can forbid inline styles.
    else if (key === 'style') el.style.cssText = value;
    else el.setAttribute(key, value === true ? '' : value);
  }
  for (const child of children.flat(Infinity)) {
    if (child === null || child === undefined || child === false) continue;
    el.append(child instanceof Node ? child : String(child));
  }
  return el;
}

const SVG_NS = 'http://www.w3.org/2000/svg';

/** Inline stroke icon from one or more path strings (24x24 viewBox). */
export function icon(...paths) {
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('aria-hidden', 'true');
  for (const d of paths) {
    const p = document.createElementNS(SVG_NS, 'path');
    p.setAttribute('d', d);
    svg.append(p);
  }
  return svg;
}

// Interface icons: Tabler Icons 3.49 outline set (MIT, https://tabler.io/icons), path data copied verbatim.
// Drawn with stroke=currentColor, stroke-width 2, round caps/joins (set in CSS), so they match one another.
export const ICONS = {
  chevronLeft: ["M15 6l-6 6l6 6"],
  chevronRight: ["M9 6l6 6l-6 6"],
  chevronDown: ["M6 9l6 6l6 -6"],
  check: ["M5 12l5 5l10 -10"],
  cross: ["M18 6l-12 12", "M6 6l12 12"],
  close: ["M18 6l-12 12", "M6 6l12 12"],
  retry: ["M4.05 11a8 8 0 1 1 .5 4m-.5 5v-5h5"],
  grid: ["M4 5a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v4a1 1 0 0 1 -1 1h-4a1 1 0 0 1 -1 -1l0 -4", "M14 5a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v4a1 1 0 0 1 -1 1h-4a1 1 0 0 1 -1 -1l0 -4", "M4 15a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v4a1 1 0 0 1 -1 1h-4a1 1 0 0 1 -1 -1l0 -4", "M14 15a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v4a1 1 0 0 1 -1 1h-4a1 1 0 0 1 -1 -1l0 -4"],
  practice: ["M3 12a9 9 0 1 0 18 0a9 9 0 1 0 -18 0", "M9 12l2 2l4 -4"],
  exam: ["M9 5h-2a2 2 0 0 0 -2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2 -2v-12a2 2 0 0 0 -2 -2h-2", "M9 5a2 2 0 0 1 2 -2h2a2 2 0 0 1 2 2a2 2 0 0 1 -2 2h-2a2 2 0 0 1 -2 -2", "M9 12l.01 0", "M13 12l2 0", "M9 16l.01 0", "M13 16l2 0"],
  home: ["M5 12l-2 0l9 -9l9 9l-2 0", "M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2 -2v-7", "M9 21v-6a2 2 0 0 1 2 -2h2a2 2 0 0 1 2 2v6"],
  book: ["M3 19a9 9 0 0 1 9 0a9 9 0 0 1 9 0", "M3 6a9 9 0 0 1 9 0a9 9 0 0 1 9 0", "M3 6l0 13", "M12 6l0 13", "M21 6l0 13"],
  flame: ["M12 10.941c2.333 -3.308 .167 -7.823 -1 -8.941c0 3.395 -2.235 5.299 -3.667 6.706c-1.43 1.408 -2.333 3.294 -2.333 5.588c0 3.704 3.134 6.706 7 6.706c3.866 0 7 -3.002 7 -6.706c0 -1.712 -1.232 -4.403 -2.333 -5.588c-2.084 3.353 -3.257 3.353 -4.667 2.235"],
  bolt: ["M13 3l0 7l6 0l-8 11l0 -7l-6 0l8 -11"],
  target: ["M11 12a1 1 0 1 0 2 0a1 1 0 1 0 -2 0", "M7 12a5 5 0 1 0 10 0a5 5 0 1 0 -10 0", "M3 12a9 9 0 1 0 18 0a9 9 0 1 0 -18 0"],
  shield: ["M11.46 20.846a12 12 0 0 1 -7.96 -14.846a12 12 0 0 0 8.5 -3a12 12 0 0 0 8.5 3a12 12 0 0 1 -.09 7.06", "M15 19l2 2l4 -4"],
  layers: ["M12 4l-8 4l8 4l8 -4l-8 -4", "M4 12l8 4l8 -4", "M4 16l8 4l8 -4"],
  share: ["M8 9h-1a2 2 0 0 0 -2 2v8a2 2 0 0 0 2 2h10a2 2 0 0 0 2 -2v-8a2 2 0 0 0 -2 -2h-1", "M12 14v-11", "M9 6l3 -3l3 3"],
  addSquare: ["M9 12h6", "M12 9v6", "M3 5a2 2 0 0 1 2 -2h14a2 2 0 0 1 2 2v14a2 2 0 0 1 -2 2h-14a2 2 0 0 1 -2 -2v-14"],
  download: ["M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2 -2v-2", "M7 11l5 5l5 -5", "M12 4l0 12"],
  alert: ["M3 12a9 9 0 1 0 18 0a9 9 0 0 0 -18 0", "M12 8v4", "M12 16h.01"],
  bell: ["M10 5a2 2 0 1 1 4 0a7 7 0 0 1 4 6v3a4 4 0 0 0 2 3h-16a4 4 0 0 0 2 -3v-3a7 7 0 0 1 4 -6", "M9 17v1a3 3 0 0 0 6 0v-1"],
  bellOn: ["M10 5a2 2 0 1 1 4 0a7 7 0 0 1 4 6v3a4 4 0 0 0 2 3h-16a4 4 0 0 0 2 -3v-3a7 7 0 0 1 4 -6", "M9 17v1a3 3 0 0 0 6 0v-1", "M21 6.727a11.05 11.05 0 0 0 -2.794 -3.727", "M3 6.727a11.05 11.05 0 0 1 2.792 -3.727"],
  moon: ["M12 3c.132 0 .263 0 .393 0a7.5 7.5 0 0 0 7.92 12.446a9 9 0 1 1 -8.313 -12.454l0 .008"],
  sun: ["M8 12a4 4 0 1 0 8 0a4 4 0 1 0 -8 0", "M3 12h1m8 -9v1m8 8h1m-9 8v1m-6.4 -15.4l.7 .7m12.1 -.7l-.7 .7m0 11.4l.7 .7m-12.1 -.7l-.7 .7"],
};

export const WHATSAPP_SVG = '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M20.52 3.48A11.91 11.91 0 0 0 12.05 0C5.47 0 .12 5.35.12 11.93c0 2.1.55 4.16 1.6 5.97L.02 24l6.25-1.64a11.92 11.92 0 0 0 5.78 1.47h.01C18.64 23.83 24 18.48 24 11.9a11.87 11.87 0 0 0-3.48-8.42ZM12.05 21.8a9.89 9.89 0 0 1-5.04-1.38l-.36-.21-3.71.97.99-3.61-.24-.37a9.84 9.84 0 0 1-1.52-5.27c0-5.45 4.44-9.89 9.9-9.89a9.82 9.82 0 0 1 7 2.9 9.84 9.84 0 0 1 2.9 7c0 5.45-4.44 9.86-9.92 9.86Zm5.43-7.39c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.16-.17.2-.35.22-.64.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.18.2-.3.3-.5.1-.2.05-.37-.03-.52-.07-.15-.67-1.61-.92-2.2-.24-.58-.49-.5-.67-.5h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48s1.06 2.88 1.21 3.08c.15.2 2.1 3.2 5.09 4.49.71.3 1.26.48 1.7.61.71.23 1.36.2 1.87.12.57-.09 1.76-.72 2.01-1.41.25-.7.25-1.29.17-1.41-.07-.13-.27-.2-.57-.35Z"/></svg>';

// Question-type icons, shared with the landing page artwork.
export const TYPE_ICONS = {
  mcq: '<svg viewBox="0 0 32 32" aria-hidden="true"><circle cx="7" cy="8" r="3.5"/><circle cx="7" cy="8" r="1.2" fill="currentColor" stroke="none"/><path d="M16 8h12M16 16h12M16 24h8"/><circle cx="7" cy="16" r="2.5" opacity=".42"/><circle cx="7" cy="24" r="2.5" opacity=".42"/></svg>',
  tf: '<svg viewBox="0 0 32 32" aria-hidden="true"><circle cx="8" cy="16" r="7.5" fill="#16A34A" stroke="none"/><path d="m4.5 16 2.5 2.5 4.5-5" stroke="#fff" stroke-width="1.9"/><circle cx="24" cy="16" r="7.5" fill="#DC2626" stroke="none"/><path d="m21.5 13.5 5 5m0-5-5 5" stroke="#fff" stroke-width="1.9"/></svg>',
  fib: '<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M3 7h19M3 13h10m10 0h6M3 25h25" opacity=".5"/><path d="M4 18v3h17v-3M26 11v10m-2-10h4m-4 10h4"/></svg>',
  matching: '<svg viewBox="0 0 32 32" aria-hidden="true"><rect x="2" y="5" width="6" height="6" rx="1.2"/><rect x="24" y="5" width="6" height="6" rx="1.2"/><rect x="2" y="21" width="6" height="6" rx="1.2"/><rect x="24" y="21" width="6" height="6" rx="1.2"/><path d="M8 8c8 0 8 16 16 16M8 24c8 0 8-16 16-16"/></svg>',
};

/** Parses one of the trusted static SVG strings above into a node. */
export function staticSvg(markup) {
  const t = document.createElement('template');
  t.innerHTML = markup;
  return t.content.firstChild;
}
