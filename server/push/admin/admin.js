// The owner's notifications page: subscriber counts, a composer with a live preview, test and real sends, history.
// Served by server/push/server.mjs at /admin/ (live) and /preview/admin/ (preview); nginx asks for the password.

const $ = (id) => document.getElementById(id);
const SITE_BASE = new URL('../', location.href); // the site's root: / or /preview/
const api = (path, init) => fetch(new URL(`api/${path}`, location.href), init).then(async (res) => {
  const data = res.status === 204 ? null : await res.json().catch(() => null);
  if (!res.ok) throw new Error(data?.error || `HTTP ${res.status}`);
  return data;
});

let catalog = { courses: [] };
let stats = { total: 0, perCourse: {} };

const courseName = (id) => catalog.courses.find((c) => c.id === id)?.titleAr ?? id;
const fmtDate = (ms) => new Intl.DateTimeFormat('ar-u-ca-gregory-nu-latn', { day: 'numeric', month: 'long', year: 'numeric', hour: 'numeric', minute: '2-digit' }).format(ms);
const option = (value, text) => Object.assign(document.createElement('option'), { value, textContent: text });

function showMessage(text, kind = 'ok') {
  const el = $('msg');
  el.textContent = text;
  el.className = `msg msg--${kind}`;
  el.hidden = false;
}

function fillTargets() {
  const to = $('to');
  const current = to.value;
  to.replaceChildren(option('', `كل المشتركين (${stats.total})`),
    ...catalog.courses.map((c) => option(c.id, `مشتركو ${c.titleAr} (${stats.perCourse[c.id] || 0})`)));
  to.value = current;
  fillPaths();
}

function fillPaths() {
  const id = $('to').value;
  const path = $('path');
  if (!id) {
    path.replaceChildren(option('', 'الصفحة الرئيسية'), ...catalog.courses.map((c) => option(`courses/${c.id}`, `صفحة ${c.titleAr}`)));
    return;
  }
  const c = catalog.courses.find((x) => x.id === id);
  path.replaceChildren(option(`courses/${id}`, `صفحة المقرر: ${c.titleAr}`),
    ...c.topics.map((t) => option(`courses/${id}/${t.id}`, `${t.label?.ar ?? `الموضوع ${t.number}`}: ${t.title}`)));
}

function preview() {
  const title = $('title').value.trim();
  const body = $('body').value.trim();
  $('pv-title').textContent = title || 'العنوان';
  $('pv-body').textContent = body || 'النص';
  $('title-count').textContent = `${$('title').value.length}/60`;
  $('body-count').textContent = `${$('body').value.length}/180`;
}

async function loadStats() {
  stats = await api('stats');
  $('site').textContent = stats.site === 'preview' ? 'النسخة التجريبية' : 'الموقع الرسمي';
  $('site').classList.toggle('site--preview', stats.site === 'preview');
  $('total').textContent = stats.total;
  $('last').textContent = stats.lastSubscribed ? fmtDate(stats.lastSubscribed) : '—';
  $('per-course').replaceChildren(...catalog.courses.map((c) => {
    const li = document.createElement('li');
    li.append(Object.assign(document.createElement('span'), { textContent: c.titleAr }), Object.assign(document.createElement('strong'), { textContent: stats.perCourse[c.id] || 0 }));
    return li;
  }));
  fillTargets();
}

async function loadHistory() {
  const rows = await api('history');
  $('history-empty').hidden = rows.length > 0;
  $('history').replaceChildren(...rows.map((r) => {
    const el = (tag, cls, text) => Object.assign(document.createElement(tag), { className: cls, textContent: text });
    const pct = r.delivered ? Math.round((r.clicks / r.delivered) * 100) : 0;
    const li = el('li', `send${r.test ? ' send--test' : ''}`, '');
    const meta = el('p', 'send__meta', '');
    meta.append(el('span', '', fmtDate(r.created)), el('span', 'send__to', r.test ? 'تجربة' : r.course ? courseName(r.course) : 'كل المشتركين'));
    const nums = el('p', 'send__nums', '');
    nums.append(el('span', '', `وصل ${r.delivered} من ${r.total}`), Object.assign(el('span', '', `ضغط عليه ${r.clicks}`), { title: 'من الذين وصلهم' }), Object.assign(el('span', 'send__pct', `${pct}%`), { dir: 'ltr' }), ...(r.failed ? [el('span', 'send__fail', `لم يصل ${r.failed}`)] : []));
    li.append(meta, el('p', 'send__title', r.title), el('p', 'send__body', r.body), nums);
    return li;
  }));
}

async function sendNow(test) {
  const title = $('title').value.trim();
  const body = $('body').value.trim();
  if (!title || !body) return showMessage('اكتب العنوان والنص أولًا.', 'error');
  const course = $('to').value || null;
  const count = course ? stats.perCourse[course] || 0 : stats.total;
  if (!test) {
    if (!count) return showMessage('لا يوجد مشتركون في هذا الاختيار بعد.', 'error');
    $('confirm-text').textContent = `سيصل هذا التنبيه إلى ${count} ${count === 1 ? 'جهاز' : 'جهازًا'}${course ? ` من مشتركي ${courseName(course)}` : ''}. لا يمكن التراجع بعد الإرسال.`;
    $('confirm').showModal();
    const choice = await new Promise((resolve) => $('confirm').addEventListener('close', () => resolve($('confirm').returnValue), { once: true }));
    if (choice !== 'send') return;
  } else if (!stats.total) return showMessage('لا يوجد أي جهاز مشترك بعد. فعّل الجرس في التطبيق على جوالك أولًا.', 'error');

  for (const b of [$('send'), $('test')]) b.disabled = true;
  showMessage('جارٍ الإرسال…', 'wait');
  try {
    const r = await api('send', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title, body, course, path: $('path').value, test }) });
    const extra = r.removed ? ` حُذف ${r.removed} اشتراك منتهٍ.` : '';
    showMessage(test ? `أُرسلت التجربة (${r.delivered ? 'وصلت' : 'لم تصل'}).${extra}` : `تم الإرسال: وصل إلى ${r.delivered} من ${r.total}.${extra}`, r.delivered ? 'ok' : 'error');
    await Promise.all([loadStats(), loadHistory()]);
  } catch (err) {
    showMessage(`تعذّر الإرسال: ${err.message}`, 'error');
  } finally {
    for (const b of [$('send'), $('test')]) b.disabled = false;
  }
}

$('to').addEventListener('change', fillPaths);
$('title').addEventListener('input', preview);
$('body').addEventListener('input', preview);
$('test').addEventListener('click', () => sendNow(true));
$('compose').addEventListener('submit', (e) => {
  e.preventDefault();
  sendNow(false);
});

(async () => {
  try {
    catalog = await (await fetch(new URL('data/catalog.json', SITE_BASE), { cache: 'no-cache' })).json();
    await Promise.all([loadStats(), loadHistory()]);
    preview();
  } catch (err) {
    showMessage(`تعذّر تحميل الصفحة: ${err.message}`, 'error');
  }
})();
