// إدارة سمارت برو: the owner's notifications app (served at /admin/ and /preview/admin/ by server/push).
// Made of the students' app's own pieces (element builder, icons, sheets, theme, stylesheets) and its patterns:
// the header, a 4-tab bar (Home, New notification, History, Settings), and the new notification laid out like the
// topic setup (choice tiles, a fixed action bar above the tabs). No native pickers anywhere: every choice is a tile, a segment or a sheet.

import { h, icon, ICONS } from '../assets/js/quiz/dom.js';
import { confirmDialog, openSheet } from '../assets/js/quiz/dialog.js';
import { initTheme, toggleTheme, theme } from '../assets/js/app/theme.js';
import { iosBrowser } from '../assets/js/app/install.js';

const SITE = new URL('../', location.href); // the students' site: / or /preview/
const asset = (path) => new URL(path, SITE).href;
const DRAFT_KEY = 'smartpro.admin.draft';

// Tabler Icons outline paths (the set the app uses), for the few the app itself has no need of.
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
  page: ['M14 3v4a1 1 0 0 0 1 1h4', 'M17 21h-10a2 2 0 0 1 -2 -2v-14a2 2 0 0 1 2 -2h7l5 5v11a2 2 0 0 1 -2 2z'],
  calendar: ['M4 7a2 2 0 0 1 2 -2h12a2 2 0 0 1 2 2v12a2 2 0 0 1 -2 2h-12a2 2 0 0 1 -2 -2v-12z', 'M16 3v4', 'M8 3v4', 'M4 11h16'],
};

