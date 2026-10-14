// The notification controls: the bell in a course's top bar and the one-time invitation after a quiz.
// The logic (permission, subscription, server) is in notify.js.

import { h, icon, ICONS } from '../quiz/dom.js';
import { confirmDialog, openSheet } from '../quiz/dialog.js';
import { toast } from './shell.js';
import { t, localName } from './i18n.js';
import { iosSteps } from './install-steps.js';
import { follow, unfollow, isFollowing, seemsFollowing, shouldInvite, markInvited } from './notify.js';

/** Explains why following did not happen; true when it did. */
function explain(result) {
  if (result === 'on') return true;
  if (result === 'install') {
    // iPhone/iPad: Apple delivers notifications only to an app added to the Home Screen, never to a Safari tab.
    openSheet({
      title: t('push.installTitle'),
      closeLabel: t('close'),
      build: () => [
        h('p', { class: 'sheet__text' }, t('push.installText')),
        iosSteps({ className: 'install__steps push-steps', after: [[t('push.installStep3'), ICONS.bell]] }),
      ],
    });
  } else if (result === 'blocked') {
    openSheet({ title: t('push.blockedTitle'), closeLabel: t('close'), build: () => h('p', { class: 'sheet__text' }, t('push.blockedText')) });
  } else toast(t(result === 'denied' ? 'push.denied' : result === 'none' ? 'push.none' : 'push.error'));
  return false;
}

/** The bell for a course page's top bar: outline when off, ringing when on. */
export function courseBell(course) {
  const btn = h('button', { type: 'button', class: 'iconbtn bell', 'aria-pressed': 'false' });
  const paint = (on) => {
    btn.classList.toggle('is-on', on);
    btn.setAttribute('aria-pressed', String(on));
    btn.setAttribute('aria-label', t(on ? 'push.following' : 'push.follow'));
    btn.title = t(on ? 'push.following' : 'push.follow');
    btn.replaceChildren(icon(...ICONS.bell));
  };
  paint(seemsFollowing(course.id));
  isFollowing(course.id).then(paint).catch(() => {});
  btn.onclick = async () => {
    btn.disabled = true;
    try {
      if (btn.classList.contains('is-on')) {
        const choice = await confirmDialog({
          title: t('push.offTitle', { course: localName(course).main }),
          actions: [{ label: t('push.keep'), value: '' }, { label: t('push.offBtn'), value: 'off', primary: true }],
        });
        if (choice === 'off') {
          await unfollow(course.id);
          paint(false);
          toast(t('push.offDone'));
        }
      } else if (explain(await follow(course.id))) {
        paint(true);
        toast(t('push.onDone'));
      }
    } finally {
      btn.disabled = false;
    }
  };
  return btn;
}

/**
 * After a quiz: once per course, an invitation to follow it (empty until we know it should show).
 * `otherwise` builds what goes in its place when there is no invitation (the install offer).
 */
export function inviteCard(course, { otherwise = () => null } = {}) {
  const slot = h('div', { class: 'invite-slot' });
  shouldInvite(course.id).then((show) => {
    if (!show) {
      const other = otherwise();
      if (other) slot.append(other);
      return;
    }
    markInvited(course.id);
    const copy = h('div', { class: 'invite__copy' },
      h('h2', { class: 'invite__title' }, t('push.inviteTitle')),
      h('p', { class: 'invite__text' }, t('push.inviteText', { course: localName(course).main })));
    const actions = h('div', { class: 'invite__actions' });
    const card = h('section', { class: 'card invite' }, h('span', { class: 'invite__icon', 'aria-hidden': 'true' }, icon(...ICONS.bellOn)), copy, actions);
    const yes = h('button', { type: 'button', class: 'btn btn--primary' }, t('push.inviteYes'));
    const later = h('button', { type: 'button', class: 'btn btn--quiet' }, t('inst.notNow'));
    yes.onclick = async () => {
      yes.disabled = true;
      if (explain(await follow(course.id))) {
        actions.remove();
        copy.replaceChildren(h('p', { class: 'invite__done', role: 'status' }, t('push.inviteDone')));
      } else yes.disabled = false;
    };
    later.onclick = () => card.remove();
    actions.append(yes, later);
    slot.append(card);
  }).catch(() => {});
  return slot;
}
