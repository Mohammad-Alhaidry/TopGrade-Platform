// A topic's quiz: setup -> questions -> results -> review, all on the topic's URL.
// Practice mode checks each answer before moving on; exam mode reveals everything at the end.
// Answers feed the device's study progress; an unfinished run is saved so it can be resumed.
// Interface text follows the chosen language; question content stays English and left-to-right.

import { TYPES, letterOf } from '../quiz/bank.js';
import { isAnswered, isCorrect, matchingResults, correctAnswerText, responseText } from '../quiz/grading.js';
import { createSession, summarize } from '../quiz/session.js';
import { serializeRun, deserializeRun, savedBankKey } from '../quiz/store.js';
import { confirmDialog, openSheet } from '../quiz/dialog.js';
import { h, icon, ICONS, TYPE_ICONS, staticSvg } from '../quiz/dom.js';
import { pagebar, iconButton, backLink, backIcon, screen, mount, enText } from './shell.js';
import { readProgress, writeProgress, recordAnswers, recordRun, topicStats } from './progress.js';
import { topicKey } from './catalog.js';
import { paths } from './routes.js';
import { navigate } from './router.js';
import { t, localName } from './i18n.js';

const STORAGE_KEY = 'topgrade.run.v1';
const COUNT_CHOICES = [10, 20, 40];
const typeLabel = (type) => t(`type.${type}`);

const state = {
  ctx: null, // { course, topic, bank }
  screen: 'setup', // setup | quiz | results | review
  setup: { mode: 'practice', types: [...TYPES], count: 20 },
  run: null, // { kind, session, index, checked[], startedAt, finishedAt, prevBest }
  reviewFilter: 'missed',
  reviewFocus: null,
  pending: null, // { key, run } started by openTopic
};

const key = () => topicKey(state.ctx.course, state.ctx.topic);
const answeredCount = (session) => session.items.filter((it, i) => isAnswered(it.question, session.responses[i])).length;

/* ---------- Saved run (per device; the quiz works without it) ---------- */

function readSavedData() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY));
  } catch {
    return null;
  }
}

/** "course/topic" of the unfinished run on this device, if any. */
export const savedRunTopic = () => savedBankKey(readSavedData());

/** The unfinished run for this bank, rebuilt, or null. */
export const readSavedRun = (bank) => deserializeRun(bank, readSavedData());

function writeSaved(run) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(serializeRun(state.ctx.bank, run)));
  } catch {
    /* storage unavailable (private mode, quota): resuming just isn't offered */
  }
}

function clearSaved() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* same as above */
  }
}

function saveProgress(update) {
  writeProgress(update(readProgress()));
}

/* ---------- History and navigation guards ---------- */

const enterQuizHistory = () =>
  history.state?.screen === 'quiz' ? history.replaceState({ screen: 'quiz' }, '') : history.pushState({ screen: 'quiz' }, '');

const inRun = () => state.screen === 'quiz' && state.run && !state.run.finishedAt;

/** Called by the router before it handles Back. Returns true when the quiz handled it. */
export function handlePop() {
  if (inRun()) {
    history.pushState({ screen: 'quiz' }, '');
    confirmLeave();
    return true;
  }
  if (state.screen === 'review' && state.run) {
    showResults();
    return true;
  }
  state.run = null;
  state.screen = 'setup';
  return false;
}

/** Called by the router before following a link (e.g. the header logo). Mid-quiz it asks first. */
export function allowNavigation(path) {
  if (!inRun()) {
    state.run = null;
    state.screen = 'setup';
    return true;
  }
  confirmLeave(() => {
    state.run = null;
    state.screen = 'setup';
    navigate(path);
  });
  return false;
}

/** Re-renders whatever quiz screen is showing (after a language change). Returns false if none is. */
export function rerender() {
  if (!state.ctx) return false;
  if (state.screen === 'quiz' && state.run) showQuestion();
  else if (state.screen === 'results' && state.run) showResults();
  else if (state.screen === 'review' && state.run) showReview(state.reviewFocus);
  else return false;
  return true;
}

/* ---------- Setup ---------- */

/** Entry point for a topic URL. ctx = { course, topic, bank }. Starts a queued run, else shows setup. */
export function openTopic(ctx) {
  const pending = state.pending;
  state.pending = null;
  if (pending && pending.key === topicKey(ctx.course, ctx.topic)) {
    state.ctx = ctx;
    beginRun(pending.run);
  } else {
    showTopic(ctx);
  }
}