const num = (n) => new Intl.NumberFormat('en-US').format(n);
const pct = (a, b) => (b ? Math.round((a / b) * 100) : 0);
const fmt = (ms, opts = {}) => new Intl.DateTimeFormat('ar-u-ca-gregory-nu-latn', { weekday: 'long', day: 'numeric', month: 'long', hour: 'numeric', minute: '2-digit', ...opts }).format(ms);
const fmtShort = (ms) => fmt(ms, { weekday: 'short', month: 'short' });
const fmtDay = (ms) => fmt(ms, { weekday: undefined, hour: undefined, minute: undefined });
const fmtTime = (ms) => fmt(ms, { weekday: undefined, day: undefined, month: undefined });
const rtf = new Intl.RelativeTimeFormat('ar-u-nu-latn', { numeric: 'auto' });
const ago = (ms) => {
  const m = Math.round((Date.now() - ms) / 60000);
  if (m < 1) return 'الآن';
  if (m < 60) return rtf.format(-m, 'minute');
  if (m < 24 * 60) return rtf.format(-Math.round(m / 60), 'hour');
  return fmtShort(ms);
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

/** A button that says what it is doing while `run` is pending, and cannot be pressed twice. */
async function busy(btn, label, run) {
  const old = [...btn.childNodes];
  btn.disabled = true;
  btn.classList.add('is-busy');
  btn.replaceChildren(h('span', { class: 'spin', 'aria-hidden': 'true' }), label);
  try {
    return await run();
  } finally {
    btn.disabled = false;
    btn.classList.remove('is-busy');
    btn.replaceChildren(...old);
  }
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
let current = ''; // the screen on show: a tab id, or 'done' / 'login'
const course = (id) => state.catalog.courses.find((c) => c.id === id);
const courseName = (id) => course(id)?.titleAr ?? id;
const audienceName = (id) => (id ? `مشتركو ${courseName(id)}` : 'كل المشتركين');
const audienceCount = (id) => (id ? state.overview.perCourse[id] || 0 : state.overview.total);
const ERRORS = {
  'no test device': 'أضف جهاز تجربة من الإعدادات.',
  'title and body are required': 'اكتب العنوان والنص',
  'too far ahead': 'أبعد موعد ممكن بعد 60 يومًا.',
  'too many attempts': 'محاولات كثيرة. انتظر 15 دقيقة ثم حاول مرة أخرى.',
  'wrong password': 'كلمة المرور غير صحيحة.',
  'too short': 'كلمة المرور الجديدة 10 أحرف على الأقل.',
};
const errorText = (err) => ERRORS[err.message] || 'تعذّر الاتصال. حاول مرة أخرى.';
const refresh = async () => { [state.overview, state.history] = await Promise.all([api('overview'), api('history')]); };
const fail = (err) => (err instanceof SignedOut ? showLogin() : toast(errorText(err)));

/* ---------- header: the app's own, built once ---------- */

const chipSlot = h('div', { class: 'hdr__side hdr__side--end' });
function buildHeader() {
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
    h('span', { class: 'hdr__brand' },
      h('img', { class: 'logo--light', src: asset('assets/img/logo-mark.png'), width: '160', height: '160', alt: 'سمارت برو' }),
      h('img', { class: 'logo--dark', src: asset('assets/img/logo-mark-dark.png'), width: '160', height: '160', alt: 'سمارت برو' })),
    chipSlot);
}
const paintChip = () => chipSlot.replaceChildren(state.overview?.site === 'preview' ? h('span', { class: 'chip chip--warn' }, 'تجريبي') : '');

/* ---------- screens ---------- */

const root = document.getElementById('app');
const TABS = [['home', 'الرئيسية', ICONS.home], ['compose', 'إشعار جديد', I.send], ['history', 'السجل', I.list], ['settings', 'الإعدادات', I.gear]];
const scrollMemory = {};

function mountScreen(name, { bar = null, body, foot = null, className = '', enter = '' }) {
  const prev = root.querySelector('main.body');
  if (prev && TABS.some(([id]) => id === current)) scrollMemory[current] = prev.scrollTop;
  current = name;
  paintChip();
  const main = h('main', { class: 'body' }, body);
  root.replaceChildren(h('div', { class: `screen ${className} ${enter ? `enter--${enter}` : ''}`.trim() }, bar, main, foot));
  if (TABS.some(([id]) => id === name) && scrollMemory[name]) main.scrollTop = scrollMemory[name];
  return main;
}
const pagebar = ({ start = null, title, sub = null, end = null }) => h('div', { class: 'pagebar' }, h('div', { class: 'pagebar__row' },
  start ? h('div', { class: 'pagebar__start' }, start) : null,
  h('div', { class: 'pagebar__title' }, h('h1', {}, title), sub ? h('p', {}, sub) : null),
  end ? h('div', { class: 'pagebar__end' }, end) : null));
const tabbar = () => h('nav', { class: 'tabbar', 'aria-label': 'الأقسام' }, TABS.map(([id, label, paths]) => h('button', {
  type: 'button', class: `tab${state.tab === id ? ' is-active' : ''}`, 'aria-current': state.tab === id ? 'page' : null, onclick: () => go(id),
}, h('span', { class: 'tab__icon' }, icon(...paths)), h('span', { class: 'tab__label' }, label))));
let composeFrom = null; // a notification from the history to start the new one from
const DRAW = {
  home: () => drawHome(),
  compose: () => { const from = composeFrom; composeFrom = null; showCompose(from); },
  history: () => drawHistory(),
  settings: () => drawSettings(),
};

/** A tab shows what we already have at once, then refreshes it in the background (no blank screen, no jump). */
async function go(tab) {
  state.tab = tab;
  history.replaceState(null, '', `#${tab}`);
  const shown = Boolean(state.overview);
  if (shown) DRAW[tab]();
  try {
    await refresh();
    // Redraw only if the owner is still on this tab and not in the middle of something (a sheet, a form). The new
    // notification is never redrawn under the owner's hands: its counts are already there and it keeps its scroll.
    if (tab === 'compose' && shown) return;
    if (current === tab && !document.querySelector('dialog[open]') && !root.contains(document.activeElement?.closest('form'))) DRAW[tab]();
  } catch (err) { fail(err); }
}

/* ---------- sign in ---------- */

function showLogin() {
  state.overview = null;
  const pw = h('input', { class: 'input', type: 'password', id: 'pw', autocomplete: 'current-password', autocapitalize: 'off', autocorrect: 'off', spellcheck: 'false', required: true, dir: 'ltr' });
  const err = h('p', { class: 'msg-note msg-note--err', role: 'alert', hidden: true });
  const btn = h('button', { type: 'submit', class: 'btn btn--primary btn--block' }, 'دخول');
  const eye = h('button', {
    type: 'button', class: 'pw__btn', 'aria-label': 'إظهار كلمة المرور',
    onclick: () => { pw.type = pw.type === 'password' ? 'text' : 'password'; eye.classList.toggle('is-on', pw.type === 'text'); },
  }, icon(...I.eye));
  mountScreen('login', {
    className: 'screen--login',
    enter: 'fade',
    body: h('form', {
      class: 'login__box',
      onsubmit: async (e) => {
        e.preventDefault();
        err.hidden = true;
        try {
          await busy(btn, 'جارٍ الدخول…', () => api('login', { password: pw.value }));
        } catch (error) {
          err.textContent = errorText(error);
          err.hidden = false;
          pw.select();
          return;
        }
        start().catch(fail);
      },
    },
    h('div', { class: 'login__head' },
      h('span', { class: 'empty__icon' }, icon(...ICONS.bell)),
      h('h1', {}, 'إدارة الإشعارات')),
    h('div', { class: 'card login__card' },
      // A hidden account name, so the phone's password manager can save and fill the password.
      h('input', { type: 'text', name: 'username', autocomplete: 'username', value: 'smartpro', hidden: true, tabindex: '-1', 'aria-hidden': 'true' }),
      h('div', { class: 'field' }, h('label', { class: 'field__label', for: 'pw' }, 'كلمة المرور'), h('div', { class: 'pw' }, pw, eye)),
      err, btn)),
  });
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
  const when = r.status === 'scheduled' ? `يُرسل ${fmtShort(r.sendAt)}` : r.status === 'canceled' ? `كان موعده ${fmtShort(r.sendAt)}` : ago(r.sentAt || r.created);
  const card = h('article', { class: 'card sent' },
    h('div', { class: 'sent__top' }, status, h('span', { class: 'sent__who' }, r.test ? 'أجهزة التجربة' : audienceName(r.course)), h('span', { class: 'sent__when' }, when)),
    h('p', { class: 'sent__title' }, r.title),
    compact ? null : h('p', { class: 'sent__body' }, r.body));
  if (r.status === 'sent') {
    card.append(h('dl', { class: 'sent__stats' },
      h('div', {}, h('dt', {}, 'وصل إلى'), h('dd', {}, num(r.delivered))),
      h('div', {}, h('dt', {}, 'فتحوه'), h('dd', {}, num(r.clicks))),
      h('div', {}, h('dt', {}, 'نسبة الفتح'), h('dd', { dir: 'ltr' }, `${pct(r.clicks, r.delivered)}%`))));
  }
  if (!compact) {
    const actions = h('div', { class: 'sent__actions' },
      h('button', { type: 'button', class: 'btn btn--secondary btn--sm', onclick: () => openCompose({ course: r.course, title: r.title, body: r.body, path: pathOf(r.url) }) }, icon(...I.copy), 'إعادة استخدام'));
    if (r.status === 'scheduled') {
      const cancel = h('button', { type: 'button', class: 'btn btn--quiet btn--sm' }, 'إلغاء الجدولة');
      cancel.onclick = async () => {
        const choice = await confirmDialog({
          title: 'إلغاء الإشعار المجدول؟',
          actions: [{ label: 'تراجع', value: '' }, { label: 'إلغاء الجدولة', value: 'yes', primary: true }],
        });
        if (choice !== 'yes') return;
        try {
          await busy(cancel, 'جارٍ الإلغاء…', () => api('cancel', { id: r.id }));
          toast('تم إلغاء الجدولة');
          go(state.tab);
        } catch (err) { fail(err); }
      };
      actions.append(cancel);
    }
    card.append(actions);
  }
  return card;
}

/* ---------- home ---------- */

function drawHome() {
  const o = state.overview;
  const real = state.history.filter((r) => !r.test);
  const last = real.find((r) => r.status === 'sent');
  const scheduled = real.filter((r) => r.status === 'scheduled').reverse();
  const max = Math.max(1, ...Object.values(o.perCourse));
  return mountScreen('home', {
    className: 'screen--admin-home',
    body: [
      h('section', { class: 'card course-hero' },
        h('p', { class: 'course-hero__en' }, 'الإشعارات'),
        h('p', { class: 'course-hero__ar' }, 'آخر 7 أيام'),
        h('dl', { class: 'course-hero__stats' },
          h('div', {}, h('dt', {}, 'المشتركون'), h('dd', {}, num(o.total))),
          h('div', {}, h('dt', {}, 'جدد'), h('dd', {}, num(o.newThisWeek))),
          h('div', {}, h('dt', {}, 'ألغوا'), h('dd', {}, num(o.leftThisWeek))))),
      h('button', { type: 'button', class: 'btn btn--primary btn--block', onclick: () => openCompose() }, icon(...I.send), 'إشعار جديد'),
      scheduled.length ? [h('div', { class: 'section-head' }, h('h2', {}, 'مجدول')), scheduled.map((r) => sentCard(r, { compact: true }))] : null,
      h('div', { class: 'section-head' }, h('h2', {}, 'المشتركون حسب المقرر')),
      o.total
        ? h('ul', { class: 'card counts' }, state.catalog.courses.map((c) => {
            const n = o.perCourse[c.id] || 0;
            return h('li', {}, h('div', { class: 'counts__top' }, h('span', {}, c.titleAr), h('strong', {}, num(n))),
              h('div', { class: 'meter', role: 'presentation' }, h('span', { style: `transform:scaleX(${n / max})` })));
          }))
        : h('div', { class: 'card empty' }, h('span', { class: 'empty__icon' }, icon(...I.users)), h('h2', {}, 'لا يوجد مشتركون بعد')),
      last ? [h('div', { class: 'section-head' }, h('h2', {}, 'آخر إشعار'), h('a', { href: '#history', onclick: (e) => { e.preventDefault(); go('history'); } }, 'السجل')), sentCard(last, { compact: true })] : null,
    ],
    foot: tabbar(),
  });
}

/* ---------- history ---------- */

const FILTERS = [['all', 'الكل'], ['sent', 'أُرسل'], ['scheduled', 'مجدول'], ['test', 'تجارب']];
function drawHistory() {
  const list = h('div', { class: 'card-grid' });
  const draw = () => {
    const rows = state.history.filter((r) => (state.filter === 'all' ? true : state.filter === 'test' ? r.test : !r.test && r.status === state.filter));
    list.replaceChildren(...(rows.length ? rows.map((r) => sentCard(r))
      : [h('div', { class: 'card empty' }, h('span', { class: 'empty__icon' }, icon(...ICONS.bell)),
          h('h2', {}, state.filter === 'scheduled' ? 'لا يوجد إشعار مجدول' : state.filter === 'test' ? 'لا توجد تجارب' : 'لم ترسل أي إشعار بعد'),
          h('button', { type: 'button', class: 'btn btn--primary btn--sm', onclick: () => openCompose() }, 'إشعار جديد'))]));
  };
  const main = mountScreen('history', {
    bar: pagebar({ title: 'السجل' }),
    body: [segs('filter', FILTERS, state.filter, (v) => { state.filter = v; draw(); }), list],
    foot: tabbar(),
  });
  draw();
  return main;
}

/* ---------- settings ---------- */

let installPrompt = null;
addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); installPrompt = e; });
const standalone = () => matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
const isIOS = () => /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
const b64 = (s) => Uint8Array.from(atob((s + '='.repeat((4 - (s.length % 4)) % 4)).replace(/-/g, '+').replace(/_/g, '/')), (c) => c.charCodeAt(0));
const deviceLabel = () => (isIOS() ? 'آيفون' : /Android/.test(navigator.userAgent) ? 'أندرويد' : 'كمبيوتر');
const pushOk = () => 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
let mySub = null;
async function thisDevice() {
  const reg = await navigator.serviceWorker?.getRegistration(location.href);
  mySub = (await reg?.pushManager?.getSubscription()) ?? null;
  return mySub;
}

