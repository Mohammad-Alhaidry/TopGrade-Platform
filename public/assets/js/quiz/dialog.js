// Modal dialogs built on <dialog>, so focus trapping, Esc and the backdrop come from the browser.
import { h } from './dom.js';

function mount(dialog, onClose) {
  document.body.append(dialog);
  dialog.addEventListener('close', () => {
    onClose(dialog.returnValue);
    dialog.remove();
  });
  // A tap on the backdrop (outside the panel) dismisses.
  dialog.addEventListener('click', (e) => {
    if (e.target === dialog) dialog.close('');
  });
  dialog.showModal();
}

/**
 * Confirmation dialog. Resolves with the chosen action's value, or '' when dismissed.
 * actions: [{ label, value, primary?, danger? }]
 */
export function confirmDialog({ title, text, actions }) {
  return new Promise((resolve) => {
    const dialog = h('dialog', { class: 'dialog', 'aria-labelledby': 'dialog-title' },
      h('form', { method: 'dialog', class: 'dialog__panel' },
        h('h2', { class: 'dialog__title', id: 'dialog-title' }, title),
        text ? h('p', { class: 'dialog__text' }, text) : null,
        h('div', { class: 'dialog__actions' },
          actions.map((a) =>
            h('button', {
              class: `btn ${a.primary ? (a.danger ? 'btn--danger' : 'btn--primary') : 'btn--secondary'}`,
              value: a.value,
              autofocus: a.primary ? true : null,
            }, a.label))),
      ));
    mount(dialog, resolve);
  });
}

/** Bottom sheet with arbitrary content. build(close) returns the body nodes. */
export function openSheet({ title, build, closeLabel = 'Close' }) {
  let dialog;
  const close = (value = '') => dialog.close(value);
  dialog = h('dialog', { class: 'dialog dialog--sheet', 'aria-labelledby': 'sheet-title' },
    h('div', { class: 'dialog__panel' },
      h('div', { class: 'sheet__head' },
        h('h2', { class: 'dialog__title', id: 'sheet-title' }, title),
        h('button', { type: 'button', class: 'btn btn--quiet sheet__close', onclick: () => close() }, closeLabel)),
      build(close)));
  return new Promise((resolve) => mount(dialog, resolve));
}