function showTopic(ctx) {
  if (state.ctx?.bank !== ctx.bank) state.setup = { mode: 'practice', types: [...TYPES], count: 20 };
  state.ctx = ctx;
  state.run = null;
  state.screen = 'setup';
  mount(setupView());
}

/** Queues a run (quick quiz, mistake review, resume) to start when its topic page opens next. */
export function queueRun(course, topic, run) {
  state.pending = { key: topicKey(course, topic), run };
}

export function newRun(session, kind = 'topic') {
  return { kind, session, index: 0, checked: session.items.map(() => false), startedAt: Date.now(), finishedAt: null, prevBest: null };
}

function setupView() {
  const { bank, course, topic } = state.ctx;
  const { setup } = state;
  const counts = Object.fromEntries(TYPES.map((type) => [type, bank.questions.filter((q) => q.type === type).length]));
  const available = () => setup.types.reduce((n, type) => n + counts[type], 0);
  const resume = readSavedRun(bank);
  const stats = topicStats(readProgress(), key(), bank.questions.map((q) => q.id));
  const name = localName(course);

  const allLabel = h('span');
  const startLabel = h('span');
  const start = h('button', { type: 'submit', form: 'setup-form', class: 'btn btn--primary btn--block' }, startLabel);
  const refresh = () => {
    allLabel.textContent = t('setup.all', { n: available() });
    const n = Math.min(setup.count ?? Infinity, available());
    startLabel.textContent = setup.types.length ? t('setup.start', { n }) : t('setup.chooseType');
    start.disabled = setup.types.length === 0;
  };

  const modeTile = (value, title, text, iconPaths) =>
    h('label', { class: 'tile' },
      h('input', { type: 'radio', name: 'mode', value, checked: setup.mode === value, onchange: () => { setup.mode = value; refresh(); } }),
      h('span', { class: 'tile__icon' }, icon(...iconPaths)),
      h('span', { class: 'tile__copy' }, h('span', { class: 'tile__title' }, title), h('span', { class: 'tile__text' }, text)));

  const typeTile = (type) =>
    h('label', { class: 'tile' },
      h('input', {
        type: 'checkbox',
        checked: setup.types.includes(type),
        onchange: (e) => {
          setup.types = e.target.checked ? TYPES.filter((x) => x === type || setup.types.includes(x)) : setup.types.filter((x) => x !== type);
          refresh();
        },
      }),
      h('span', { class: 'tile__icon tile__icon--art' }, staticSvg(TYPE_ICONS[type])),
      h('span', { class: 'tile__copy' }, h('span', { class: 'tile__title' }, typeLabel(type)), h('span', { class: 'tile__text' }, t('n.questions', { n: counts[type] }))),
      h('span', { class: 'tile__tick' }, icon(...ICONS.check)));

  const countOption = (value, label) =>
    h('label', { class: 'seg' },
      h('input', { type: 'radio', name: 'count', value: String(value), checked: setup.count === value, onchange: () => { setup.count = value; refresh(); } }),
      h('span', {}, label));

  const resumeCard = resume
    ? h('section', { class: 'card resume', 'aria-label': t('resume.label') },
        h('div', { class: 'resume__copy' },
          h('p', { class: 'resume__title' }, t(resume.kind === 'mistakes' ? 'resume.mistakes' : `resume.${resume.session.mode}`)),
          h('p', { class: 'resume__text' }, t('resume.text', { i: resume.index + 1, n: resume.session.items.length, a: answeredCount(resume.session) }))),
        h('div', { class: 'resume__actions' },
          h('button', { type: 'button', class: 'btn btn--quiet btn--sm', onclick: () => { clearSaved(); mount(setupView()); } }, t('resume.discard')),
          h('button', { type: 'button', class: 'btn btn--primary btn--sm', onclick: () => beginRun(resume) }, t('resume.resume'))))
    : null;

  const mistakesCard = stats.mistakes.length
    ? h('section', { class: 'card mistakes-cta' },
        h('span', { class: 'mistakes-cta__icon' }, icon(...ICONS.target)),
        h('div', { class: 'mistakes-cta__copy' },
          h('p', { class: 'mistakes-cta__title' }, t('mist.title', { n: stats.mistakes.length })),
          h('p', { class: 'mistakes-cta__text' }, t('mist.text'))),
        h('button', {
          type: 'button',
          class: 'btn btn--secondary btn--sm',
          onclick: () => beginRun(newRun(createSession(bank, { ids: stats.mistakes, mode: 'practice' }), 'mistakes')),
        }, t('practise')))
    : null;

  const view = screen({
    className: 'screen--setup',
    bar: pagebar({
      start: backLink(paths.course(course.id), t('backTo', { name: name.main })),
      title: t('topicN', { n: topic.number }),
      sub: h('span', enText(), topic.title),
    }),
    body: [
      h('div', { class: 'col col--side' },
      h('section', { class: 'card course-head' },
        h('p', { class: 'course-head__en', lang: name.mainLang }, name.main),
        name.sub ? h('p', { class: 'course-head__ar', lang: name.subLang, dir: name.subLang === 'ar' ? 'rtl' : 'ltr' }, name.sub) : null,
        stats.answered
          ? h('p', { class: 'course-head__stats' },
              h('span', {}, t('masteredPct', { p: stats.percent })),
              stats.best !== null ? h('span', {}, t('bestPct', { p: stats.best })) : null)
          : null),
      resumeCard,
      mistakesCard),
      h('form', {
        id: 'setup-form',
        class: 'card setup',
        onsubmit: (e) => {
          e.preventDefault();
          if (!setup.types.length) return;
          beginRun(newRun(createSession(bank, { types: setup.types, count: setup.count, mode: setup.mode })));
        },
      },
        h('fieldset', { class: 'setup__group' }, h('legend', {}, t('setup.mode')), h('div', { class: 'tiles' },
          modeTile('practice', t('mode.practice'), t('mode.practiceText'), ICONS.practice),
          modeTile('exam', t('mode.exam'), t('mode.examText'), ICONS.exam))),
        h('fieldset', { class: 'setup__group' }, h('legend', {}, t('setup.types')), h('div', { class: 'tiles' }, TYPES.map(typeTile))),
        h('fieldset', { class: 'setup__group' }, h('legend', {}, t('setup.count')), h('div', { class: 'segs' },
          COUNT_CHOICES.map((n) => countOption(n, String(n))),
          countOption(null, allLabel)))),
    ],
    foot: h('footer', { class: 'bar' }, start),
  });
  refresh();
  return view;
}