function drawSettings() {
  const o = state.overview;
  const sub = mySub;
  const deviceBtn = h('button', { type: 'button', class: sub ? 'btn btn--secondary btn--sm' : 'btn btn--primary btn--sm' }, sub ? 'إيقاف' : 'إضافة');
  deviceBtn.onclick = async () => {
    try {
      await busy(deviceBtn, sub ? 'جارٍ الإيقاف…' : 'جارٍ الإضافة…', async () => {
        if (sub) {
          await api('test-devices/remove', { endpoint: sub.endpoint });
          await sub.unsubscribe();
          toast('تمت إزالة الجهاز');
        } else {
          if (await Notification.requestPermission() !== 'granted') { toast('لم يتم السماح بالإشعارات'); return; }
          const reg = await navigator.serviceWorker.ready;
          const s = (await reg.pushManager.getSubscription()) || await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64(o.vapidKey) });
          await api('test-devices', { subscription: s.toJSON(), label: deviceLabel() });
          toast('تمت إضافة الجهاز');
        }
        await thisDevice();
        await refresh();
      });
      drawSettings();
    } catch (err) { fail(err); }
  };

  const others = o.testDevices;
  const devices = h('div', { class: 'card rows' },
    h('div', { class: 'row' },
      h('span', { class: 'row__icon' }, icon(...I.phone)),
      h('div', { class: 'row__copy' }, h('strong', {}, 'هذا الجهاز'),
        h('span', {}, pushOk() ? (sub ? 'مضاف' : 'غير مضاف')
          : isIOS() && !standalone() ? 'أضف التطبيق إلى الشاشة الرئيسية' : 'الإشعارات غير مدعومة في هذا المتصفح')),
      pushOk() ? deviceBtn : null),
    others.length
      ? others.map((dv) => {
          const rm = h('button', { type: 'button', class: 'btn btn--quiet btn--sm' }, 'إزالة');
          rm.onclick = async () => {
            try {
              await busy(rm, 'جارٍ الإزالة…', async () => { await api('test-devices/remove', { id: dv.id }); await refresh(); });
              toast('تمت إزالة الجهاز');
              drawSettings();
            } catch (err) { fail(err); }
          };
          return h('div', { class: 'row' }, h('span', { class: 'row__icon row__icon--quiet' }, icon(...ICONS.bell)),
            h('div', { class: 'row__copy' }, h('strong', {}, dv.label || 'جهاز'), h('span', {}, `أُضيف ${ago(dv.created)}`)), rm);
        })
      : null);

  let install;
  if (standalone()) install = note('info', ICONS.check, 'مثبّت على هذا الجهاز');
  else if (installPrompt) {
    install = h('button', { type: 'button', class: 'btn btn--primary btn--block', onclick: async () => { installPrompt.prompt(); await installPrompt.userChoice; installPrompt = null; drawSettings(); } }, icon(...ICONS.download), 'تثبيت تطبيق الإدارة');
  } else if (isIOS()) {
    const key = (paths) => h('span', { class: 'install__key', 'aria-hidden': 'true' }, icon(...paths));
    const add = h('li', {}, 'اختر ', h('strong', {}, 'إضافة إلى الشاشة الرئيسية'), ' ', key(ICONS.addSquare));
    // Safari 26 moved Share behind the ⋯ button next to the address bar.
    const share = iosBrowser(navigator.userAgent) === 'safari26'
      ? [h('li', {}, 'اضغط ', key(ICONS.dots), ' بجانب شريط العنوان'), h('li', {}, 'اختر ', h('strong', {}, 'مشاركة'), ' ', key(ICONS.share))]
      : [h('li', {}, 'اضغط ', h('strong', {}, 'مشاركة'), ' ', key(ICONS.share))];
    install = h('ol', { class: 'install__steps admin-steps' }, share, add, h('li', {}, 'افتحه من الشاشة الرئيسية'));
  } else install = h('p', { class: 'field__hint' }, 'من قائمة المتصفح ⋮ اختر «تثبيت التطبيق».');

  const cur = h('input', { class: 'input', type: 'password', autocomplete: 'current-password', dir: 'ltr', id: 'cur', required: true });
  const nxt = h('input', { class: 'input', type: 'password', autocomplete: 'new-password', dir: 'ltr', id: 'nxt', minlength: '10', required: true });
  const pwBtn = h('button', { type: 'submit', class: 'btn btn--secondary btn--block' }, 'تغيير كلمة المرور');
  const pwForm = h('form', {
    class: 'card card__pad',
    onsubmit: async (e) => {
      e.preventDefault();
      try {
        await busy(pwBtn, 'جارٍ الحفظ…', () => api('password', { current: cur.value, next: nxt.value }));
        cur.value = nxt.value = '';
        toast('تم تغيير كلمة المرور');
      } catch (err) { fail(err); }
    },
  },
  h('div', { class: 'field' }, h('label', { class: 'field__label', for: 'cur' }, 'كلمة المرور الحالية'), cur),
  h('div', { class: 'field' }, h('label', { class: 'field__label', for: 'nxt' }, 'كلمة المرور الجديدة'), nxt, h('p', { class: 'field__hint' }, '10 أحرف على الأقل.')),
  pwBtn);

  const outBtn = h('button', { type: 'button', class: 'btn btn--quiet btn--block' }, icon(...I.logout), 'تسجيل الخروج');
  outBtn.onclick = async () => {
    const choice = await confirmDialog({ title: 'تسجيل الخروج؟', actions: [{ label: 'إلغاء', value: '' }, { label: 'تسجيل الخروج', value: 'yes', primary: true }] });
    if (choice !== 'yes') return;
    try { await api('logout', {}); } catch { /* signed out on this device anyway */ }
    showLogin();
  };

  return mountScreen('settings', {
    bar: pagebar({ title: 'الإعدادات' }),
    body: [
      h('div', { class: 'section-head' }, h('h2', {}, 'أجهزة التجربة')), devices,
      h('div', { class: 'section-head' }, h('h2', {}, 'تطبيق الإدارة')), h('div', { class: 'card card__pad' }, install),
      h('div', { class: 'section-head' }, h('h2', {}, 'كلمة المرور')), pwForm,
      outBtn,
    ],
    foot: tabbar(),
  });
}

