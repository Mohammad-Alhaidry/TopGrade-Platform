// The "install the app" card: an Install button where the browser offers one (Android, desktop), the Add to Home
// Screen steps on iPhone/iPad. On the home page, and on a quiz result on Android (students who install it come
// back and practise more: usage statistics, October 2026).

import { h, icon, ICONS } from '../quiz/dom.js';
import { installOffer, promptInstall, dismissInstall } from './install.js';
import { iosSteps } from './install-steps.js';
import { t } from './i18n.js';

export function installCard() {
  const offer = installOffer();
  if (!offer) return null;
  const close = h('button', { type: 'button', class: 'install__close', 'aria-label': t('inst.notNow'), onclick: dismissInstall }, icon(...ICONS.close));
  const body = offer === 'prompt'
    ? h('p', { class: 'install__text' }, t('inst.text'))
    : iosSteps();
  // Android/desktop: one compact row with the Install button beside the text. iPhone needs room for the steps.
  const row = offer === 'prompt';
  return h('section', { class: `card install${row ? ' install--row' : ''}`, 'aria-labelledby': 'install-title' },
    h('img', { class: 'install__icon', src: 'assets/icons/icon-192.png', width: '192', height: '192', alt: '' }),
    h('div', { class: 'install__copy' },
      h('h2', { class: 'install__title', id: 'install-title' }, t(row ? 'inst.title' : 'inst.titleIos')),
      body),
    row ? h('button', { type: 'button', class: 'btn btn--primary btn--sm install__btn', onclick: promptInstall }, icon(...ICONS.download), h('span', {}, t('inst.btn'))) : null,
    close);
}

/** Only the one-tap Install offer (Android/desktop); null elsewhere. */
export const installPromptCard = () => (installOffer() === 'prompt' ? installCard() : null);