/* ---------- Running a quiz ---------- */

function beginRun(run) {
  run.prevBest = topicStats(readProgress(), key(), []).best;
  state.run = run;
  writeSaved(run);
  enterQuizHistory();
  showQuestion();
}

/** Asks before leaving a quiz. onLeave defaults to returning to the topic page. */
async function confirmLeave(onLeave = leaveRun) {
  const choice = await confirmDialog({
    title: t('leave.title'),
    text: t('leave.text'),
    actions: [
      { label: t('leave.stay'), value: 'stay' },
      { label: t('leave.go'), value: 'leave', primary: true },
    ],
  });
  if (choice === 'leave') onLeave();
}

function leaveRun() {
  state.run = null;
  state.screen = 'setup';
  if (history.state?.screen === 'quiz') history.back(); // the router then shows the topic page
  else showTopic(state.ctx);
}

function setResponse(value, focus) {
  const run = state.run;
  run.session.responses[run.index] = value;
  writeSaved(run);
  showQuestion(focus);
}

function check() {
  const run = state.run;
  const q = run.session.items[run.index].question;
  const response = run.session.responses[run.index];
  if (!isAnswered(q, response)) return;
  run.checked[run.index] = true;
  writeSaved(run);
  saveProgress((p) => recordAnswers(p, key(), [{ id: q.id, correct: isCorrect(q, response) }]));
  showQuestion('[data-continue]');
}

function goTo(i) {
  const run = state.run;
  if (i < 0) return;
  if (i >= run.session.items.length) return finishRun();
  run.index = i;
  writeSaved(run);
  showQuestion();
}

function showQuestion(focus) {
  state.screen = 'quiz';
  const { view, onKey } = questionView();
  mount(view, { focus, onKey });
}

/** Prompt text with "____" shown as a gap; `fill` puts the chosen word into it. */
function promptContent(text, fill = null) {
  return text.split(/(_{3,})/).map((part) => {
    if (!/^_{3,}$/.test(part)) return part;
    if (!fill?.word) return h('span', { class: 'gap', 'aria-label': t('q.blank') });
    return h('span', { class: `gap gap--filled${fill.state ? ` is-${fill.state}` : ''}` }, fill.word);
  });
}

