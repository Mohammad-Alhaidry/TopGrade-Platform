// Static pages: privacy policy (required for the Play Store listing), not found, load error.

import { h, icon, ICONS } from '../../quiz/dom.js';
import { pagebar, screen, mount, backLink, WHATSAPP_URL } from '../shell.js';
import { href } from '../router.js';
import { paths } from '../routes.js';
import { t, lang } from '../i18n.js';

const PRIVACY = {
  en: {
    title: 'Privacy policy',
    updated: 'Last updated 8 October 2026',
    sections: [
      ['Summary', 'TopGrade does not ask you to create an account and does not collect your name, email address or phone number. We keep anonymous usage statistics to improve the courses (see below).'],
      ['What stays on your device', 'Your quiz answers, scores, mistakes list, study streak, settings and any unfinished quiz are saved in your browser’s local storage on your own device. They are not sent to us. You can remove them at any time by clearing this site’s data in your browser or uninstalling the app.'],
      ['What our server sees', 'Like any website, our server receives standard technical information when you load a page, such as your IP address, browser type and the page requested. We use it only to keep the service running and secure, and we do not sell or share it.'],
      ['Anonymous usage statistics', 'To improve the courses, the app counts how it is used: pages opened, quizzes started and finished, scores, and which questions were answered right or wrong, plus your device type, country, interface language and theme. This runs on our own statistics server (Umami). It uses no cookies, does not record your name or contact details, does not store your IP address, and is never shared or sold.'],
      ['WhatsApp', 'If you contact us through WhatsApp, that conversation is handled by WhatsApp under its own privacy policy, and we see the details you choose to send us.'],
      ['Children', 'TopGrade is intended for university students and is not directed at children under 13.'],
      ['Changes', 'If this policy changes, the updated version will be posted on this page with a new date.'],
    ],
    contact: ['Contact', 'Questions about this policy: ', 'message TopGrade on WhatsApp', '.'],
  },
  ar: {
    title: 'سياسة الخصوصية',
    updated: 'آخر تحديث: 8 أكتوبر 2026',
    sections: [
      ['باختصار', 'لا يطلب منك TopGrade إنشاء حساب، ولا يجمع اسمك أو بريدك الإلكتروني أو رقم جوالك. نحتفظ بإحصائيات استخدام مجهولة الهوية لتحسين المقررات (التفاصيل أدناه).'],
      ['ما يبقى على جهازك', 'إجاباتك ودرجاتك وقائمة أخطائك وأيام مذاكرتك المتتالية وإعداداتك وأي اختبار لم تكمله، كلها تُحفظ في التخزين المحلي للمتصفح على جهازك أنت، ولا تُرسل إلينا. يمكنك حذفها في أي وقت بمسح بيانات هذا الموقع من المتصفح أو بحذف التطبيق.'],
      ['ما يصل إلى خادمنا', 'مثل أي موقع، يستقبل خادمنا معلومات تقنية عادية عند فتح أي صفحة، مثل عنوان IP ونوع المتصفح والصفحة المطلوبة. نستخدمها فقط لتشغيل الخدمة وحمايتها، ولا نبيعها ولا نشاركها.'],
      ['إحصائيات استخدام مجهولة الهوية', 'لتحسين المقررات، يحسب التطبيق طريقة استخدامه: الصفحات التي تُفتح، والاختبارات التي تبدأ وتنتهي، والدرجات، والأسئلة التي أُجيب عنها إجابة صحيحة أو خاطئة، إضافة إلى نوع الجهاز والدولة ولغة الواجهة والوضع. يعمل ذلك على خادم إحصائيات خاص بنا (Umami)، ولا يستخدم ملفات تعريف الارتباط، ولا يسجّل اسمك أو بيانات تواصلك، ولا يحفظ عنوان IP، ولا نشاركه أو نبيعه أبدًا.'],
      ['واتساب', 'إذا تواصلت معنا عبر واتساب، فالمحادثة تخضع لسياسة الخصوصية الخاصة بواتساب، ونطّلع فقط على ما تختار إرساله لنا.'],
      ['الأطفال', 'TopGrade موجّه لطلاب الجامعات، وليس موجّهًا للأطفال دون 13 سنة.'],
      ['التغييرات', 'إذا تغيّرت هذه السياسة، ننشر النسخة المحدّثة في هذه الصفحة مع تاريخ جديد.'],
    ],
    contact: ['التواصل', 'لأي سؤال عن هذه السياسة: ', 'راسل TopGrade عبر واتساب', '.'],
  },
};

export function showPrivacy() {
  const p = PRIVACY[lang()];
  const section = ([title, text]) => h('section', { class: 'prose__section' }, h('h2', {}, title), h('p', {}, text));
  const [cTitle, cText, cLink, cEnd] = p.contact;
  mount(screen({
    bar: pagebar({ start: backLink(paths.home(), t('priv.back')), title: p.title }),
    body: h('article', { class: 'card prose' },
      h('p', { class: 'prose__meta' }, p.updated),
      p.sections.map(section),
      h('section', { class: 'prose__section' },
        h('h2', {}, cTitle),
        h('p', {}, cText, h('a', { href: WHATSAPP_URL, target: '_blank', rel: 'noopener noreferrer' }, cLink), cEnd))),
  }));
}

export function showNotFound() {
  mount(screen({
    body: h('section', { class: 'card empty' },
      h('span', { class: 'empty__icon' }, icon(...ICONS.book)),
      h('h1', { tabindex: '-1', 'data-autofocus': true }, t('nf.title')),
      h('p', {}, t('nf.text')),
      h('a', { class: 'btn btn--primary', href: href(paths.courses()) }, t('browseCourses'))),
  }));
}

export function showLoadError(retry) {
  mount(screen({
    body: h('section', { class: 'card empty', role: 'alert' },
      h('span', { class: 'empty__icon' }, icon(...ICONS.cross)),
      h('h1', { tabindex: '-1', 'data-autofocus': true }, t('err.title')),
      h('p', {}, t('err.text')),
      h('button', { type: 'button', class: 'btn btn--primary', onclick: retry }, t('err.retry'))),
  }));
}