/* ---------- new notification: a full screen like the topic setup ---------- */

// Lengths that show in full: iPhone cuts a title after about 30 characters; the body shows 4 lines (iPhone) / 2 (Android).
const LIMITS = { title: { ideal: 30, max: 50 }, body: { ideal: 110, max: 150 } };
const TEMPLATES = [
  { label: 'أسئلة جديدة', title: (c) => `أسئلة جديدة في ${c}`, body: (c) => `أضفنا أسئلة جديدة في ${c}. ابدأ التدريب الآن.` },
  { label: 'الاختبار قرّب', title: () => 'اختبارك قرّب؟', body: (c) => `جرّب الاختبار النصفي التجريبي في ${c} واعرف مستواك قبل الاختبار.`, topic: 'midterm' },
  { label: 'اختبارات سابقة', title: () => 'أسئلة من اختبارات سابقة', body: (c) => `أضفنا أسئلة من اختبارات السنوات الماضية في ${c}. تدرّب عليها الآن.`, topic: 'past-exams' },
  { label: 'تذكير بالمذاكرة', title: () => 'وقت المراجعة', body: () => 'عشر دقائق تدريب اليوم تفرق في اختبارك. كمّل من حيث وقفت.' },
];
// Times offered first: the two hours our students practise most (usage statistics, October 2026: 6-7 pm and
// 9-10 pm, Riyadh time). Any other hour from 8 am to 10 pm from the sheet; never at night.
const BEST_HOURS = [18, 21];
const SOON = 5 * 60000;
const dayStart = (offset) => { const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() + offset); return d; };
const at = (day, hour) => { const d = dayStart(day); d.setHours(hour); return d.getTime(); };
const hourLabel = (hr) => fmtTime(at(0, hr));