function optionButton({ key: k, text, selected, right, wrong, dim, disabled, data, onclick, content = true }) {
  return h('button', {
    type: 'button',
    class: `option${selected ? ' is-selected' : ''}${right ? ' is-right' : ''}${wrong ? ' is-wrong' : ''}${dim ? ' is-dim' : ''}`,
    'aria-pressed': String(selected),
    disabled,
    dataset: data,
    onclick,
    ...(content ? enText() : {}),
  },
  k ? h('span', { class: 'option__key' }, k) : null,
  h('span', { class: 'option__text' }, text),
  right || wrong ? h('span', { class: 'option__mark' }, icon(...(right ? ICONS.check : ICONS.cross))) : null);
}

function mcqAnswers(item, response, revealed) {
  const q = item.question;
  return h('div', { class: 'options', role: 'group', 'aria-label': t('q.options') },
    item.optionOrder.map((optIndex, pos) => {
      const selected = response === optIndex;
      const right = revealed && isCorrect(q, optIndex);
      return optionButton({
        key: letterOf(pos),
        text: q.options[optIndex],
        selected,
        right,
        wrong: revealed && selected && !right,
        dim: revealed && !selected && !right,
        disabled: revealed,
        data: { opt: String(optIndex) },
        onclick: () => setResponse(optIndex, `[data-opt="${optIndex}"]`),
      });
    }));
}

function tfAnswers(item, response, revealed) {
  const q = item.question;
  return h('div', { class: 'options options--pair', role: 'group', 'aria-label': t('q.tfGroup') },
    [true, false].map((value) => {
      const selected = response === value;
      const right = revealed && q.answer === value;
      return optionButton({
        text: t(value ? 'true' : 'false'),
        content: false,
        selected,
        right,
        wrong: revealed && selected && !right,
        dim: revealed && !selected && !right,
        disabled: revealed,
        data: { tf: String(value) },
        onclick: () => setResponse(value, `[data-tf="${value}"]`),
      });
    }));
}

function blankAnswers(item, response, revealed) {
  const q = item.question;
  return h('div', { class: 'options options--pair options--words', role: 'group', 'aria-label': t('q.words') },
    item.wordChoices.map((word, pos) => {
      const selected = response === word;
      const right = revealed && isCorrect(q, word);
      return optionButton({
        text: word,
        selected,
        right,
        wrong: revealed && selected && !right,
        dim: revealed && !selected && !right,
        disabled: revealed,
        data: { word: String(pos) },
        onclick: () => setResponse(word, `[data-word="${pos}"]`),
      });
    }));
}

function matchingAnswer(item, response, revealed, onChange) {
  const q = item.question;
  const current = Array.isArray(response) ? [...response] : q.pairs.map(() => '');
  const marks = revealed ? matchingResults(q, current) : [];
  return h('ul', enText({ class: 'pairs' }),
    q.pairs.map((pair, i) =>
      h('li', { class: `card pair${revealed ? (marks[i] ? ' is-right' : ' is-wrong') : ''}` },
        h('span', { class: 'pair__left', id: `pair-${i}` }, pair.left),
        h('div', { class: 'pair__pick' },
          h('select', {
            disabled: revealed,
            'aria-labelledby': `pair-${i}`,
            onchange: (e) => {
              current[i] = e.target.value;
              state.run.session.responses[state.run.index] = [...current];
              writeSaved(state.run);
              onChange();
            },
          },
          h('option', { value: '', selected: !current[i] }, t('match.choose')),
          item.choiceOrder.map((choice) => h('option', { value: choice, selected: current[i] === choice }, choice))),
          revealed ? h('span', { class: 'pair__mark' }, icon(...(marks[i] ? ICONS.check : ICONS.cross))) : null),
        revealed && !marks[i] ? h('p', { class: 'pair__fix' }, h('span', { class: 'pair__fix-label' }, t('answerLabel')), ' ', h('strong', {}, pair.right)) : null)));
}

function notes(q) {
  return [
    q.explanation ? h('p', enText({ class: 'note' }), q.explanation) : null,
    q.source?.page !== undefined ? h('p', { class: 'note note--source' }, t('pageN', { p: q.source.page })) : null,
  ];
}

