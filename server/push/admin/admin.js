// إدارة سمارت برو: the owner's notifications app (served at /admin/ and /preview/admin/ by server/push).
// Built from the students' app's own pieces (element builder, icons, sheets, theme, stylesheets), so it looks and
// behaves like Smart Pro. Screens: sign-in, home, new notification, history, settings.

import { h, icon, ICONS } from '../assets/js/quiz/dom.js';
import { confirmDialog, openSheet } from '../assets/js/quiz/dialog.js';
import { initTheme, toggleTheme, theme } from '../assets/js/app/theme.js';

const SITE = new URL('../', location.href); // the students' site: / or /preview/
const asset = (path) => new URL(path, SITE).href;

const I = {
  send: ['M10 14l11 -11', 'M21 3l-6.5 18a.55 .55 0 0 1 -1 0l-3.5 -7l-7 -3.5a.55 .55 0 0 1 0 -1l18 -6.5'],
  list: ['M9 6l11 0', 'M9 12l11 0', 'M9 18l11 0', 'M5 6l0 .01', 'M5 12l0 .01', 'M5 18l0 .01'],
  gear: ['M10.325 4.317c.426 -1.756 2.924 -1.756 3.35 0a1.724 1.724 0 0 0 2.573 1.066c1.543 -.94 3.31 .826 2.37 2.37a1.724 1.724 0 0 0 1.065 2.572c1.756 .426 1.756 2.924 0 3.35a1.724 1.724 0 0 0 -1.066 2.573c.94 1.543 -.826 3.31 -2.37 2.37a1.724 1.724 0 0 0 -2.572 1.065c-.426 1.756 -2.924 1.756 -3.35 0a1.724 1.724 0 0 0 -2.573 -1.066c-1.543 .94 -3.31 -.826 -2.37 -2.37a1.724 1.724 0 0 0 -1.065 -2.572c-1.756 -.426 -1.756 -2.924 0 -3.35a1.724 1.724 0 0 0 1.066 -2.573c-.94 -1.543 .826 -3.31 2.37 -2.37c1 .608 2.296 .07 2.572 -1.065', 'M9 12a3 3 0 1 0 6 0a3 3 0 0 0 -6 0'],
  users: ['M5 7a4 4 0 1 0 8 0a4 4 0 1 0 -8 0', 'M3 21v-2a4 4 0 0 1 4 -4h4a4 4 0 0 1 4 4v2', 'M16 3.13a4 4 0 0 1 0 7.75', 'M21 21v-2a4 4 0 0 0 -3 -3.85'],
  phone: ['M6 5a2 2 0 0 1 2 -2h8a2 2 0 0 1 2 2v14a2 2 0 0 1 -2 2h-8a2 2 0 0 1 -2 -2v-14z', 'M11 4h2', 'M12 17v.01'],
  logout: ['M14 8v-2a2 2 0 0 0 -2 -2h-7a2 2 0 0 0 -2 2v12a2 2 0 0 0 2 2h7a2 2 0 0 0 2 -2v-2', 'M9 12h12l-3 -3', 'M18 15l3 -3'],
  eye: ['M10 12a2 2 0 1 0 4 0a2 2 0 0 0 -4 0', 'M21 12c-2.4 4 -5.4 6 -9 6c-3.6 0 -6.6 -2 -9 -6c2.4 -4 5.4 -6 9 -6c3.6 0 6.6 2 9 6'],
  clock: ['M3 12a9 9 0 1 0 18 0a9 9 0 0 0 -18 0', 'M12 7v5l3 3'],
  copy: ['M7 9.667a2.667 2.667 0 0 1 2.667 -2.667h8.666a2.667 2.667 0 0 1 2.667 2.667v8.666a2.667 2.667 0 0 1 -2.667 2.667h-8.666a2.667 2.667 0 0 1 -2.667 -2.667z', 'M4.012 16.737a2.005 2.005 0 0 1 -1.012 -1.737v-10c0 -1.1 .9 -2 2 -2h10c.75 0 1.158 .385 1.5 1'],
};