function segs(name, items, value, onchange) {
  return h('div', { class: 'segs', role: 'radiogroup' }, items.map(([v, label]) => h('label', { class: 'seg' },
    h('input', { type: 'radio', name, value: v, checked: v === value, onchange: () => onchange(v) }), h('span', {}, label))));
}
function tile(name, value, checked, iconPaths, title, text, onchange, disabled = false) {
  return h('label', { class: `tile${disabled ? ' is-off' : ''}` },
    h('input', { type: 'radio', name, value: String(value), checked, disabled, onchange }),
    h('span', { class: 'tile__icon' }, icon(...iconPaths)),
    h('span', { class: 'tile__copy' }, h('span', { class: 'tile__title' }, title), text ? h('span', { class: 'tile__text' }, text) : null));
}
const group = (legend, ...content) => h('fieldset', { class: 'setup__group' }, h('legend', {}, legend), h('div', { class: 'group__body' }, ...content));
const lenMeter = (len, { ideal, max }) => h('span', { class: `len${len > max ? ' is-over' : len > ideal ? ' is-long' : ''}` },
  h('span', { class: 'meter', 'aria-hidden': 'true' }, h('span', { style: `transform:scaleX(${Math.min(1, len / max)})` })), `${len}/${max}`);

function loadDraft() { try { return JSON.parse(localStorage.getItem(DRAFT_KEY)) || null; } catch { return null; } }
function saveDraft(d) { try { localStorage.setItem(DRAFT_KEY, JSON.stringify(d)); } catch { /* the draft lasts while the screen is open */ } }
function dropDraft() { try { localStorage.removeItem(DRAFT_KEY); } catch { /* nothing saved */ } }

function openCompose(from = null) {
  composeFrom = from;
  go('compose');
}