function verdictBar(q, response, last) {
  const ok = isCorrect(q, response);
  let detail = null;
  if (!ok && q.type === 'matching') {
    const right = matchingResults(q, response).filter(Boolean).length;
    detail = h('p', { class: 'verdict__detail' }, t('v.matched', { r: right, n: q.pairs.length }));
  } else if (!ok) {
    detail = h('p', { class: 'verdict__detail' }, t('answerLabel'), ' ',
      h('strong', q.type === 'tf' ? {} : enText(), q.type === 'tf' ? t(q.answer ? 'true' : 'false') : correctAnswerText(q)));
  }
  return h('footer', { class: `bar bar--verdict ${ok ? 'is-right' : 'is-wrong'}` },
    h('div', { class: 'verdict', role: 'status' },
      h('span', { class: 'verdict__icon' }, icon(...(ok ? ICONS.check : ICONS.cross))),
      h('div', { class: 'verdict__copy' },
        h('p', { class: 'verdict__title' }, t(ok ? 'v.correct' : 'v.wrong')),
        detail,
        notes(q))),
    h('button', { type: 'button', class: 'btn btn--block btn--verdict', 'data-continue': true, onclick: () => goTo(state.run.index + 1) },
      t(last ? 'seeResults' : 'continue')));
}

function openQuestionMap() {
  const { session, index } = state.run;
  const total = session.items.length;
  openSheet({
    title: t('map.title'),
    closeLabel: t('close'),
    build: (close) => {
      const done = answeredCount(session);
      return [
        h('p', { class: 'sheet__summary' },
          h('span', { class: 'legend legend--done' }, t('map.answered', { n: done })),
          h('span', { class: 'legend' }, t('map.unanswered', { n: total - done }))),
        h('ol', { class: 'qmap' },
          session.items.map((it, i) => {
            const answered = isAnswered(it.question, session.responses[i]);
            return h('li', {},
              h('button', {
                type: 'button',
                class: `qmap__cell${answered ? ' is-done' : ''}${i === index ? ' is-current' : ''}`,
                'aria-label': t('map.cell', { i: i + 1, state: t(answered ? 'state.answered' : 'state.unanswered') }),
                'aria-current': i === index ? 'step' : null,
                onclick: () => { close(); goTo(i); },
              }, String(i + 1)));
          })),
        h('div', { class: 'sheet__foot' },
          h('button', { type: 'button', class: 'btn btn--primary btn--block', onclick: () => { close(); submitExam(); } }, t('submit'))),
      ];
    },
  });
}

async function submitExam() {
  const unanswered = state.run.session.items.length - answeredCount(state.run.session);
  if (unanswered) {
    const choice = await confirmDialog({
      title: t('submit.title', { n: unanswered }),
      text: t('submit.text'),
      actions: [
        { label: t('submit.stay'), value: 'stay' },
        { label: t('submit.go'), value: 'submit', primary: true },
      ],
    });
    if (choice !== 'submit') return;
  }
  finishRun();
}