const num = (n) => new Intl.NumberFormat('en-US').format(n);
const pct = (a, b) => (b ? Math.round((a / b) * 100) : 0);
const fmt = (ms, opts = {}) => new Intl.DateTimeFormat('ar-u-ca-gregory-nu-latn', { weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit', ...opts }).format(ms);
const rtf = new Intl.RelativeTimeFormat('ar-u-nu-latn', { numeric: 'auto' });
const ago = (ms) => {
  const m = Math.round((Date.now() - ms) / 60000);
  if (m < 1) return 'الآن';
  if (m < 60) return rtf.format(-m, 'minute');
  if (m < 24 * 60) return rtf.format(-Math.round(m / 60), 'hour');
  return fmt(ms, { weekday: undefined, hour: undefined, minute: undefined });
};

let toastTimer = 0;
function toast(text) {
  let el = document.getElementById('toast');
  if (!el) document.body.append((el = h('p', { id: 'toast', class: 'toast', role: 'status', 'aria-live': 'polite' })));
  el.textContent = text;
  el.classList.add('is-on');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('is-on'), 3400);
}
const note = (kind, iconPaths, text) => h('p', { class: `msg-note msg-note--${kind}` }, icon(...iconPaths), h('span', {}, text));

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
const refresh = async () => { [state.overview, state.history] = await Promise.all([api('overview'), api('history')]); };

/* ---------- header (the app's own) and screens ---------- */

function header() {
  const themeBtn = h('button', { type: 'button', class: 'hdr__btn' });
  const paint = () => {
    const dark = theme() === 'dark';
    themeBtn.replaceChildren(icon(...(dark ? ICONS.sun : ICONS.moon)));
    themeBtn.setAttribute('aria-label', dark ? 'الوضع النهاري' : 'الوضع الليلي');
    document.querySelector('meta[name="theme-color"]').content = dark ? '#0E1513' : '#FFFFFF';
  };
  themeBtn.onclick = () => { toggleTheme(); paint(); };
  paint();
  document.getElementById('hdr').replaceChildren(
    h('div', { class: 'hdr__side' }, themeBtn),
    h('span', { class: 'hdr__brand', 'aria-label': 'سمارت برو' },
      h('img', { class: 'logo--light', src: asset('assets/img/logo-mark.png'), width: '160', height: '160', alt: 'سمارت برو' }),
      h('img', { class: 'logo--dark', src: asset('assets/img/logo-mark-dark.png'), width: '160', height: '160', alt: 'سمارت برو' })),
    h('div', { class: 'hdr__side hdr__side--end' }, state.overview?.site === 'preview' ? h('span', { class: 'chip chip--warn' }, 'تجريبي') : null));
}

const root = document.getElementById('app');
const TABS = [['home', 'الرئيسية', ICONS.home], ['compose', 'تنبيه جديد', I.send], ['history', 'السجل', I.list], ['settings', 'الإعدادات', I.gear]];

function screen(title, sub, body, end = null) {
  header();
  root.replaceChildren(h('div', { class: 'screen' },
    h('div', { class: 'pagebar' }, h('div', { class: 'pagebar__row' },
      h('div', { class: 'pagebar__title' }, h('h1', {}, title), sub ? h('p', {}, sub) : null),
      end ? h('div', { class: 'pagebar__end' }, end) : null)),
    h('main', { class: 'body' }, body),
    h('nav', { class: 'tabbar', 'aria-label': 'الأقسام' }, TABS.map(([id, label, paths]) =>
      h('button', { type: 'button', class: `tab${state.tab === id ? ' is-active' : ''}`, 'aria-current': state.tab === id ? 'page' : null, onclick: () => go(id) },
        h('span', { class: 'tab__icon' }, icon(...paths)), h('span', { class: 'tab__label' }, label))))));
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

/* ---------- sign in ---------- */

function showLogin() {
  header();
  const pw = h('input', { class: 'input', type: 'password', id: 'pw', autocomplete: 'current-password', autocapitalize: 'off', autocorrect: 'off', spellcheck: 'false', required: true, dir: 'ltr' });
  const err = h('p', { class: 'msg-note msg-note--err', role: 'alert', hidden: true });
  const btn = h('button', { type: 'submit', class: 'btn btn--primary btn--block' }, 'دخول');
  const eye = h('button', { type: 'button', class: 'pw__btn', 'aria-label': 'إظهار كلمة المرور', onclick: () => { pw.type = pw.type === 'password' ? 'text' : 'password'; } }, icon(...I.eye));
  root.replaceChildren(h('div', { class: 'screen' }, h('main', { class: 'body login' }, h('form', {
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
      }
    },
  },
  h('div', { class: 'login__head' }, h('h1', {}, 'إدارة سمارت برو'), h('p', {}, 'إرسال التنبيهات للطلاب ومتابعة نتائجها')),
  h('div', { class: 'card' },
    // A hidden account name, so the phone's password manager can save and fill the password.
    h('input', { type: 'text', name: 'username', autocomplete: 'username', value: 'smartpro', hidden: true, tabindex: '-1', 'aria-hidden': 'true' }),
    h('div', { class: 'field' }, h('label', { class: 'field__label', for: 'pw' }, 'كلمة المرور'), h('div', { class: 'pw' }, pw, eye)),
    err, btn)))));
  pw.focus();
}