function showCompose(from) {
  const o = state.overview;
  const firstHour = BEST_HOURS.find((x) => at(0, x) > Date.now() + SOON);
  const d = { course: null, title: '', body: '', path: null, when: 'now', day: firstHour ? 0 : 1, hour: firstHour ?? BEST_HOURS[0], preview: 'ios', ...(from || loadDraft() || {}) };
  if (d.course && !course(d.course)) d.course = null;
  if (at(d.day, d.hour) < Date.now() + SOON) Object.assign(d, { day: firstHour ? 0 : 1, hour: firstHour ?? BEST_HOURS[0] });
  const keep = () => saveDraft(d);
  if (from) keep();

  const form = h('form', { class: 'card setup compose', onsubmit: (e) => e.preventDefault() });
  const testBtn = h('button', { type: 'button', class: 'btn btn--secondary' }, 'إرسال تجربة');
  const sendBtn = h('button', { type: 'button', class: 'btn btn--primary' }, 'مراجعة وإرسال');

  // Title and body stay the same elements through redraws, so the keyboard and caret never jump.
  const title = h('input', { class: 'input', id: 'title', maxlength: String(LIMITS.title.max), autocomplete: 'off', enterkeyhint: 'next', value: d.title, placeholder: 'مثال: أسئلة جديدة في رياضيات الأعمال' });
  const body = h('textarea', { class: 'input', id: 'body', maxlength: String(LIMITS.body.max), rows: '3', placeholder: 'مثال: أضفنا اختبارات سابقة للوحدات 1–4. ابدأ التدريب الآن.' });
  body.value = d.body;
  const titleLen = h('span'), bodyLen = h('span');
  const preview = h('div');
  const warn = h('div', { class: 'card-grid' });
  title.addEventListener('input', () => { d.title = title.value; keep(); live(); });
  body.addEventListener('input', () => { d.body = body.value; keep(); live(); });
  title.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); body.focus(); } });

  // What changes while typing: the counters, the preview, the warnings, the button label.
  function live() {
    titleLen.replaceChildren(lenMeter(d.title.length, LIMITS.title));
    bodyLen.replaceChildren(lenMeter(d.body.length, LIMITS.body));
    const ios = d.preview === 'ios';
    preview.replaceChildren(h('div', { class: `phone phone--${d.preview}` },
      h('p', { class: 'phone__time' }, ios ? fmt(Date.now(), { hour: undefined, minute: undefined }) : 'الإشعارات'),
      h('div', { class: `pv pv--${d.preview}` },
        h('img', { class: 'pv__icon', src: asset('assets/icons/icon-192.png'), alt: '' }),
        h('div', { class: 'pv__copy' },
          h('div', { class: 'pv__head' }, h('span', {}, 'سمارت برو'), h('span', {}, 'الآن')),
          h('p', { class: 'pv__title' }, d.title.trim() || 'عنوان الإشعار'),
          h('p', { class: 'pv__body' }, d.body.trim() || 'نص الإشعار يظهر هنا.')))));
    // At most one a day and about five a week to the same students, or they turn notifications off.
    const same = o.sends.filter((s) => !d.course || !s.course || s.course === d.course);
    const today = same.filter((s) => Date.now() - s.sentAt < 24 * 3600 * 1000).length;
    const notes = [];
    if (today) notes.push('أرسلت لهم إشعارًا خلال آخر 24 ساعة. يُفضّل إشعار واحد يوميًا.');
    else if (same.length >= 4) notes.push(`أرسلت لهم ${same.length} إشعارات هذا الأسبوع. يُفضّل ألا تزيد على 5.`);
    if (d.title.length > LIMITS.title.ideal) notes.push('العنوان طويل وقد يظهر مقصوصًا على الآيفون.');
    warn.replaceChildren(...notes.map((n) => note('warn', ICONS.alert, n)));
    warn.hidden = !notes.length;
    sendBtn.textContent = d.when === 'later' ? 'مراجعة وجدولة' : 'مراجعة وإرسال';
  }

  function destinations() {
    if (!d.course) return [['', 'الصفحة الرئيسية', 'قائمة المقررات', ICONS.home], ...state.catalog.courses.map((c) => [`courses/${c.id}`, c.titleAr, 'صفحة المقرر', ICONS.book])];
    const c = course(d.course);
    return [[`courses/${c.id}`, 'صفحة المقرر', c.titleAr, I.page], ...c.topics.map((t) => [`courses/${c.id}/${t.id}`, t.label?.ar ?? t.title, null, ICONS.book])];
  }

  // What changes with a choice: the whole form (cheap, and every tile shows the new state).
  function redraw() {
    const dests = destinations();
    if (!dests.some(([v]) => v === d.path)) d.path = dests[0][0];
    const sendAt = at(d.day, d.hour);
    const hours = [...new Set([...BEST_HOURS, d.hour])].sort((a, b) => a - b);
    form.replaceChildren(
      group('المستلمون', h('div', { class: 'tiles' },
        [null, ...state.catalog.courses.map((c) => c.id)].map((id) => tile('aud', id ?? 'all', d.course === id, id ? ICONS.book : I.users,
          id ? courseName(id) : 'كل المشتركين', `${num(audienceCount(id))} مشترك`, () => { d.course = id; keep(); redraw(); })))),
      group('الرسالة',
        h('div', { class: 'templates', role: 'group', 'aria-label': 'قوالب جاهزة' }, TEMPLATES.map((tp) => h('button', {
          type: 'button', class: 'pillbtn',
          onclick: () => {
            const c = d.course ? courseName(d.course) : 'مقرراتك';
            title.value = d.title = tp.title(c).slice(0, LIMITS.title.max);
            body.value = d.body = tp.body(c).slice(0, LIMITS.body.max);
            if (d.course && tp.topic && course(d.course).topics.some((t) => t.id === tp.topic)) d.path = `courses/${d.course}/${tp.topic}`;
            keep();
            redraw();
          },
        }, tp.label))),
        h('div', { class: 'field' }, h('div', { class: 'field__top' }, h('label', { class: 'field__label', for: 'title' }, 'العنوان'), titleLen), title),
        h('div', { class: 'field' }, h('div', { class: 'field__top' }, h('label', { class: 'field__label', for: 'body' }, 'النص'), bodyLen), body)),
      group('يفتح عند الضغط عليه', h('div', { class: 'tiles' },
        dests.map(([v, t1, t2, ic]) => tile('dest', v || 'home', d.path === v, ic, t1, t2, () => { d.path = v; keep(); })))),
      group('وقت الإرسال',
        segs('when', [['now', 'الآن'], ['later', 'وقت محدد']], d.when, (v) => { d.when = v; keep(); redraw(); }),
        d.when === 'later' ? h('div', { class: 'when' },
          h('div', { class: 'tiles' }, [[0, 'اليوم'], [1, 'غدًا']].map(([v, label]) => tile('day', v, d.day === v, I.calendar, label, fmtDay(dayStart(v).getTime()),
            () => {
              d.day = v;
              if (at(d.day, d.hour) < Date.now() + SOON) d.hour = BEST_HOURS.find((x) => at(d.day, x) > Date.now() + SOON) ?? d.hour;
              keep(); redraw();
            }))),
          h('button', { type: 'button', class: 'pillbtn when__more', onclick: pickDay }, icon(...I.calendar), d.day > 1 ? fmtDay(dayStart(d.day).getTime()) : 'يوم آخر'),
          h('div', { class: 'tiles' }, hours.map((hr) => tile('hour', hr, d.hour === hr, I.clock, hourLabel(hr), BEST_HOURS.includes(hr) ? 'مقترح' : null,
            () => { d.hour = hr; keep(); redraw(); }, at(d.day, hr) < Date.now() + SOON))),
          h('button', { type: 'button', class: 'pillbtn when__more', onclick: pickHour }, icon(...I.clock), 'ساعة أخرى'),
          sendAt < Date.now() + SOON
            ? note('warn', ICONS.alert, 'هذا الوقت مضى. اختر يومًا أو ساعة أخرى.')
            : note('info', I.clock, `يُرسل ${fmt(sendAt)}.`)) : null),
      group('المعاينة', segs('pv', [['ios', 'آيفون'], ['android', 'أندرويد']], d.preview, (v) => { d.preview = v; keep(); live(); }), preview),
    );
    live();
  }

  async function pickDay() {
    const choice = await openSheet({
      title: 'اختر اليوم',
      closeLabel: 'إغلاق',
      build: (close) => h('div', { class: 'options' }, Array.from({ length: 14 }, (_, i) => i).map((v) => h('button', {
        type: 'button', class: `option${d.day === v ? ' is-selected' : ''}`, onclick: () => close(String(v)),
      }, h('span', { class: 'option__text' }, v === 0 ? `اليوم، ${fmtDay(dayStart(0).getTime())}` : v === 1 ? `غدًا، ${fmtDay(dayStart(1).getTime())}` : fmt(dayStart(v).getTime(), { hour: undefined, minute: undefined }))))),
    });
    if (choice === '') return;
    d.day = Number(choice);
    if (at(d.day, d.hour) < Date.now() + SOON) d.hour = BEST_HOURS.find((x) => at(d.day, x) > Date.now() + SOON) ?? 22;
    keep();
    redraw();
  }

  async function pickHour() {
    const choice = await openSheet({
      title: 'اختر الساعة',
      closeLabel: 'إغلاق',
      build: (close) => h('div', { class: 'options options--hours' }, Array.from({ length: 15 }, (_, i) => i + 8).map((hr) => h('button', {
        type: 'button', class: `option${d.hour === hr ? ' is-selected' : ''}`, disabled: at(d.day, hr) < Date.now() + SOON, onclick: () => close(String(hr)),
      }, h('span', { class: 'option__text' }, hourLabel(hr))))),
    });
    if (choice === '') return;
    d.hour = Number(choice);
    keep();
    redraw();
  }

  async function submit(test) {
    const titleText = d.title.trim(), bodyText = d.body.trim();
    if (!titleText || !bodyText) {
      toast('اكتب العنوان والنص');
      (titleText ? body : title).focus();
      return;
    }
    if (test && !o.testDevices.length) {
      const choice = await confirmDialog({
        title: 'لا يوجد جهاز تجربة',
        actions: [{ label: 'إلغاء', value: '' }, { label: 'الإعدادات', value: 'yes', primary: true }],
      });
      if (choice === 'yes') go('settings');
      return;
    }
    const later = !test && d.when === 'later';
    const atMs = later ? at(d.day, d.hour) : null;
    if (later && !(atMs > Date.now() + 2 * 60000)) { toast('هذا الوقت مضى. اختر يومًا أو ساعة أخرى.'); return; }
    const count = audienceCount(d.course);
    if (!test && !count) { toast('لا يوجد مشتركون بعد'); return; }
    if (!test) {
      const dest = destinations().find(([v]) => v === d.path);
      const choice = await openSheet({
        title: later ? 'مراجعة قبل الجدولة' : 'مراجعة قبل الإرسال',
        closeLabel: 'تعديل',
        build: (close) => [
          h('dl', { class: 'review-list' },
            h('div', {}, h('dt', {}, 'إلى'), h('dd', {}, `${audienceName(d.course)} (${num(count)} مشترك)`)),
            h('div', {}, h('dt', {}, 'العنوان'), h('dd', {}, titleText)),
            h('div', {}, h('dt', {}, 'النص'), h('dd', {}, bodyText)),
            h('div', {}, h('dt', {}, 'يفتح'), h('dd', {}, dest ? (dest[2] ? `${dest[1]}، ${dest[2]}` : dest[1]) : '')),
            h('div', {}, h('dt', {}, 'الوقت'), h('dd', {}, later ? fmt(atMs) : 'الآن'))),
          h('button', { type: 'button', class: 'btn btn--primary btn--block', onclick: () => close('yes') }, icon(...I.send), later ? 'جدولة' : 'إرسال الآن'),
        ],
      });
      if (choice !== 'yes') return;
    }
    const btn = test ? testBtn : sendBtn;
    try {
      const r = await busy(btn, later ? 'جارٍ الجدولة…' : 'جارٍ الإرسال…',
        () => api('send', { title: titleText, body: bodyText, course: d.course, path: d.path, test, at: atMs }));
      if (test) {
        toast(r.delivered ? 'تم إرسال التجربة' : 'لم تصل التجربة. أعد إضافة الجهاز من الإعدادات.');
        return;
      }
      dropDraft();
      showDone(r, later);
    } catch (err) { fail(err); }
  }
  testBtn.onclick = () => submit(true);
  sendBtn.onclick = () => submit(false);

  mountScreen('compose', {
    className: 'screen--compose',
    bar: pagebar({ title: 'إشعار جديد' }),
    body: [form, warn],
    foot: [h('footer', { class: 'bar bar--even' }, testBtn, sendBtn), tabbar()],
  });
  redraw();
}