function questionView() {
  const run = state.run;
  const { session, index } = run;
  const item = session.items[index];
  const q = item.question;
  const exam = session.mode === 'exam';
  const total = session.items.length;
  const last = index === total - 1;
  const response = session.responses[index];
  const revealed = !exam && run.checked[index];
  const answered = answeredCount(session);
  const rightSoFar = session.items.filter((it, i) => run.checked[i] && isCorrect(it.question, session.responses[i])).length;

  // Footer primary button; selecting in a matching question updates it without a re-render.
  const primary = h('button', { type: 'button', class: 'btn btn--primary btn--block' });
  const syncPrimary = () => {
    if (!exam && !revealed) primary.disabled = !isAnswered(q, session.responses[index]);
  };
  const runPrimary = () => primary.disabled || primary.click();

  let answers;
  if (q.type === 'mcq') answers = mcqAnswers(item, response, revealed);
  else if (q.type === 'tf') answers = tfAnswers(item, response, revealed);
  else if (q.type === 'fib') answers = blankAnswers(item, response, revealed);
  else answers = matchingAnswer(item, response, revealed, syncPrimary);

  let footer;
  if (revealed) {
    footer = verdictBar(q, response, last);
  } else if (!exam) {
    primary.append(t('q.check'));
    primary.onclick = check;
    footer = h('footer', { class: 'bar' }, primary);
  } else {
    if (last) {
      primary.append(t('q.reviewSubmit'));
      primary.onclick = openQuestionMap;
    } else {
      primary.append(t('q.next'));
      primary.onclick = () => goTo(index + 1);
    }
    footer = h('footer', { class: 'bar bar--split' },
      h('button', { type: 'button', class: 'btn btn--secondary btn--square', disabled: index === 0, 'aria-label': t('q.prev'), onclick: () => goTo(index - 1) }, backIcon()),
      primary);
  }
  syncPrimary();

  const modeLabel = run.kind === 'mistakes' ? t('mode.mistakes') : t(exam ? 'mode.exam' : 'mode.practice');
  const view = screen({
    className: 'screen--quiz',
    bar: pagebar({
      start: iconButton(icon(...ICONS.close), t('quiz.leave'), () => confirmLeave()),
      title: h('span', { class: 'qcount' }, t('q.question'), ' ', h('strong', {}, String(index + 1)), ' ', t('q.of', { n: total })),
      sub: modeLabel,
      end: exam
        ? h('button', { type: 'button', class: 'pillbtn', 'aria-label': t('q.map', { a: answered, n: total }), onclick: openQuestionMap },
            icon(...ICONS.grid), h('span', { 'aria-hidden': 'true' }, `${answered}/${total}`))
        : h('p', { class: 'pillbtn pillbtn--score', 'aria-label': t('q.soFar', { n: rightSoFar }) }, icon(...ICONS.check), String(rightSoFar)),
      meter: h('div', { class: 'pagebar__meter', role: 'progressbar', 'aria-valuemin': '0', 'aria-valuemax': String(total), 'aria-valuenow': String(index + 1) },
        h('span', { style: `transform:scaleX(${(index + 1) / total})` })),
    }),
    body: [
      h('section', { class: 'card qcard' },
        h('p', { class: 'qcard__hint' }, h('span', { class: 'qcard__type' }, typeLabel(q.type)), h('span', {}, t(`hint.${q.type}`))),
        h('p', enText({ class: 'qcard__prompt' }),
          q.type === 'matching' ? q.title
            : promptContent(q.prompt, q.type === 'fib' ? { word: response, state: revealed ? (isCorrect(q, response) ? 'right' : 'wrong') : null } : null))),
      answers,
    ],
    foot: footer,
  });

  // Desktop shortcuts: A-F / 1-6 pick an option or word, Enter checks or continues, arrows move in exam mode.
  // A shortcut leaves focus on the question so the next Enter goes to the footer action.
  const onKey = (e) => {
    const typing = e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement;
    if (typing) return;
    if (!revealed && (q.type === 'mcq' || q.type === 'tf' || q.type === 'fib')) {
      const k = e.key.toLowerCase();
      const pos = /^[1-6]$/.test(k) ? Number(k) - 1 : /^[a-f]$/.test(k) && q.type !== 'tf' ? k.charCodeAt(0) - 97 : -1;
      if (q.type === 'mcq' && pos >= 0 && pos < item.optionOrder.length) return setResponse(item.optionOrder[pos]);
      if (q.type === 'fib' && pos >= 0 && pos < item.wordChoices.length) return setResponse(item.wordChoices[pos]);
      if (q.type === 'tf' && (pos === 0 || k === 't')) return setResponse(true);
      if (q.type === 'tf' && (pos === 1 || k === 'f')) return setResponse(false);
    }
    if (e.key === 'Enter' && !(e.target instanceof HTMLButtonElement)) {
      e.preventDefault();
      if (revealed) view.querySelector('[data-continue]')?.click();
      else runPrimary();
    }
    const nextKey = document.documentElement.dir === 'rtl' ? 'ArrowLeft' : 'ArrowRight';
    const prevKey = document.documentElement.dir === 'rtl' ? 'ArrowRight' : 'ArrowLeft';
    if (exam && e.key === nextKey && !last) goTo(index + 1);
    if (exam && e.key === prevKey) goTo(index - 1);
  };
  return { view, onKey };
}

/* ---------- Results ---------- */

function finishRun() {
  const run = state.run;
  run.finishedAt = Date.now();
  state.reviewFilter = 'missed';
  clearSaved();
  const s = summarize(run.session);
  saveProgress((p) => {
    let next = p;
    if (run.session.mode === 'exam') {
      // Practice answers were recorded as each one was checked; exam answers are recorded now.
      const answers = s.results.filter((r) => r.answered).map((r) => ({ id: r.item.question.id, correct: r.correct }));
      next = recordAnswers(next, key(), answers, run.finishedAt);
    }
    return recordRun(next, key(), { percent: s.percent, counts: run.kind === 'topic' }, run.finishedAt);
  });
  showResults();
}

