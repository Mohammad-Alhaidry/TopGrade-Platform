// The "Add to Home Screen" steps for iPhone/iPad, written for the student's own browser (see iosBrowser in install.js).
// Used by the install card on the home page and by the notification bell, which needs the app on the Home Screen.

import { h, icon, ICONS } from '../quiz/dom.js';
import { t } from './i18n.js';
import { iosBrowser, currentPlatform } from './install.js';

const key = (paths, label) => h('span', { class: 'install__key', 'aria-label': label ?? null, 'aria-hidden': label ? null : 'true' }, icon(...paths));

/** One step: the text with its button picture in place of {icon}, and the names of buttons («…») in bold. */
function step(text, paths, label) {
  const parts = [];
  text.split('{icon}').forEach((chunk, i) => {
    if (i) parts.push(key(paths, label));
    chunk.split(/(«[^»]+»)/).forEach((bit) => {
      if (!bit) return;
      if (bit.startsWith('«')) parts.push(h('strong', {}, bit.slice(1, -1)));
      else parts.push(bit);
    });
  });
  return h('li', {}, parts);
}

/** The steps as a list, plus a WhatsApp hint where the in-app browser can hide «Add to Home Screen». */
export function iosSteps({ className = 'install__steps', after = [] } = {}) {
  const ipad = currentPlatform().ios && !/iPhone|iPod/.test(navigator.userAgent);
  const browser = iosBrowser(navigator.userAgent, { ipad });
  const add = step(t('inst.sAdd'), ICONS.addSquare);
  const steps = {
    safari26: [step(t('inst.s26Dots'), ICONS.dots, '⋯'), step(t('inst.s26Share'), ICONS.share), step(t('inst.s26Add'), ICONS.addSquare)],
    safari: [step(t('inst.sShareBottom'), ICONS.share, t('inst.share')), add],
    ipad: [step(t('inst.sShareTop'), ICONS.share, t('inst.share')), add],
    chrome: [step(t('inst.sShareChrome'), ICONS.share, t('inst.share')), add],
    other: [step(t('inst.sSafari'), ICONS.compass), step(t('inst.sShareBottom'), ICONS.share, t('inst.share')), add],
  }[browser];
  const list = h('ol', { class: className }, steps, after.map(([text, paths]) => step(text, paths)));
  // WhatsApp opens links in a Safari window without «Add to Home Screen»; its compass button opens real Safari.
  const hint = browser.startsWith('safari') ? h('p', { class: 'install__hint' }, [...step(t('inst.inApp'), ICONS.compass).childNodes]) : null;
  return [list, hint];
}