/** After a send or a schedule: what happened, then back to the app. */
function showDone(r, later) {
  const ok = later || r.delivered > 0;
  mountScreen('done', {
    className: 'screen--done',
    enter: 'fade',
    body: h('section', { class: 'card empty done' },
      h('span', { class: `empty__icon done__icon${ok ? '' : ' is-warn'}` }, icon(...(ok ? ICONS.check : ICONS.alert))),
      h('h1', {}, later ? 'تمت الجدولة' : ok ? 'تم الإرسال' : 'لم يصل لأي جهاز'),
      h('p', {}, later ? `${fmt(r.sendAt)}`
        : ok ? `وصل إلى ${num(r.delivered)} من ${num(r.total)} مشترك`
        : !r.total ? 'لا يوجد مشتركون بعد'
        : r.removed === r.total ? 'الاشتراكات لم تعد فعّالة'
        : 'تعذّر الإرسال. حاول مرة أخرى.'),
      h('div', { class: 'done__card' }, h('p', { class: 'sent__title' }, r.title), h('p', { class: 'sent__body' }, r.body)),
      h('div', { class: 'done__actions' },
        h('button', { type: 'button', class: 'btn btn--secondary', onclick: () => go('compose') }, 'إشعار جديد آخر'),
        h('button', { type: 'button', class: 'btn btn--primary', onclick: () => go('history') }, 'عرض في السجل'))),
    foot: tabbar(),
  });
}

/* ---------- start ---------- */

addEventListener('popstate', () => {
  if (!state.overview) return;
  const tab = location.hash.slice(1);
  go(TABS.some(([id]) => id === tab) ? tab : state.tab);
});

async function start() {
  state.catalog = await (await fetch(asset('data/catalog.json'), { cache: 'no-cache' })).json();
  await Promise.all([refresh(), pushOk() ? thisDevice().catch(() => null) : null]);
  const tab = location.hash.slice(1);
  go(TABS.some(([id]) => id === tab) ? tab : 'home');
}

initTheme();
buildHeader();
navigator.serviceWorker?.register(new URL('sw.js', location.href), { scope: './' }).catch(() => {});
start().catch((err) => (err instanceof SignedOut ? showLogin() : mountScreen('error', {
  body: h('div', { class: 'card empty' }, h('span', { class: 'empty__icon' }, icon(...ICONS.alert)), h('h1', {}, 'تعذّر الاتصال'),
    h('p', {}, errorText(err)), h('button', { type: 'button', class: 'btn btn--primary btn--sm', onclick: () => location.reload() }, 'إعادة المحاولة')),
})));