function showResults() {
  state.screen = 'results';
  mount(resultsView(state.run));
}

function duration(ms) {
  const mins = Math.round(ms / 60000);
  if (mins < 1) return t('res.underMinute');
  if (mins < 60) return t('n.minutes', { n: mins });
  return t('res.hours', { h: Math.floor(mins / 60), m: mins % 60 });
}

function scoreRing(percent) {
  const r = 52;
  const c = 2 * Math.PI * r;
  const ns = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(ns, 'svg');
  svg.setAttribute('viewBox', '0 0 120 120');
  svg.setAttribute('aria-hidden', 'true');
  for (const [cls, dash] of [['ring__track', c], ['ring__arc', (percent / 100) * c]]) {
    const el = document.createElementNS(ns, 'circle');
    el.setAttribute('cx', '60');
    el.setAttribute('cy', '60');
    el.setAttribute('r', String(r));
    el.setAttribute('class', cls);
    el.setAttribute('stroke-dasharray', `${dash} ${c}`);
    svg.append(el);
  }
  return h('div', { class: 'ring' }, svg, h('p', { class: 'ring__text', dir: 'ltr' }, String(percent), h('span', {}, '%')));
}

const stateKey = (r) => (r.correct ? 'state.correct' : r.answered ? 'state.wrong' : 'state.skipped');

function resultsView(run) {
  const { session } = run;
  const s = summarize(session);
  const wrong = s.answered - s.correct;
  const skipped = s.total - s.answered;
  const missedIds = s.results.filter((r) => !r.correct).map((r) => r.item.question.id);
  const newBest = run.kind === 'topic' && run.prevBest !== null && s.percent > run.prevBest;
  const retry = () => beginRun(newRun(createSession(state.ctx.bank, { ids: missedIds, mode: session.mode }), 'mistakes'));
  const title = t(run.kind === 'mistakes' ? 'res.mistakes' : session.mode === 'exam' ? 'res.exam' : 'res.practice');

  return screen({
    className: 'screen--results',
    bar: pagebar({
      title: t('topicN', { n: state.ctx.topic.number }),
      sub: h('span', enText(), state.ctx.topic.title),
      end: h('button', { type: 'button', class: 'pillbtn', onclick: leaveRun }, t('done')),
    }),
    body: [
      h('section', { class: 'card score', 'aria-labelledby': 'score-title' },
        scoreRing(s.percent),
        h('div', { class: 'score__copy' },
          h('h2', { class: 'score__title', id: 'score-title' }, title),
          h('p', { class: 'score__line' }, t('res.line', { c: s.correct, n: s.total })),
          h('p', { class: 'score__time' }, duration(run.finishedAt - run.startedAt)),
          newBest ? h('p', { class: 'score__best' }, icon(...ICONS.flame), t('res.best', { p: run.prevBest })) : null)),
      h('dl', { class: 'card stats' },
        h('div', { class: 'stats__item is-right' }, h('dt', {}, t('st.correct')), h('dd', {}, s.correct)),
        h('div', { class: 'stats__item is-wrong' }, h('dt', {}, t('st.wrong')), h('dd', {}, wrong)),
        h('div', { class: 'stats__item is-skip' }, h('dt', {}, t('st.skipped')), h('dd', {}, skipped))),
      h('section', { class: 'card answers', 'aria-labelledby': 'answers-title' },
        h('h2', { class: 'card__title', id: 'answers-title' }, t('res.answers')),
        h('ol', { class: 'qmap qmap--result' },
          s.results.map((r, i) =>
            h('li', {},
              h('button', {
                type: 'button',
                class: `qmap__cell ${r.correct ? 'is-right' : r.answered ? 'is-wrong' : 'is-skip'}`,
                'aria-label': t('res.cell', { i: i + 1, state: t(stateKey(r)) }),
                onclick: () => openReview(i + 1),
              }, String(i + 1)))))),
      Object.keys(s.byType).length > 1
        ? h('section', { class: 'card types', 'aria-labelledby': 'types-title' },
            h('h2', { class: 'card__title', id: 'types-title' }, t('res.byType')),
            h('ul', { class: 'types__list' },
              TYPES.filter((type) => s.byType[type]).map((type) => {
                const { correct, total } = s.byType[type];
                return h('li', {},
                  h('span', { class: 'types__name' }, typeLabel(type)),
                  h('span', { class: 'types__track' }, h('span', { style: `transform:scaleX(${correct / total})` })),
                  h('span', { class: 'types__value', dir: 'ltr' }, `${correct}/${total}`));
              })))
        : null,
    ],
    foot: h('footer', { class: 'bar bar--even' },
      h('button', { type: 'button', class: 'btn btn--secondary', onclick: () => openReview() }, t('res.reviewBtn')),
      missedIds.length
        ? h('button', { type: 'button', class: 'btn btn--primary', onclick: retry }, icon(...ICONS.retry), h('span', {}, t('res.retry')))
        : h('button', { type: 'button', class: 'btn btn--primary', onclick: leaveRun }, t('done'))),
  });
}

