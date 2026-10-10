// إدارة سمارت برو: the owner's notifications app (served at /admin/ and /preview/admin/ by server/push).
// Screens: sign-in, home (numbers), compose (audience, message, destination, time, preview, review), history,
// settings (test devices, install, password, sign out). Plain DOM, no framework.

const SITE_BASE = new URL('../', location.href); // the students' site: / or /preview/
const ICON = new URL('icon-192.png', location.href).href;

/* ---------- tiny DOM helpers ---------- */

function h(tag, attrs = {}, ...children) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v === false || v === null || v === undefined) continue;
    if (k === 'class') el.className = v;
    else if (k === 'style') el.style.cssText = v; // through the CSSOM: the page's security policy blocks style attributes
    else if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
    else el.setAttribute(k, v === true ? '' : v);
  }
  for (const c of children.flat()) if (c !== null && c !== undefined && c !== false) el.append(c.nodeType ? c : String(c));
  return el;
}
const PATHS = {
  home: ['M5 12l-2 0l9 -9l9 9l-2 0', 'M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2 -2v-7', 'M9 21v-6a2 2 0 0 1 2 -2h2a2 2 0 0 1 2 2v6'],
  send: ['M10 14l11 -11', 'M21 3l-6.5 18a.55 .55 0 0 1 -1 0l-3.5 -7l-7 -3.5a.55 .55 0 0 1 0 -1l18 -6.5'],
  list: ['M9 6l11 0', 'M9 12l11 0', 'M9 18l11 0', 'M5 6l0 .01', 'M5 12l0 .01', 'M5 18l0 .01'],
  gear: ['M10.325 4.317c.426 -1.756 2.924 -1.756 3.35 0a1.724 1.724 0 0 0 2.573 1.066c1.543 -.94 3.31 .826 2.37 2.37a1.724 1.724 0 0 0 1.065 2.572c1.756 .426 1.756 2.924 0 3.35a1.724 1.724 0 0 0 -1.066 2.573c.94 1.543 -.826 3.31 -2.37 2.37a1.724 1.724 0 0 0 -2.572 1.065c-.426 1.756 -2.924 1.756 -3.35 0a1.724 1.724 0 0 0 -2.573 -1.066c-1.543 .94 -3.31 -.826 -2.37 -2.37a1.724 1.724 0 0 0 -1.065 -2.572c-1.756 -.426 -1.756 -2.924 0 -3.35a1.724 1.724 0 0 0 1.066 -2.573c-.94 -1.543 .826 -3.31 2.37 -2.37c1 .608 2.296 .07 2.572 -1.065', 'M9 12a3 3 0 1 0 6 0a3 3 0 0 0 -6 0'],
  bell: ['M10 5a2 2 0 1 1 4 0a7 7 0 0 1 4 6v3a4 4 0 0 0 2 3h-16a4 4 0 0 0 2 -3v-3a7 7 0 0 1 4 -6', 'M9 17v1a3 3 0 0 0 6 0v-1'],
  users: ['M5 7a4 4 0 1 0 8 0a4 4 0 1 0 -8 0', 'M3 21v-2a4 4 0 0 1 4 -4h4a4 4 0 0 1 4 4v2', 'M16 3.13a4 4 0 0 1 0 7.75', 'M21 21v-2a4 4 0 0 0 -3 -3.85'],
  phone: ['M6 5a2 2 0 0 1 2 -2h8a2 2 0 0 1 2 2v14a2 2 0 0 1 -2 2h-8a2 2 0 0 1 -2 -2v-14z', 'M11 4h2', 'M12 17v.01'],
  logout: ['M14 8v-2a2 2 0 0 0 -2 -2h-7a2 2 0 0 0 -2 2v12a2 2 0 0 0 2 2h7a2 2 0 0 0 2 -2v-2', 'M9 12h12l-3 -3', 'M18 15l3 -3'],
  eye: ['M10 12a2 2 0 1 0 4 0a2 2 0 0 0 -4 0', 'M21 12c-2.4 4 -5.4 6 -9 6c-3.6 0 -6.6 -2 -9 -6c2.4 -4 5.4 -6 9 -6c3.6 0 6.6 2 9 6'],
  warn: ['M12 9v4', 'M10.363 3.591l-8.106 13.534a1.914 1.914 0 0 0 1.636 2.871h16.214a1.914 1.914 0 0 0 1.636 -2.87l-8.106 -13.536a1.914 1.914 0 0 0 -3.274 0z', 'M12 16h.01'],
  clock: ['M3 12a9 9 0 1 0 18 0a9 9 0 0 0 -18 0', 'M12 7v5l3 3'],
  copy: ['M7 9.667a2.667 2.667 0 0 1 2.667 -2.667h8.666a2.667 2.667 0 0 1 2.667 2.667v8.666a2.667 2.667 0 0 1 -2.667 2.667h-8.666a2.667 2.667 0 0 1 -2.667 -2.667z', 'M4.012 16.737a2.005 2.005 0 0 1 -1.012 -1.737v-10c0 -1.1 .9 -2 2 -2h10c.75 0 1.158 .385 1.5 1'],
  share: ['M8 9h-1a2 2 0 0 0 -2 2v8a2 2 0 0 0 2 2h10a2 2 0 0 0 2 -2v-8a2 2 0 0 0 -2 -2h-1', 'M12 14v-11', 'M9 6l3 -3l3 3'],
  add: ['M9 12h6', 'M12 9v6', 'M3 5a2 2 0 0 1 2 -2h14a2 2 0 0 1 2 2v14a2 2 0 0 1 -2 2h-14a2 2 0 0 1 -2 -2v-14'],
  download: ['M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2 -2v-2', 'M7 11l5 5l5 -5', 'M12 4l0 12'],
  check: ['M5 12l5 5l10 -10'],
};
function icon(name) {
  const ns = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(ns, 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('class', 'i');
  svg.setAttribute('aria-hidden', 'true');
  for (const d of PATHS[name]) {
    const p = document.createElementNS(ns, 'path');
    p.setAttribute('d', d);
    svg.append(p);
  }
  return svg;
}

const num = (n) => new Intl.NumberFormat('en-US').format(n);
const pct = (a, b) => (b ? Math.round((a / b) * 100) : 0);
const fmt = (ms, opts = {}) => new Intl.DateTimeFormat('ar-u-ca-gregory-nu-latn', { weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit', ...opts }).format(ms);
const ago = (ms) => {
  const m = Math.round((Date.now() - ms) / 60000);
  if (m < 1) return 'الآن';
  if (m < 60) return `قبل ${m} دقيقة`;
  if (m < 24 * 60) return `قبل ${Math.round(m / 60)} ساعة`;
  return fmt(ms, { weekday: undefined, hour: undefined, minute: undefined });
};

let toastTimer = 0;
function toast(text) {
  let el = document.querySelector('.toast');
  if (!el) document.body.append((el = h('p', { class: 'toast', role: 'status', 'aria-live': 'polite' })));
  el.textContent = text;
  el.classList.add('is-on');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('is-on'), 3400);
}

/** Bottom sheet; resolves with the value passed to close() ('' when dismissed). */
function sheet(build) {
  return new Promise((resolve) => {
    const dlg = h('dialog', { class: 'sheet' });
    const close = (v = '') => dlg.close(v);
    dlg.append(h('div', { class: 'sheet__body' }, h('span', { class: 'sheet__grip', 'aria-hidden': 'true' }), build(close)));
    dlg.addEventListener('close', () => { resolve(dlg.returnValue); dlg.remove(); });
    dlg.addEventListener('click', (e) => { if (e.target === dlg) close(); });
    document.body.append(dlg);
    dlg.showModal();
  });
}

/* ---------- server ---------- */

class SignedOut extends Error {}
async function api(path, body) {
  const res = await fetch(new URL(`api/${path}`, location.href), body === undefined
    ? { cache: 'no-store' }
    : { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const data = await res.json().catch(() => ({}));
  if (res.status === 401 && path !== 'login') throw new SignedOut();
  if (!res.ok) throw Object.assign(new Error(data.error || `HTTP ${res.status}`), { status: res.status });
  return data;
}

const state = { catalog: { courses: [] }, overview: null, history: [], tab: 'home', filter: 'all' };
const course = (id) => state.catalog.courses.find((c) => c.id === id);
const courseName = (id) => course(id)?.titleAr ?? id;
const audienceName = (id) => (id ? `مشتركو ${courseName(id)}` : 'كل المشتركين');
const audienceCount = (id) => (id ? state.overview.perCourse[id] || 0 : state.overview.total);
const ERRORS = {
  'no test device': 'لا يوجد جهاز تجربة بعد. أضفه من الإعدادات أولًا.',
  'title and body are required': 'اكتب العنوان والنص أولًا.',
  'too far ahead': 'أبعد موعد ممكن بعد 60 يومًا.',
  'too many attempts': 'محاولات كثيرة. انتظر 15 دقيقة ثم حاول مرة أخرى.',
  'wrong password': 'كلمة المرور غير صحيحة.',
  'too short': 'كلمة المرور الجديدة 10 أحرف على الأقل.',
};
const errorText = (err) => ERRORS[err.message] || 'تعذّر الاتصال بالخادم. تأكد من الإنترنت وحاول مرة أخرى.';

/* ---------- shell ---------- */

const root = document.getElementById('app');
const TABS = [['home', 'الرئيسية', 'home'], ['compose', 'تنبيه جديد', 'send'], ['history', 'السجل', 'list'], ['settings', 'الإعدادات', 'gear']];

function frame(title, sub, content) {
  root.replaceChildren(
    h('header', { class: 'bar' },
      h('img', { class: 'bar__logo', src: ICON, alt: '' }),
      h('div', { class: 'bar__title' }, h('h1', {}, title), sub ? h('p', {}, sub) : null),
      state.overview?.site === 'preview' ? h('span', { class: 'chip chip--warn' }, 'النسخة التجريبية') : null),
    h('main', { id: 'main' }, content),
    h('nav', { class: 'tabs', 'aria-label': 'الأقسام' }, TABS.map(([id, label, ic]) =>
      h('button', { type: 'button', class: 'tab', 'aria-current': state.tab === id ? 'page' : null, onclick: () => go(id) },
        h('span', { class: 'tab__pill' }, icon(ic)), label))));
  scrollTo(0, 0);
}

async function go(tab, opts = {}) {
  state.tab = tab;
  history.replaceState(null, '', `#${tab}`);
  try {
    if (tab === 'home') await showHome();
    else if (tab === 'compose') await showCompose(opts.draft);
    else if (tab === 'history') await showHistory();
    else await showSettings();
  } catch (err) {
    if (err instanceof SignedOut) showLogin();
    else toast(errorText(err));
  }
}

async function refresh() {
  [state.overview, state.history] = await Promise.all([api('overview'), api('history')]);
}

/* ---------- sign in ---------- */

function showLogin(message = '') {
  const pw = h('input', { class: 'input', type: 'password', id: 'pw', autocomplete: 'current-password', required: true, dir: 'ltr' });
  const err = h('p', { class: 'notice notice--err', role: 'alert', hidden: !message }, message);
  const btn = h('button', { type: 'submit', class: 'btn btn--primary btn--block' }, 'دخول');
  const toggle = h('button', { type: 'button', class: 'pw__toggle', 'aria-label': 'إظهار كلمة المرور', onclick: () => { pw.type = pw.type === 'password' ? 'text' : 'password'; } }, icon('eye'));
  root.replaceChildren(h('div', { class: 'login' }, h('form', {
    class: 'login__box',
    onsubmit: async (e) => {
      e.preventDefault();
      btn.disabled = true;
      err.hidden = true;
      try {
        await api('login', { password: pw.value });
        await start();
      } catch (error) {
        err.textContent = errorText(error);
        err.hidden = false;
        btn.disabled = false;
        pw.select();
      }
    },
  },
  h('div', { class: 'login__brand' }, h('img', { src: ICON, alt: '' }), h('h1', {}, 'إدارة سمارت برو'), h('p', {}, 'إرسال التنبيهات للطلاب ومتابعة نتائجها')),
  h('div', { class: 'card' },
    // A hidden account name, so the phone's password manager can save and fill the password.
    h('input', { type: 'text', name: 'username', autocomplete: 'username', value: 'smartpro', hidden: true, 'aria-hidden': 'true', tabindex: '-1' }),
    h('label', { class: 'field', for: 'pw' }, h('span', { class: 'label' }, 'كلمة المرور'), h('span', { class: 'pw' }, pw, toggle)),
    err, btn))));
  pw.focus();
}

/* ---------- a notification in the history ---------- */

const pathOf = (url) => {
  const u = new URL(url);
  u.searchParams.delete('n');
  return u.href.slice(SITE_BASE.href.length);
};

function messageCard(r, { compact = false } = {}) {
  const status = r.status === 'scheduled' ? h('span', { class: 'chip chip--info' }, icon('clock'), 'مجدول')
    : r.status === 'canceled' ? h('span', { class: 'chip chip--muted' }, 'ملغى')
    : r.status === 'sending' ? h('span', { class: 'chip chip--info' }, 'جارٍ الإرسال')
    : r.test ? h('span', { class: 'chip chip--muted' }, 'تجربة')
    : h('span', { class: 'chip chip--ok' }, 'أُرسل');
  const when = r.status === 'scheduled' ? `يُرسل ${fmt(r.sendAt)}` : r.status === 'canceled' ? `كان موعده ${fmt(r.sendAt)}` : fmt(r.sentAt || r.created);
  const card = h('article', { class: 'msg' },
    h('div', { class: 'msg__top' }, status, h('span', {}, r.test ? 'أجهزة التجربة' : audienceName(r.course)), h('span', { 'aria-hidden': 'true' }, '·'), h('span', {}, when)),
    h('p', { class: 'msg__title' }, r.title),
    compact ? null : h('p', { class: 'msg__body' }, r.body));
  if (r.status === 'sent') {
    card.append(h('dl', { class: 'msg__stats' },
      h('div', { class: 'msg__stat' }, h('dt', {}, 'وصل إلى'), h('dd', {}, num(r.delivered), r.total !== r.delivered ? h('small', { class: 'muted' }, ` من ${num(r.total)}`) : null)),
      h('div', { class: 'msg__stat' }, h('dt', {}, 'ضغطوا عليه'), h('dd', {}, num(r.clicks))),
      h('div', { class: 'msg__stat' }, h('dt', {}, 'نسبة الضغط'), h('dd', { dir: 'ltr' }, `${pct(r.clicks, r.delivered)}%`))));
  }
  if (!compact) {
    const actions = h('div', { class: 'msg__actions' },
      h('button', { type: 'button', class: 'btn btn--secondary btn--sm', onclick: () => go('compose', { draft: { course: r.course, title: r.title, body: r.body, path: pathOf(r.url) } }) }, icon('copy'), 'نسخ كتنبيه جديد'));
    if (r.status === 'scheduled') {
      actions.append(h('button', {
        type: 'button', class: 'btn btn--danger btn--sm',
        onclick: async () => {
          const ok = await sheet((close) => [h('h2', {}, 'إلغاء التنبيه المجدول؟'), h('p', { class: 'muted' }, `«${r.title}» لن يُرسل ${fmt(r.sendAt)}.`),
            h('div', { class: 'sheet__actions' }, h('button', { type: 'button', class: 'btn btn--secondary', onclick: () => close('') }, 'تراجع'), h('button', { type: 'button', class: 'btn btn--danger', onclick: () => close('yes') }, 'إلغاء الإرسال'))]);
          if (ok !== 'yes') return;
          try { await api('cancel', { id: r.id }); toast('تم إلغاء التنبيه المجدول.'); go(state.tab); } catch (err) { toast(errorText(err)); }
        },
      }, 'إلغاء الجدولة'));
    }
    card.append(actions);
  }
  return card;
}

/* ---------- home ---------- */

async function showHome() {
  await refresh();
  const o = state.overview;
  const real = state.history.filter((r) => !r.test);
  const last = real.find((r) => r.status === 'sent');
  const scheduled = real.filter((r) => r.status === 'scheduled').reverse();
  const max = Math.max(1, ...Object.values(o.perCourse));
  frame('إدارة سمارت برو', 'التنبيهات', [
    h('section', { class: 'hero', 'aria-label': 'المشتركون' },
      h('div', {}, h('p', { class: 'hero__label' }, 'المشتركون في التنبيهات'), h('p', { class: 'hero__num' }, num(o.total))),
      h('dl', { class: 'hero__row' },
        h('div', { class: 'hero__stat' }, h('dt', {}, 'جدد هذا الأسبوع'), h('dd', {}, num(o.newThisWeek))),
        h('div', { class: 'hero__stat' }, h('dt', {}, 'أوقفوا هذا الأسبوع'), h('dd', {}, num(o.leftThisWeek))))),
    h('button', { type: 'button', class: 'btn btn--primary btn--block', onclick: () => go('compose') }, icon('send'), 'تنبيه جديد'),
    o.total ? h('section', { class: 'card' },
      h('div', { class: 'card__head' }, h('h2', {}, 'المشتركون حسب المقرر')),
      h('ul', { class: 'bars' }, state.catalog.courses.map((c) => {
        const n = o.perCourse[c.id] || 0;
        return h('li', {}, h('div', { class: 'bars__top' }, h('span', {}, c.titleAr), h('strong', {}, num(n))),
          h('span', { class: 'bars__track' }, h('span', { class: 'bars__fill', style: `transform:scaleX(${n / max})` })));
      })))
      : h('section', { class: 'card empty' }, h('span', { class: 'empty__icon' }, icon('users')), h('h3', {}, 'لا يوجد مشتركون بعد'),
        h('p', {}, 'يشترك الطالب من الجرس في صفحة المقرر، أو من بطاقة «لا يفوتك الجديد» بعد نتيجة اختباره.')),
    scheduled.length ? h('section', { class: 'card' }, h('div', { class: 'card__head' }, h('h2', {}, 'مجدول')), h('div', { class: 'list' }, scheduled.map((r) => messageCard(r, { compact: true })))) : null,
    last ? h('section', { class: 'card' },
      h('div', { class: 'card__head' }, h('h2', {}, 'آخر تنبيه'), h('button', { type: 'button', class: 'link', onclick: () => go('history') }, 'السجل كاملًا')),
      messageCard(last, { compact: true })) : null,
  ]);
}

/* ---------- compose ---------- */

// Lengths that show in full: iPhone cuts a title after about 30 characters; the body shows 4 lines (iPhone) / 2 (Android).
const LIMITS = { title: { ideal: 30, max: 50 }, body: { ideal: 110, max: 150 } };
const TEMPLATES = [
  { label: 'أسئلة جديدة', title: (c) => `أسئلة جديدة في ${c}`, body: (c) => `أضفنا أسئلة جديدة في ${c}. ابدأ التدريب الآن.` },
  { label: 'الاختبار قرّب', title: () => 'اختبارك قرّب؟', body: (c) => `جرّب الاختبار النصفي التجريبي في ${c} واعرف مستواك قبل الاختبار.`, topic: 'midterm' },
  { label: 'اختبارات سابقة', title: () => 'أسئلة من اختبارات سابقة', body: (c) => `أضفنا أسئلة من اختبارات السنوات الماضية في ${c}. تدرّب عليها الآن.`, topic: 'past-exams' },
  { label: 'تذكير بالمذاكرة', title: () => 'وقت المراجعة', body: () => 'عشر دقائق تدريب اليوم تفرق في اختبارك. كمّل من حيث وقفت.' },
];

function meter(len, { ideal, max }) {
  const cls = len > max ? 'is-over' : len > ideal ? 'is-long' : '';
  return h('span', { class: `meter ${cls}` },
    h('span', { class: 'meter__track', 'aria-hidden': 'true' }, h('span', { class: 'meter__fill', style: `transform:scaleX(${Math.min(1, len / max)})` })), `${len}/${max}`);
}
const localInput = (ms) => new Date(ms - new Date(ms).getTimezoneOffset() * 60000).toISOString().slice(0, 16);

async function showCompose(draft) {
  if (!state.overview) await refresh();
  const o = state.overview;
  const d = { course: null, title: '', body: '', path: '', when: 'now', at: localInput(Date.now() + 60 * 60000), preview: 'ios', ...draft };

  // 1. audience
  const audience = h('div', { class: 'choices', role: 'radiogroup', 'aria-label': 'لمن يُرسل' },
    [null, ...state.catalog.courses.map((c) => c.id)].map((id) => h('label', { class: 'choice' },
      h('input', { type: 'radio', name: 'aud', value: id ?? 'all', checked: d.course === id, onchange: () => { d.course = id; d.path = ''; fillPaths(); update(); } }),
      h('span', { class: 'choice__dot', 'aria-hidden': 'true' }),
      h('span', { class: 'choice__name' }, id ? courseName(id) : 'كل المشتركين'),
      h('span', { class: 'choice__count' }, `${num(audienceCount(id))} مشترك`))));

  // 2. message
  const title = h('input', { class: 'input', id: 'title', maxlength: String(LIMITS.title.max), autocomplete: 'off', placeholder: 'مثال: أسئلة جديدة في رياضيات الأعمال' });
  const body = h('textarea', { class: 'input', id: 'body', maxlength: String(LIMITS.body.max), rows: '3', placeholder: 'مثال: أضفنا اختبارات سابقة للوحدات 1–4. ابدأ التدريب الآن.' });
  title.value = d.title;
  body.value = d.body;
  const titleMeter = h('span'), bodyMeter = h('span');
  title.addEventListener('input', () => { d.title = title.value; update(); });
  body.addEventListener('input', () => { d.body = body.value; update(); });
  const templates = h('div', { class: 'templates', role: 'group', 'aria-label': 'قوالب جاهزة' }, TEMPLATES.map((tp) => h('button', {
    type: 'button', class: 'template',
    onclick: () => {
      const c = d.course ? courseName(d.course) : 'مقرراتك';
      title.value = d.title = tp.title(c).slice(0, LIMITS.title.max);
      body.value = d.body = tp.body(c).slice(0, LIMITS.body.max);
      if (d.course && tp.topic && course(d.course).topics.some((t) => t.id === tp.topic)) { d.path = `courses/${d.course}/${tp.topic}`; fillPaths(); }
      update();
    },
  }, tp.label)));

  // 3. destination
  const path = h('select', { class: 'input', id: 'path', onchange: () => { d.path = path.value; } });
  function fillPaths() {
    const opts = d.course
      ? [[`courses/${d.course}`, `صفحة المقرر: ${courseName(d.course)}`], ...course(d.course).topics.map((t) => [`courses/${d.course}/${t.id}`, `${t.label?.ar ?? `الموضوع ${t.number}`}: ${t.title}`])]
      : [['', 'الصفحة الرئيسية للتطبيق'], ...state.catalog.courses.map((c) => [`courses/${c.id}`, `صفحة ${c.titleAr}`])];
    path.replaceChildren(...opts.map(([v, label]) => h('option', { value: v }, label)));
    if (!opts.some(([v]) => v === d.path)) d.path = opts[0][0];
    path.value = d.path;
  }

  // 4. time
  const at = h('input', { class: 'input', type: 'datetime-local', id: 'at', dir: 'ltr', min: localInput(Date.now() + 5 * 60000), max: localInput(Date.now() + 59 * 24 * 3600000) });
  at.value = d.at;
  at.addEventListener('input', () => { d.at = at.value; update(); });
  const atWrap = h('div', { class: 'field', hidden: d.when !== 'later' }, h('label', { class: 'label', for: 'at' }, 'التاريخ والوقت'), at,
    h('p', { class: 'hint' }, 'أفضل وقت لطلاب الجامعة: من 11 صباحًا إلى 1 ظهرًا، وبعد 8 مساءً.'));
  const segs = h('div', { class: 'seg', role: 'group', 'aria-label': 'وقت الإرسال' });
  for (const [when, label] of [['now', 'الآن'], ['later', 'وقت محدد']]) {
    segs.append(h('button', { type: 'button', 'aria-pressed': String(d.when === when), onclick: (e) => { d.when = when; for (const b of segs.children) b.setAttribute('aria-pressed', String(b === e.currentTarget)); atWrap.hidden = when !== 'later'; update(); } }, label));
  }

  // 5. preview
  const pvWrap = h('div');
  const pvSeg = h('div', { class: 'seg', role: 'group', 'aria-label': 'شكل المعاينة' });
  for (const [k, label] of [['ios', 'آيفون'], ['android', 'أندرويد']]) {
    pvSeg.append(h('button', { type: 'button', 'aria-pressed': String(d.preview === k), onclick: (e) => { d.preview = k; for (const b of pvSeg.children) b.setAttribute('aria-pressed', String(b === e.currentTarget)); update(); } }, label));
  }

  const warn = h('div', { class: 'list' });
  const testBtn = h('button', { type: 'button', class: 'btn btn--secondary', onclick: () => submit(true) }, 'إرسال تجربة');
  const sendBtn = h('button', { type: 'button', class: 'btn btn--primary', onclick: () => submit(false) }, 'مراجعة وإرسال');

  function update() {
    titleMeter.replaceChildren(meter(d.title.length, LIMITS.title));
    bodyMeter.replaceChildren(meter(d.body.length, LIMITS.body));
    const ios = d.preview === 'ios';
    pvWrap.replaceChildren(h('div', { class: `phone phone--${d.preview}` },
      h('p', { class: 'phone__time' }, ios ? fmt(Date.now(), { weekday: 'long', day: 'numeric', month: 'long', hour: undefined, minute: undefined }) : 'الإشعارات'),
      h('div', { class: `pv pv--${d.preview}` },
        h('img', { class: 'pv__icon', src: new URL('assets/icons/icon-192.png', SITE_BASE).href, alt: '' }),
        h('div', { class: 'pv__copy' },
          h('div', { class: 'pv__head' }, h('span', {}, 'سمارت برو'), h('span', {}, 'الآن')),
          h('p', { class: 'pv__title' }, d.title.trim() || 'عنوان التنبيه'),
          h('p', { class: 'pv__body' }, d.body.trim() || 'نص التنبيه يظهر هنا.')))));
    // Frequency guidance: at most one a day and about five a week to the same students, or they turn them off.
    const same = o.sends.filter((s) => !d.course || !s.course || s.course === d.course);
    const today = same.filter((s) => Date.now() - s.sentAt < 24 * 3600 * 1000).length;
    const notes = [];
    if (today) notes.push(`أرسلت لهذا الجمهور ${today === 1 ? 'تنبيهًا' : `${today} تنبيهات`} خلال آخر 24 ساعة. الأفضل تنبيه واحد في اليوم كحد أقصى.`);
    else if (same.length >= 4) notes.push(`أرسلت لهذا الجمهور ${same.length} تنبيهات هذا الأسبوع. أكثر من 5 في الأسبوع يدفع الطلاب لإيقاف التنبيهات.`);
    if (d.title.length > LIMITS.title.ideal) notes.push('العنوان أطول من 30 حرفًا، وقد يظهر مقصوصًا على الآيفون.');
    warn.replaceChildren(...notes.map((n) => h('p', { class: 'notice notice--warn' }, icon('warn'), h('span', {}, n))));
    testBtn.disabled = !o.testDevices.length;
    sendBtn.textContent = d.when === 'later' ? 'مراجعة وجدولة' : 'مراجعة وإرسال';
  }

  async function submit(test) {
    const titleText = d.title.trim(), bodyText = d.body.trim();
    if (!titleText || !bodyText) { toast('اكتب العنوان والنص أولًا.'); (titleText ? body : title).focus(); return; }
    const later = !test && d.when === 'later';
    const atMs = later ? new Date(d.at).getTime() : null;
    if (later && !(atMs > Date.now() + 2 * 60000)) { toast('اختر وقتًا بعد دقائق من الآن على الأقل.'); at.focus(); return; }
    const count = audienceCount(d.course);
    if (!test && !count) { toast('لا يوجد مشتركون في هذا الجمهور بعد.'); return; }
    if (!test) {
      const ok = await sheet((close) => [
        h('h2', {}, later ? 'مراجعة قبل الجدولة' : 'مراجعة قبل الإرسال'),
        h('dl', { class: 'review' },
          h('div', {}, h('dt', {}, 'إلى'), h('dd', {}, `${audienceName(d.course)} (${num(count)} مشترك)`)),
          h('div', {}, h('dt', {}, 'العنوان'), h('dd', {}, titleText)),
          h('div', {}, h('dt', {}, 'النص'), h('dd', {}, bodyText)),
          h('div', {}, h('dt', {}, 'يفتح'), h('dd', {}, path.selectedOptions[0]?.textContent)),
          h('div', {}, h('dt', {}, 'الوقت'), h('dd', {}, later ? fmt(atMs) : 'الآن'))),
        h('p', { class: 'hint' }, later ? 'يمكنك إلغاؤه من السجل قبل موعده.' : 'لا يمكن التراجع بعد الإرسال.'),
        h('div', { class: 'sheet__actions' },
          h('button', { type: 'button', class: 'btn btn--secondary', onclick: () => close('') }, 'تعديل'),
          h('button', { type: 'button', class: 'btn btn--primary', onclick: () => close('yes') }, later ? 'جدولة' : 'إرسال الآن')),
      ]);
      if (ok !== 'yes') return;
    }
    for (const b of [testBtn, sendBtn]) b.disabled = true;
    try {
      const r = await api('send', { title: titleText, body: bodyText, course: d.course, path: d.path, test, at: atMs });
      if (test) {
        toast(r.delivered ? `وصلت التجربة إلى ${r.delivered} من ${r.total} ${r.total === 1 ? 'جهاز' : 'أجهزة'}.` : 'لم تصل التجربة. أعد إضافة جهاز التجربة من الإعدادات.');
      } else {
        toast(later ? `تمت الجدولة: يُرسل ${fmt(atMs)}.` : `تم الإرسال: وصل إلى ${num(r.delivered)} من ${num(r.total)}.`);
        await go('history');
        return;
      }
    } catch (err) {
      if (err instanceof SignedOut) return showLogin();
      toast(errorText(err));
    }
    for (const b of [testBtn, sendBtn]) b.disabled = false;
    update();
  }

  const step = (n, label, ...content) => h('section', { class: 'card step' }, h('div', { class: 'step__head' }, h('span', { class: 'step__num' }, String(n)), h('h2', {}, label)), ...content);
  frame('تنبيه جديد', null, [
    step(1, 'لمن يُرسل؟', audience),
    step(2, 'الرسالة', templates,
      h('div', { class: 'field' }, h('div', { class: 'field__top' }, h('label', { class: 'label', for: 'title' }, 'العنوان'), titleMeter), title),
      h('div', { class: 'field' }, h('div', { class: 'field__top' }, h('label', { class: 'label', for: 'body' }, 'النص'), bodyMeter), body)),
    step(3, 'ماذا يفتح عند الضغط عليه؟', path),
    step(4, 'متى يُرسل؟', segs, atWrap),
    step(5, 'المعاينة', pvSeg, pvWrap),
    warn,
    o.testDevices.length ? null : h('p', { class: 'notice notice--info' }, icon('phone'), h('span', {}, 'لتجربة التنبيه على جوالك قبل إرساله للطلاب، أضف جوالك كجهاز تجربة من الإعدادات.')),
    h('div', { class: 'sticky' }, testBtn, sendBtn),
  ]);
  fillPaths();
  update();
}

/* ---------- history ---------- */

async function showHistory() {
  await refresh();
  const FILTERS = [['all', 'الكل'], ['sent', 'أُرسل'], ['scheduled', 'مجدول'], ['test', 'تجارب']];
  const listEl = h('div', { class: 'list' });
  const draw = () => {
    const rows = state.history.filter((r) => (state.filter === 'all' ? true : state.filter === 'test' ? r.test : !r.test && r.status === state.filter));
    listEl.replaceChildren(...(rows.length ? rows.map((r) => messageCard(r))
      : [h('div', { class: 'card empty' }, h('span', { class: 'empty__icon' }, icon('bell')), h('h3', {}, 'لا شيء هنا بعد'), h('p', {}, 'التنبيهات التي ترسلها أو تجدولها تظهر هنا مع عدد من وصلهم ومن ضغط عليها.'))]));
  };
  const filters = h('div', { class: 'filters', role: 'group', 'aria-label': 'تصفية' }, FILTERS.map(([k, label]) => h('button', {
    type: 'button', class: 'filter', 'aria-pressed': String(state.filter === k),
    onclick: (e) => { state.filter = k; for (const b of filters.children) b.setAttribute('aria-pressed', String(b === e.currentTarget)); draw(); },
  }, label)));
  frame('السجل', null, [filters, listEl]);
  draw();
}

/* ---------- settings ---------- */

let installPrompt = null;
addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); installPrompt = e; });
const standalone = () => matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
const isIOS = () => /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
const b64 = (s) => Uint8Array.from(atob((s + '='.repeat((4 - (s.length % 4)) % 4)).replace(/-/g, '+').replace(/_/g, '/')), (c) => c.charCodeAt(0));
const deviceLabel = () => (isIOS() ? 'آيفون' : /Android/.test(navigator.userAgent) ? 'أندرويد' : 'كمبيوتر');

async function thisDevice() {
  const reg = await navigator.serviceWorker?.getRegistration(location.href);
  return (await reg?.pushManager?.getSubscription()) ?? null;
}

async function showSettings() {
  await refresh();
  const o = state.overview;
  const pushOk = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
  const sub = pushOk ? await thisDevice().catch(() => null) : null;
  const mine = Boolean(sub);

  const deviceBtn = h('button', { type: 'button', class: mine ? 'btn btn--danger btn--sm' : 'btn btn--primary btn--sm' }, mine ? 'إيقاف' : 'إضافة');
  deviceBtn.onclick = async () => {
    deviceBtn.disabled = true;
    try {
      if (mine) {
        await api('test-devices/remove', { endpoint: sub.endpoint });
        await sub.unsubscribe();
        toast('لن يستقبل هذا الجهاز التجارب بعد الآن.');
      } else {
        if (isIOS() && !standalone()) { toast('على الآيفون: ثبّت تطبيق الإدارة على الشاشة الرئيسية أولًا (الخطوات بالأسفل).'); return; }
        if (await Notification.requestPermission() !== 'granted') { toast('لم يتم السماح بالتنبيهات على هذا الجهاز.'); return; }
        const reg = await navigator.serviceWorker.ready;
        const s = (await reg.pushManager.getSubscription()) || await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64(o.vapidKey) });
        await api('test-devices', { subscription: s.toJSON(), label: deviceLabel() });
        toast('تم: هذا الجهاز يستقبل تنبيهات التجربة.');
      }
      await showSettings();
    } catch (err) {
      if (err instanceof SignedOut) return showLogin();
      toast(errorText(err));
    } finally {
      deviceBtn.disabled = false;
    }
  };

  const devices = h('div', { class: 'rows' },
    pushOk ? h('div', { class: 'row' }, h('span', { class: 'row__icon' }, icon('phone')),
      h('div', { class: 'row__copy' }, h('strong', {}, 'هذا الجهاز'), h('span', {}, mine ? 'يستقبل تنبيهات التجربة' : 'لا يستقبل تنبيهات التجربة')), deviceBtn)
      : h('p', { class: 'notice notice--info' }, icon('phone'), h('span', {}, isIOS() && !standalone()
        ? 'لتستقبل التجارب على هذا الآيفون: ثبّت تطبيق الإدارة على الشاشة الرئيسية (الخطوات بالأسفل) ثم افتحه من أيقونته.'
        : 'هذا المتصفح لا يدعم التنبيهات. افتح تطبيق الإدارة من كروم أو سفاري.')),
    o.testDevices.length ? o.testDevices.map((dv) => h('div', { class: 'row' }, h('span', { class: 'row__icon' }, icon('bell')),
      h('div', { class: 'row__copy' }, h('strong', {}, dv.label || 'جهاز'), h('span', {}, `أُضيف ${ago(dv.created)}`)),
      h('button', { type: 'button', class: 'link', onclick: async () => { await api('test-devices/remove', { id: dv.id }); toast('تمت إزالة الجهاز.'); showSettings(); } }, 'إزالة')))
      : h('p', { class: 'muted small' }, 'لا يوجد جهاز تجربة بعد. «إرسال تجربة» يصل لأجهزة التجربة فقط، قبل أي إرسال للطلاب.'));

  let install;
  if (standalone()) install = h('p', { class: 'notice notice--ok' }, icon('check'), h('span', {}, 'تطبيق الإدارة مثبّت على هذا الجهاز.'));
  else if (installPrompt) install = h('button', { type: 'button', class: 'btn btn--primary btn--block', onclick: async () => { installPrompt.prompt(); await installPrompt.userChoice; installPrompt = null; showSettings(); } }, icon('download'), 'تثبيت تطبيق الإدارة');
  else if (isIOS()) install = h('ol', { class: 'steps' },
    h('li', {}, 'اضغط ', h('span', { class: 'key' }, icon('share')), ' «مشاركة» في شريط سفاري'),
    h('li', {}, 'اختر ', h('strong', {}, 'إضافة إلى الشاشة الرئيسية'), ' ', h('span', { class: 'key' }, icon('add'))),
    h('li', {}, 'افتح «إدارة سمارت برو» من أيقونته وسجّل الدخول مرة واحدة'));
  else install = h('p', { class: 'muted small' }, 'من قائمة المتصفح (⋮) اختر «تثبيت التطبيق» أو «إضافة إلى الشاشة الرئيسية».');

  const cur = h('input', { class: 'input', type: 'password', autocomplete: 'current-password', dir: 'ltr', id: 'cur', required: true });
  const nxt = h('input', { class: 'input', type: 'password', autocomplete: 'new-password', dir: 'ltr', id: 'nxt', minlength: '10', required: true });
  const pwForm = h('form', {
    class: 'step',
    onsubmit: async (e) => {
      e.preventDefault();
      try {
        await api('password', { current: cur.value, next: nxt.value });
        cur.value = nxt.value = '';
        toast('تم تغيير كلمة المرور. الأجهزة الأخرى ستطلب الدخول من جديد.');
      } catch (err) {
        if (err instanceof SignedOut) return showLogin();
        toast(errorText(err));
      }
    },
  },
  h('div', { class: 'field' }, h('label', { class: 'label', for: 'cur' }, 'كلمة المرور الحالية'), cur),
  h('div', { class: 'field' }, h('label', { class: 'label', for: 'nxt' }, 'كلمة المرور الجديدة'), nxt, h('p', { class: 'hint' }, '10 أحرف على الأقل.')),
  h('button', { type: 'submit', class: 'btn btn--secondary' }, 'تغيير كلمة المرور'));

  frame('الإعدادات', null, [
    h('section', { class: 'card' }, h('div', { class: 'card__head' }, h('h2', {}, 'أجهزة التجربة')), devices),
    h('section', { class: 'card' }, h('div', { class: 'card__head' }, h('h2', {}, 'تثبيت تطبيق الإدارة')), install),
    h('section', { class: 'card' }, h('div', { class: 'card__head' }, h('h2', {}, 'كلمة المرور')), pwForm),
    h('button', {
      type: 'button', class: 'btn btn--danger btn--block',
      onclick: async () => { try { await api('logout', {}); } catch { /* signed out anyway */ } showLogin(); },
    }, icon('logout'), 'تسجيل الخروج'),
  ]);
}

/* ---------- start ---------- */

async function start() {
  state.catalog = await (await fetch(new URL('data/catalog.json', SITE_BASE), { cache: 'no-cache' })).json();
  const tab = location.hash.slice(1);
  await go(TABS.some(([id]) => id === tab) ? tab : 'home');
}

navigator.serviceWorker?.register(new URL('sw.js', location.href), { scope: './' }).catch(() => {});
(async () => {
  try {
    await refresh();
    await start();
  } catch (err) {
    if (err instanceof SignedOut) showLogin();
    else root.replaceChildren(h('div', { class: 'login' }, h('p', { class: 'notice notice--err' }, errorText(err))));
  }
})();