/* ---------- a notification in the history ---------- */

const pathOf = (url) => {
  const u = new URL(url);
  u.searchParams.delete('n');
  return u.href.slice(SITE.href.length);
};

function sentCard(r, { compact = false } = {}) {
  const status = r.status === 'scheduled' ? h('span', { class: 'chip' }, icon(...I.clock), 'مجدول')
    : r.status === 'canceled' ? h('span', { class: 'chip chip--muted' }, 'ملغى')
    : r.status === 'sending' ? h('span', { class: 'chip' }, 'جارٍ الإرسال')
    : r.test ? h('span', { class: 'chip chip--muted' }, 'تجربة')
    : h('span', { class: 'chip' }, 'أُرسل');
  const when = r.status === 'scheduled' ? `يُرسل ${fmt(r.sendAt)}` : r.status === 'canceled' ? `كان موعده ${fmt(r.sendAt)}` : fmt(r.sentAt || r.created);
  const card = h('article', { class: 'card sent' },
    h('div', { class: 'sent__top' }, status, h('span', {}, r.test ? 'أجهزة التجربة' : audienceName(r.course)), h('span', { 'aria-hidden': 'true' }, '·'), h('span', {}, when)),
    h('p', { class: 'sent__title' }, r.title),
    compact ? null : h('p', { class: 'sent__body' }, r.body));
  if (r.status === 'sent') {
    card.append(h('dl', { class: 'sent__stats' },
      h('div', {}, h('dt', {}, 'وصل إلى'), h('dd', {}, num(r.delivered))),
      h('div', {}, h('dt', {}, 'ضغطوا عليه'), h('dd', {}, num(r.clicks))),
      h('div', {}, h('dt', {}, 'نسبة الضغط'), h('dd', { dir: 'ltr' }, `${pct(r.clicks, r.delivered)}%`))));
  }
  if (!compact) {
    const actions = h('div', { class: 'sent__actions' },
      h('button', { type: 'button', class: 'btn btn--secondary btn--sm', onclick: () => go('compose', { draft: { course: r.course, title: r.title, body: r.body, path: pathOf(r.url) } }) }, icon(...I.copy), 'نسخ كتنبيه جديد'));
    if (r.status === 'scheduled') {
      actions.append(h('button', {
        type: 'button', class: 'btn btn--secondary btn--sm',
        onclick: async () => {
          const choice = await confirmDialog({
            title: 'إلغاء التنبيه المجدول؟',
            text: `«${r.title}» لن يُرسل ${fmt(r.sendAt)}.`,
            actions: [{ label: 'تراجع', value: '' }, { label: 'إلغاء الإرسال', value: 'yes', primary: true }],
          });
          if (choice !== 'yes') return;
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
  screen('التنبيهات', 'إدارة سمارت برو', [
    h('section', { class: 'card course-hero' },
      h('p', { class: 'course-hero__en' }, 'المشتركون في التنبيهات'),
      h('p', { class: 'course-hero__ar' }, 'الجدد والموقفون: آخر 7 أيام'),
      h('dl', { class: 'course-hero__stats' },
        h('div', {}, h('dt', {}, 'المشتركون'), h('dd', {}, num(o.total))),
        h('div', {}, h('dt', {}, 'جدد'), h('dd', {}, num(o.newThisWeek))),
        h('div', {}, h('dt', {}, 'أوقفوا'), h('dd', {}, num(o.leftThisWeek))))),
    h('button', { type: 'button', class: 'btn btn--primary btn--block', onclick: () => go('compose') }, icon(...I.send), 'تنبيه جديد'),
    h('div', { class: 'section-head' }, h('h2', {}, 'المشتركون حسب المقرر')),
    o.total
      ? h('ul', { class: 'card counts' }, state.catalog.courses.map((c) => {
          const n = o.perCourse[c.id] || 0;
          return h('li', {}, h('div', { class: 'counts__top' }, h('span', {}, c.titleAr), h('strong', {}, num(n))),
            h('div', { class: 'meter', role: 'presentation' }, h('span', { style: `transform:scaleX(${n / max})` })));
        }))
      : h('div', { class: 'card empty' }, h('span', { class: 'empty__icon' }, icon(...I.users)), h('h2', {}, 'لا يوجد مشتركون بعد'),
          h('p', {}, 'يشترك الطالب من الجرس في صفحة المقرر، أو من بطاقة «لا يفوتك الجديد» بعد نتيجة اختباره.')),
    scheduled.length ? [h('div', { class: 'section-head' }, h('h2', {}, 'مجدول')), scheduled.map((r) => sentCard(r, { compact: true }))] : null,
    last ? [h('div', { class: 'section-head' }, h('h2', {}, 'آخر تنبيه'), h('a', { href: '#history', onclick: (e) => { e.preventDefault(); go('history'); } }, 'السجل كاملًا')), sentCard(last, { compact: true })] : null,
  ]);
}

/* ---------- new notification ---------- */

// Lengths that show in full: iPhone cuts a title after about 30 characters; the body shows 4 lines (iPhone) / 2 (Android).
const LIMITS = { title: { ideal: 30, max: 50 }, body: { ideal: 110, max: 150 } };
const TEMPLATES = [
  { label: 'أسئلة جديدة', title: (c) => `أسئلة جديدة في ${c}`, body: (c) => `أضفنا أسئلة جديدة في ${c}. ابدأ التدريب الآن.` },
  { label: 'الاختبار قرّب', title: () => 'اختبارك قرّب؟', body: (c) => `جرّب الاختبار النصفي التجريبي في ${c} واعرف مستواك قبل الاختبار.`, topic: 'midterm' },
  { label: 'اختبارات سابقة', title: () => 'أسئلة من اختبارات سابقة', body: (c) => `أضفنا أسئلة من اختبارات السنوات الماضية في ${c}. تدرّب عليها الآن.`, topic: 'past-exams' },
  { label: 'تذكير بالمذاكرة', title: () => 'وقت المراجعة', body: () => 'عشر دقائق تدريب اليوم تفرق في اختبارك. كمّل من حيث وقفت.' },
];
const lenMeter = (len, { ideal, max }) => h('span', { class: `len${len > max ? ' is-over' : len > ideal ? ' is-long' : ''}` },
  h('span', { class: 'meter', 'aria-hidden': 'true' }, h('span', { style: `transform:scaleX(${Math.min(1, len / max)})` })), `${len}/${max}`);
const localInput = (ms) => new Date(ms - new Date(ms).getTimezoneOffset() * 60000).toISOString().slice(0, 16);

function segs(name, items, current, onchange) {
  return h('div', { class: 'segs', role: 'radiogroup' }, items.map(([value, label]) => h('label', { class: 'seg' },
    h('input', { type: 'radio', name, value, checked: value === current, onchange: () => onchange(value) }), h('span', {}, label))));
}

async function showCompose(draft) {
  if (!state.overview) await refresh();
  const o = state.overview;
  const d = { course: null, title: '', body: '', path: '', when: 'now', at: localInput(Date.now() + 60 * 60000), preview: 'ios', ...draft };

  // 1. audience: the app's answer buttons
  const audience = h('div', { class: 'options', role: 'radiogroup', 'aria-label': 'لمن يُرسل' });
  const paintAudience = () => audience.replaceChildren(...[null, ...state.catalog.courses.map((c) => c.id)].map((id) => h('button', {
    type: 'button', role: 'radio', 'aria-checked': String(d.course === id), class: `option${d.course === id ? ' is-selected' : ''}`,
    onclick: () => { d.course = id; d.path = ''; paintAudience(); fillPaths(); update(); },
  }, h('span', { class: 'option__text' }, id ? courseName(id) : 'كل المشتركين'), h('span', { class: 'option__count' }, `${num(audienceCount(id))} مشترك`))));

  // 2. message
  const title = h('input', { class: 'input', id: 'title', maxlength: String(LIMITS.title.max), autocomplete: 'off', value: d.title, placeholder: 'مثال: أسئلة جديدة في رياضيات الأعمال' });
  const body = h('textarea', { class: 'input', id: 'body', maxlength: String(LIMITS.body.max), rows: '3', placeholder: 'مثال: أضفنا اختبارات سابقة للوحدات 1–4. ابدأ التدريب الآن.' });
  body.value = d.body;
  const titleLen = h('span'), bodyLen = h('span');
  title.addEventListener('input', () => { d.title = title.value; update(); });
  body.addEventListener('input', () => { d.body = body.value; update(); });
  const templates = h('div', { class: 'templates', role: 'group', 'aria-label': 'قوالب جاهزة' }, TEMPLATES.map((tp) => h('button', {
    type: 'button', class: 'btn btn--secondary btn--sm',
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
  const at = h('input', { class: 'input', type: 'datetime-local', id: 'at', dir: 'ltr', min: localInput(Date.now() + 5 * 60000), max: localInput(Date.now() + 59 * 24 * 3600000), value: d.at });
  at.addEventListener('input', () => { d.at = at.value; });
  const atWrap = h('div', { class: 'field', hidden: d.when !== 'later' }, h('label', { class: 'field__label', for: 'at' }, 'التاريخ والوقت'), at,
    h('p', { class: 'field__hint' }, 'أفضل وقت لطلاب الجامعة: من 11 صباحًا إلى 1 ظهرًا، وبعد 8 مساءً.'));
  const when = segs('when', [['now', 'الآن'], ['later', 'وقت محدد']], d.when, (v) => { d.when = v; atWrap.hidden = v !== 'later'; update(); });

  // 5. preview
  const pvWrap = h('div');
  const pvSeg = segs('pv', [['ios', 'آيفون'], ['android', 'أندرويد']], d.preview, (v) => { d.preview = v; update(); });

  const warn = h('div', { class: 'card-grid' });
  const testBtn = h('button', { type: 'button', class: 'btn btn--secondary', onclick: () => submit(true) }, 'إرسال تجربة');
  const sendBtn = h('button', { type: 'button', class: 'btn btn--primary', onclick: () => submit(false) }, 'مراجعة وإرسال');

  function update() {
    titleLen.replaceChildren(lenMeter(d.title.length, LIMITS.title));
    bodyLen.replaceChildren(lenMeter(d.body.length, LIMITS.body));
    const ios = d.preview === 'ios';
    pvWrap.replaceChildren(h('div', { class: `phone phone--${d.preview}` },
      h('p', { class: 'phone__time' }, ios ? fmt(Date.now(), { weekday: 'long', day: 'numeric', month: 'long', hour: undefined, minute: undefined }) : 'الإشعارات'),
      h('div', { class: `pv pv--${d.preview}` },
        h('img', { class: 'pv__icon', src: asset('assets/icons/icon-192.png'), alt: '' }),
        h('div', { class: 'pv__copy' },
          h('div', { class: 'pv__head' }, h('span', {}, 'سمارت برو'), h('span', {}, 'الآن')),
          h('p', { class: 'pv__title' }, d.title.trim() || 'عنوان التنبيه'),
          h('p', { class: 'pv__body' }, d.body.trim() || 'نص التنبيه يظهر هنا.')))));
    // At most one a day and about five a week to the same students, or they turn notifications off.
    const same = o.sends.filter((s) => !d.course || !s.course || s.course === d.course);
    const today = same.filter((s) => Date.now() - s.sentAt < 24 * 3600 * 1000).length;
    const notes = [];
    if (today) notes.push(`أرسلت لهذا الجمهور ${today === 1 ? 'تنبيهًا' : `${today} تنبيهات`} خلال آخر 24 ساعة. الأفضل تنبيه واحد في اليوم كحد أقصى.`);
    else if (same.length >= 4) notes.push(`أرسلت لهذا الجمهور ${same.length} تنبيهات هذا الأسبوع. أكثر من 5 في الأسبوع يدفع الطلاب لإيقاف التنبيهات.`);
    if (d.title.length > LIMITS.title.ideal) notes.push('العنوان أطول من 30 حرفًا، وقد يظهر مقصوصًا على الآيفون.');
    warn.replaceChildren(...notes.map((n) => note('warn', ICONS.alert, n)));
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
      const choice = await openSheet({
        title: later ? 'مراجعة قبل الجدولة' : 'مراجعة قبل الإرسال',
        closeLabel: 'تعديل',
        build: (close) => [
          h('dl', { class: 'review-list' },
            h('div', {}, h('dt', {}, 'إلى'), h('dd', {}, `${audienceName(d.course)} (${num(count)} مشترك)`)),
            h('div', {}, h('dt', {}, 'العنوان'), h('dd', {}, titleText)),
            h('div', {}, h('dt', {}, 'النص'), h('dd', {}, bodyText)),
            h('div', {}, h('dt', {}, 'يفتح'), h('dd', {}, path.selectedOptions[0]?.textContent)),
            h('div', {}, h('dt', {}, 'الوقت'), h('dd', {}, later ? fmt(atMs) : 'الآن'))),
          h('p', { class: 'field__hint' }, later ? 'يمكنك إلغاؤه من السجل قبل موعده.' : 'لا يمكن التراجع بعد الإرسال.'),
          h('button', { type: 'button', class: 'btn btn--primary btn--block', onclick: () => close('yes') }, later ? 'جدولة' : 'إرسال الآن'),
        ],
      });
      if (choice !== 'yes') return;
    }
    testBtn.disabled = sendBtn.disabled = true;
    try {
      const r = await api('send', { title: titleText, body: bodyText, course: d.course, path: d.path, test, at: atMs });
      if (!test) {
        toast(later ? `تمت الجدولة: يُرسل ${fmt(atMs)}.` : `تم الإرسال: وصل إلى ${num(r.delivered)} من ${num(r.total)}.`);
        return go('history');
      }
      toast(r.delivered ? `وصلت التجربة إلى ${r.delivered} من ${r.total} ${r.total === 1 ? 'جهاز' : 'أجهزة'}.` : 'لم تصل التجربة. أعد إضافة جهاز التجربة من الإعدادات.');
    } catch (err) {
      if (err instanceof SignedOut) return showLogin();
      toast(errorText(err));
    }
    sendBtn.disabled = false;
    update();
  }

  const step = (n, label, ...content) => h('section', { class: 'card step' }, h('h2', { class: 'step__title' }, h('span', { class: 'step__num' }, String(n)), label), ...content);
  screen('تنبيه جديد', 'اكتب، عاين، ثم أرسل', [
    step(1, 'لمن يُرسل؟', audience),
    step(2, 'الرسالة', templates,
      h('div', { class: 'field' }, h('div', { class: 'field__top' }, h('label', { class: 'field__label', for: 'title' }, 'العنوان'), titleLen), title),
      h('div', { class: 'field' }, h('div', { class: 'field__top' }, h('label', { class: 'field__label', for: 'body' }, 'النص'), bodyLen), body)),
    step(3, 'ماذا يفتح عند الضغط عليه؟', path),
    step(4, 'متى يُرسل؟', when, atWrap),
    step(5, 'المعاينة', pvSeg, pvWrap),
    warn,
    o.testDevices.length ? null : note('info', I.phone, 'لتجربة التنبيه على جوالك قبل إرساله للطلاب، أضف جوالك كجهاز تجربة من الإعدادات.'),
    h('div', { class: 'actions2' }, testBtn, sendBtn),
  ]);
  paintAudience();
  fillPaths();
  update();
}

/* ---------- history ---------- */

async function showHistory() {
  await refresh();
  const list = h('div', { class: 'card-grid' });
  const draw = () => {
    const rows = state.history.filter((r) => (state.filter === 'all' ? true : state.filter === 'test' ? r.test : !r.test && r.status === state.filter));
    list.replaceChildren(...(rows.length ? rows.map((r) => sentCard(r))
      : [h('div', { class: 'card empty' }, h('span', { class: 'empty__icon' }, icon(...ICONS.bell)), h('h2', {}, 'لا شيء هنا بعد'), h('p', {}, 'التنبيهات التي ترسلها أو تجدولها تظهر هنا مع عدد من وصلهم ومن ضغط عليها.'))]));
  };
  screen('السجل', 'كل ما أُرسل وجُدول', [
    segs('filter', [['all', 'الكل'], ['sent', 'أُرسل'], ['scheduled', 'مجدول'], ['test', 'تجارب']], state.filter, (v) => { state.filter = v; draw(); }),
    list,
  ]);
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

  const deviceBtn = h('button', { type: 'button', class: sub ? 'btn btn--secondary btn--sm' : 'btn btn--primary btn--sm' }, sub ? 'إيقاف' : 'إضافة');
  deviceBtn.onclick = async () => {
    deviceBtn.disabled = true;
    try {
      if (sub) {
        await api('test-devices/remove', { endpoint: sub.endpoint });
        await sub.unsubscribe();
        toast('لن يستقبل هذا الجهاز التجارب بعد الآن.');
      } else {
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

  const devices = h('div', { class: 'card rows' },
    pushOk
      ? h('div', { class: 'row' }, h('div', { class: 'row__copy' }, h('strong', {}, 'هذا الجهاز'), h('span', {}, sub ? 'يستقبل تنبيهات التجربة' : 'لا يستقبل تنبيهات التجربة')), deviceBtn)
      : h('div', { class: 'row' }, h('div', { class: 'row__copy' }, h('strong', {}, 'هذا الجهاز'),
          h('span', {}, isIOS() && !standalone() ? 'على الآيفون: ثبّت تطبيق الإدارة على الشاشة الرئيسية ثم افتحه من أيقونته لتستقبل التجارب.' : 'هذا المتصفح لا يدعم التنبيهات.'))),
    o.testDevices.map((dv) => h('div', { class: 'row' },
      h('div', { class: 'row__copy' }, h('strong', {}, dv.label || 'جهاز'), h('span', {}, `أُضيف ${ago(dv.created)}`)),
      h('button', { type: 'button', class: 'btn btn--quiet btn--sm', onclick: async () => { await api('test-devices/remove', { id: dv.id }); toast('تمت إزالة الجهاز.'); showSettings(); } }, 'إزالة'))));

  let install;
  if (standalone()) install = note('info', ICONS.check, 'تطبيق الإدارة مثبّت على هذا الجهاز.');
  else if (installPrompt) install = h('button', { type: 'button', class: 'btn btn--primary btn--block', onclick: async () => { installPrompt.prompt(); await installPrompt.userChoice; installPrompt = null; showSettings(); } }, icon(...ICONS.download), 'تثبيت تطبيق الإدارة');
  else if (isIOS()) install = h('ol', { class: 'steps' },
    h('li', {}, 'اضغط ', h('span', { class: 'install__key', 'aria-label': 'مشاركة' }, icon(...ICONS.share)), ' «مشاركة» في شريط سفاري'),
    h('li', {}, 'اختر ', h('strong', {}, 'إضافة إلى الشاشة الرئيسية'), ' ', h('span', { class: 'install__key', 'aria-hidden': 'true' }, icon(...ICONS.addSquare))),
    h('li', {}, 'افتح «إدارة سمارت برو» من أيقونته وسجّل الدخول مرة واحدة'));
  else install = h('p', { class: 'field__hint' }, 'من قائمة المتصفح (⋮) اختر «تثبيت التطبيق» أو «إضافة إلى الشاشة الرئيسية».');

  const cur = h('input', { class: 'input', type: 'password', autocomplete: 'current-password', dir: 'ltr', id: 'cur', required: true });
  const nxt = h('input', { class: 'input', type: 'password', autocomplete: 'new-password', dir: 'ltr', id: 'nxt', minlength: '10', required: true });
  const pwForm = h('form', {
    class: 'card card__pad',
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
  h('div', { class: 'field' }, h('label', { class: 'field__label', for: 'cur' }, 'كلمة المرور الحالية'), cur),
  h('div', { class: 'field' }, h('label', { class: 'field__label', for: 'nxt' }, 'كلمة المرور الجديدة'), nxt, h('p', { class: 'field__hint' }, '10 أحرف على الأقل.')),
  h('button', { type: 'submit', class: 'btn btn--secondary btn--block' }, 'تغيير كلمة المرور'));

  screen('الإعدادات', null, [
    h('div', { class: 'section-head' }, h('h2', {}, 'أجهزة التجربة')), devices,
    h('div', { class: 'section-head' }, h('h2', {}, 'تثبيت تطبيق الإدارة')), h('div', { class: 'card card__pad' }, install),
    h('div', { class: 'section-head' }, h('h2', {}, 'كلمة المرور')), pwForm,
    h('button', {
      type: 'button', class: 'btn btn--secondary btn--block',
      onclick: async () => { try { await api('logout', {}); } catch { /* signed out anyway */ } showLogin(); },
    }, icon(...I.logout), 'تسجيل الخروج'),
  ]);
}

/* ---------- start ---------- */

async function start() {
  state.catalog = await (await fetch(asset('data/catalog.json'), { cache: 'no-cache' })).json();
  await refresh();
  const tab = location.hash.slice(1);
  await go(TABS.some(([id]) => id === tab) ? tab : 'home');
}

initTheme();
navigator.serviceWorker?.register(new URL('sw.js', location.href), { scope: './' }).catch(() => {});
start().catch((err) => (err instanceof SignedOut ? showLogin() : (header(), root.replaceChildren(h('div', { class: 'screen' }, h('main', { class: 'body login' }, note('err', ICONS.alert, errorText(err))))))));
