// Privacy policy text in both languages, laid out like the big apps' policies (intro, then the standard sections;
// a section is a paragraph or a list of [label, text] items). Pure data: shown by the app (views/pages.js) and written into the
// search-engine copy of /privacy by tools/build-pages.mjs.

export const PRIVACY = {
  en: {
    title: 'Privacy policy',
    updated: 'Last updated 11 October 2026',
    intro: 'This policy explains what information Smart Pro uses, why it uses it, and the choices you have.',
    sections: [
      ['Information we collect', [
        ['Learning data', 'your answers, scores and settings, saved on your device.'],
        ['Usage data', 'anonymous statistics on how the app is used, with device type and country.'],
        ['Notification data', 'your device’s notification code and the courses you follow, when you turn on notifications.'],
        ['Technical data', 'the standard details a browser sends to any website, such as browser type and IP address.'],
      ]],
      ['How we use information', 'To run the app and save your progress, improve the courses and questions, send notifications for the courses you follow, and keep the service secure.'],
      ['Sharing information', 'Your information is used within Smart Pro only, and notifications reach your device through its own notification service. Conversations with us on WhatsApp are covered by WhatsApp’s privacy policy.'],
      ['Keeping and deleting information', 'Learning data stays on your device until you clear the site’s data or remove the app. The notification code is deleted when you turn notifications off.'],
      ['Information security', 'All Smart Pro pages and services run over an encrypted connection.'],
      ['Audience', 'Smart Pro is made for university students.'],
      ['Changes to this policy', 'We may update this policy from time to time and will post the new version on this page with its date.'],
    ],
    contact: ['Contact us', 'For any question about this policy, use the Message us button on the ', 'home page', '.'],
  },
  ar: {
    title: 'سياسة الخصوصية',
    updated: 'آخر تحديث: 11 أكتوبر 2026',
    intro: 'توضح هذه السياسة المعلومات التي يستخدمها سمارت برو، وأسباب استخدامها، والخيارات المتاحة لك.',
    sections: [
      ['المعلومات التي نجمعها', [
        ['بيانات التعلّم', 'إجاباتك ودرجاتك وإعداداتك، وتُحفظ على جهازك.'],
        ['بيانات الاستخدام', 'إحصائيات مجهولة الهوية عن استخدام التطبيق، مع نوع الجهاز والدولة.'],
        ['بيانات الإشعارات', 'رمز الإشعارات لجهازك والمقررات التي تتابعها، عند تشغيل الإشعارات.'],
        ['البيانات التقنية', 'المعلومات المعتادة التي يرسلها المتصفح لأي موقع، مثل نوع المتصفح وعنوان IP.'],
      ]],
      ['كيف نستخدم المعلومات', 'لتشغيل التطبيق وحفظ تقدّمك، وتحسين المقررات والأسئلة، وإرسال إشعارات المقررات التي تتابعها، والحفاظ على أمان الخدمة.'],
      ['مشاركة المعلومات', 'تُستخدم معلوماتك داخل سمارت برو فقط، وتصل الإشعارات إلى جهازك عبر خدمة الإشعارات الخاصة به. وتخضع محادثاتك معنا عبر واتساب لسياسة خصوصية واتساب.'],
      ['الاحتفاظ بالمعلومات وحذفها', 'تبقى بيانات التعلّم على جهازك حتى تمسح بيانات الموقع أو تحذف التطبيق، ويُحذف رمز الإشعارات عند إيقافها.'],
      ['أمن المعلومات', 'تعمل جميع صفحات سمارت برو وخدماته عبر اتصال مشفّر.'],
      ['الفئة المستهدفة', 'سمارت برو مخصص لطلاب الجامعات.'],
      ['التعديلات على هذه السياسة', 'قد نحدّث هذه السياسة من وقت لآخر، وننشر النسخة المحدّثة في هذه الصفحة مع تاريخها.'],
    ],
    contact: ['اتصل بنا', 'لأي استفسار عن هذه السياسة، تواصل معنا عبر زر «راسلنا» في ', 'الصفحة الرئيسية', '.'],
  },
};