/* ---------- Review ---------- */

function openReview(focusNumber) {
  history.pushState({ screen: 'review' }, '');
  showReview(focusNumber);
}

function reviewEntry({ item, response, correct, answered }, n) {
  const q = item.question;
  const status = correct ? 'is-right' : answered ? 'is-wrong' : 'is-skip';
  const shown = (text) => (q.type === 'tf' ? h('dd', {}, text === 'True' ? t('true') : t('false')) : h('dd', enText(), text));
  const body =
    q.type === 'matching'
      ? h('ul', enText({ class: 'rpairs' }),
          q.pairs.map((p, i) => {
            const ok = matchingResults(q, response)[i];
            const chosen = Array.isArray(response) && response[i];
            return h('li', { class: ok ? 'is-right' : 'is-wrong' },
              h('span', { class: 'rpairs__left' }, p.left),
              h('span', { class: 'rpairs__right' },
                ok ? p.right : [chosen ? h('s', {}, chosen) : h('em', { lang: document.documentElement.lang }, t('rev.none')), ' ', h('strong', {}, p.right)]));
          }))
      : h('dl', { class: 'rans' },
          h('div', { class: correct ? 'is-right' : 'is-wrong' }, h('dt', {}, t('rev.yours')),
            answered ? shown(responseText(q, response)) : h('dd', {}, h('em', {}, t('rev.none')))),
          correct ? null : h('div', { class: 'is-right' }, h('dt', {}, t('rev.correct')), shown(correctAnswerText(q))));
  return h('li', { class: `card rcard ${status}`, id: `review-${n}`, tabindex: '-1' },
    h('p', { class: 'rcard__meta' },
      h('span', { class: 'rcard__num' }, String(n)),
      h('span', {}, typeLabel(q.type)),
      h('span', { class: 'rcard__state' }, answered ? icon(...(correct ? ICONS.check : ICONS.cross)) : null, t(correct ? 'st.correct' : answered ? 'st.wrong' : 'st.skipped'))),
    h('p', enText({ class: 'rcard__prompt' }), q.type === 'matching' ? q.title : promptContent(q.prompt)),
    body,
    notes(q));
}

function showReview(focusNumber) {
  state.screen = 'review';
  state.reviewFocus = focusNumber ?? null;
  const s = summarize(state.run.session);
  const missed = s.results.filter((r) => !r.correct).length;
  if (focusNumber && s.results[focusNumber - 1].correct) state.reviewFilter = 'all';
  if (!missed) state.reviewFilter = 'all';

  const filterOption = (value, label) =>
    h('label', { class: 'seg' },
      h('input', { type: 'radio', name: 'review-filter', value, checked: state.reviewFilter === value, onchange: () => { state.reviewFilter = value; showReview(); } }),
      h('span', {}, label));

  const view = screen({
    className: 'screen--review',
    bar: pagebar({
      start: iconButton(backIcon(), t('rev.back'), () => history.back()),
      title: t('review.title'),
      end: missed && missed < s.total
        ? h('div', { class: 'segs segs--compact', role: 'radiogroup', 'aria-label': t('rev.show') },
            filterOption('missed', t('rev.missed', { n: missed })),
            filterOption('all', t('rev.all', { n: s.total })))
        : null,
    }),
    body: h('ol', { class: 'review' },
      s.results.map((r, i) => (state.reviewFilter === 'all' || !r.correct ? reviewEntry(r, i + 1) : null))),
  });
  const target = focusNumber ? view.querySelector(`#review-${focusNumber}`) : null;
  mount(view, { focus: target ?? undefined, scrollTo: target });
}
