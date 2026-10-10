// Privacy policy text in both languages. Pure data: shown by the app (views/pages.js) and written into the
// search-engine copy of /privacy by tools/build-pages.mjs.

export const PRIVACY = {
  en: {
    title: 'Privacy policy',
    updated: 'Last updated 10 October 2026',
    sections: [
      ['Summary', 'Smart Pro does not ask you to create an account and does not collect your name, email address or phone number. We keep anonymous usage statistics to improve the courses (see below).'],
      ['What stays on your device', 'Your quiz answers, scores, mistakes list, study streak, settings and any unfinished quiz are saved in your browser’s local storage on your own device. They are not sent to us. You can remove them at any time by clearing this site’s data in your browser or uninstalling the app.'],
      ['What our server sees', 'Like any website, our server receives standard technical information when you load a page, such as your IP address, browser type and the page requested. We use it only to keep the service running and secure, and we do not sell or share it.'],
      ['Anonymous usage statistics', 'To improve the courses, the app counts how it is used: pages opened, quizzes started and finished, scores, and which questions were answered right or wrong, plus your device type, country, interface language and theme. This runs on our own statistics server (Umami). It uses no cookies, does not record your name or contact details, does not store your IP address, and is never shared or sold.'],
      ['Notifications', 'Notifications are off unless you turn them on with the bell on a course page and allow them on your device. Then your browser gives us a push address (a random code that lets us send this device a message through Google, Apple or your browser’s push service), and we store it with the courses you follow and your interface language, nothing else. We use it only to tell you about new content in those courses. Turn a course off with its bell, or turn notifications off in your device settings, and we delete the address the next time we send.'],
      ['WhatsApp', 'If you contact us through WhatsApp, that conversation is handled by WhatsApp under its own privacy policy, and we see the details you choose to send us.'],
      ['Children', 'Smart Pro is intended for university students and is not directed at children under 13.'],
      ['Changes', 'If this policy changes, the updated version will be posted on this page with a new date.'],
    ],
    contact: ['Contact', 'Questions about this policy: use the Message us button on the ', 'home page', '.'],
  },
  ar: {
    title: 'سياسة الخصوصية',
    updated: 'آخر تحديث: 10 أكتوبر 2026',
    sections: [
      ['باختصار', 'لا يطلب منك سمارت برو إنشاء حساب، ولا يجمع اسمك أو بريدك الإلكتروني أو رقم جوالك. نحتفظ بإحصائيات استخدام مجهولة الهوية لتحسين المقررات (التفاصيل أدناه).'],
      ['ما يبقى على جهازك', 'إجاباتك ودرجاتك وقائمة أخطائك وأيام مذاكرتك المتتالية وإعداداتك وأي اختبار لم تكمله، كلها تُحفظ في التخزين المحلي للمتصفح على جهازك أنت، ولا تُرسل إلينا. يمكنك حذفها في أي وقت بمسح بيانات هذا الموقع من المتصفح أو بحذف التطبيق.'],
      ['ما يصل إلى خادمنا', 'مثل أي موقع، يستقبل خادمنا معلومات تقنية عادية عند فتح أي صفحة، مثل عنوان IP ونوع المتصفح والصفحة المطلوبة. نستخدمها فقط لتشغيل الخدمة وحمايتها، ولا نبيعها ولا نشاركها.'],
      ['إحصائيات استخدام مجهولة الهوية', 'لتحسين المقررات، يحسب التطبيق طريقة استخدامه: الصفحات التي تُفتح، والاختبارات التي تبدأ وتنتهي، والدرجات، والأسئلة التي أُجيب عنها إجابة صحيحة أو خاطئة، إضافة إلى نوع الجهاز والدولة ولغة الواجهة والوضع. يعمل ذلك على خادم إحصائيات خاص بنا (Umami)، ولا يستخدم ملفات تعريف الارتباط، ولا يسجّل اسمك أو بيانات تواصلك، ولا يحفظ عنوان IP، ولا نشاركه أو نبيعه أبدًا.'],
      ['التنبيهات', 'التنبيهات موقوفة ما لم تفعّلها بنفسك من الجرس في صفحة المقرر وتسمح بها على جهازك. عندها يعطينا متصفحك عنوان تنبيهات (رمز عشوائي يتيح لنا إرسال رسالة لهذا الجهاز عبر خدمة التنبيهات لدى Google أو Apple أو متصفحك)، ونحفظه مع المقررات التي تتابعها ولغة الواجهة فقط، دون أي شيء آخر. نستخدمه فقط لإخبارك بالجديد في تلك المقررات. يمكنك إيقاف تنبيهات أي مقرر من جرسه، أو إيقاف التنبيهات من إعدادات جهازك، وعندها نحذف العنوان عند أول إرسال لاحق.'],
      ['واتساب', 'إذا تواصلت معنا عبر واتساب، فالمحادثة تخضع لسياسة الخصوصية الخاصة بواتساب، ونطّلع فقط على ما تختار إرساله لنا.'],
      ['الأطفال', 'سمارت برو موجّه لطلاب الجامعات، وليس موجّهًا للأطفال دون 13 سنة.'],
      ['التغييرات', 'إذا تغيّرت هذه السياسة، ننشر النسخة المحدّثة في هذه الصفحة مع تاريخ جديد.'],
    ],
    contact: ['التواصل', 'لأي سؤال عن هذه السياسة: استخدم زر «راسلنا» في ', 'الصفحة الرئيسية', '.'],
  },
};
