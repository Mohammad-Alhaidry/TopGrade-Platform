// Interface language (English / Arabic). Question content stays in its own language (English).
// t('key', { n, ... }) looks up a string; values may be plural objects keyed by Intl.PluralRules
// categories (Arabic uses zero/one/two/few/many/other). {name} placeholders are filled from vars.

export const LANGS = ['en', 'ar'];
const STORAGE_KEY = 'topgrade.lang';
// First visit (no saved choice): Arabic. The head script in index.html sets lang/dir to match before first paint.
export const DEFAULT_LANG = 'ar';

const S = {
  // Shell
  'hdr.home': { en: 'Smart Pro home', ar: 'الرئيسية' },
  'hdr.lang': { en: 'العربية', ar: 'English' },
  'hdr.langShort': { en: 'ع', ar: 'EN' },
  'hdr.dark': { en: 'Switch to dark mode', ar: 'الوضع الليلي' },
  'hdr.light': { en: 'Switch to light mode', ar: 'الوضع النهاري' },
  'nav.main': { en: 'Main', ar: 'التنقل' },
  'tab.home': { en: 'Home', ar: 'الرئيسية' },
  'tab.courses': { en: 'Courses', ar: 'المقررات' },
  'tab.review': { en: 'Review', ar: 'المراجعة' },
  'tab.badge': { en: '{n} to review', ar: '{n} للمراجعة' },
  'back': { en: 'Back', ar: 'رجوع' },

  // Page titles and descriptions (browser tab, search results, link previews)
  'brand': { en: 'Smart Pro', ar: 'سمارت برو' },
  'meta.home': { en: 'Smart Pro | Free practice questions for King Khalid University courses', ar: 'سمارت برو | أسئلة تدريبية مجانية لمقررات جامعة الملك خالد' },
  'meta.homeDesc': {
    en: 'Free practice questions for King Khalid University courses: multiple choice, true or false and matching, with instant feedback and practice exams. No account needed.',
    ar: 'أسئلة تدريبية مجانية لمقررات جامعة الملك خالد: اختيار من متعدد وصح أو خطأ وتوصيل، مع تصحيح فوري واختبارات تجريبية. بدون تسجيل حساب.',
  },
  'meta.coursesDesc': { en: 'Every Smart Pro course with its topics and practice questions.', ar: 'كل مقررات سمارت برو مع مواضيعها وأسئلتها التدريبية.' },
  'meta.courseDesc': {
    en: 'Practice questions for {course}: {questions} in {topics}, with instant feedback and an exam mode.',
    ar: 'أسئلة تدريبية لمقرر {course}: {questions} في {topics}، مع تصحيح فوري ووضع اختبار.',
  },
  'meta.topicDesc': { en: 'Practise {topic} from {course}: {questions} ({types}).', ar: 'تدرّب على {topic} من مقرر {course}: {questions} ({types}).' },
  'meta.privacyDesc': {
    en: 'How Smart Pro handles your data: your progress is saved on your device and usage statistics are anonymous.',
    ar: 'كيف يتعامل سمارت برو مع بياناتك: تقدّمك محفوظ على جهازك، وإحصائيات الاستخدام مجهولة الهوية.',
  },

  // Counts
  'n.questions': {
    en: { one: '{n} question', other: '{n} questions' },
    ar: { zero: 'لا أسئلة', one: 'سؤال واحد', two: 'سؤالان', few: '{n} أسئلة', many: '{n} سؤالًا', other: '{n} سؤال' },
  },
  'n.topics': {
    en: { one: '{n} topic', other: '{n} topics' },
    ar: { zero: 'لا مواضيع', one: 'موضوع واحد', two: 'موضوعان', few: '{n} مواضيع', many: '{n} موضوعًا', other: '{n} موضوع' },
  },
  'n.courses': {
    en: { one: '{n} course', other: '{n} courses' },
    ar: { zero: 'لا مقررات', one: 'مقرر واحد', two: 'مقرران', few: '{n} مقررات', many: '{n} مقررًا', other: '{n} مقرر' },
  },
  'n.days': {
    en: { one: '{n} day', other: '{n} days' },
    ar: { zero: '0 أيام', one: 'يوم واحد', two: 'يومان', few: '{n} أيام', many: '{n} يومًا', other: '{n} يوم' },
  },
  'n.minutes': {
    en: { one: '{n} minute', other: '{n} minutes' },
    ar: { one: 'دقيقة واحدة', two: 'دقيقتان', few: '{n} دقائق', many: '{n} دقيقة', other: '{n} دقيقة' },
  },

  // Home
  'home.student': { en: 'Student', ar: 'طالب' },
  'home.welcome': { en: 'Welcome to Smart Pro', ar: 'أهلًا بك في سمارت برو' },
  'home.welcomeBack': { en: 'Welcome back', ar: 'أهلًا بعودتك' },
  'home.streak': { en: 'Study streak', ar: 'أيام متتالية' },
  'home.answered': { en: 'Questions answered', ar: 'أسئلة محلولة' },
  'home.practiceQuestions': { en: 'Practice questions', ar: 'سؤال للتدريب' },
  'home.coursesCount': { en: { one: 'Course', other: 'Courses' }, ar: { one: 'مقرر', two: 'مقرران', other: 'مقررات' } },
  'home.coursesBtn': { en: 'Courses', ar: 'المقررات' },
  'home.start': { en: 'Start practising', ar: 'ابدأ التدريب' },
  'home.startHint': { en: '{n} questions from {topic}, {course}', ar: '{n} أسئلة من {topic}، {course}' },
  'streak.title': { en: 'Your streak: {days}', ar: 'أيامك المتتالية: {days}' },
  'streak.text': { en: 'Practise today to keep it going', ar: 'تدرّب اليوم لتستمر' },
  'home.progress': { en: 'Your progress', ar: 'تقدّمك' },
  'kpi.accuracy': { en: 'Accuracy', ar: 'الدقة' },
  'kpi.mastered': { en: 'Mastered', ar: 'الإتقان' },
  'kpi.best': { en: 'Best score', ar: 'أفضل درجة' },
  'kpi.review': { en: 'To review', ar: 'للمراجعة' },
  'home.attention': { en: 'Needs your attention', ar: 'يحتاج انتباهك' },
  'home.wrongCount': {
    en: { one: '{n} question you got wrong', other: '{n} questions you got wrong' },
    ar: { one: 'سؤال واحد أخطأت فيه', two: 'سؤالان أخطأت فيهما', few: '{n} أسئلة أخطأت فيها', many: '{n} سؤالًا أخطأت فيه', other: '{n} سؤال أخطأت فيه' },
  },
  'practise': { en: 'Practise', ar: 'تدرّب' },
  'home.yourCourses': { en: 'Your courses', ar: 'مقرراتك' },
  'home.seeAll': { en: 'See all', ar: 'عرض الكل' },
  'home.help': { en: 'Want questions for your course?', ar: 'تبي أسئلة لمقررك؟' },
  'home.helpSub': { en: 'Send us the course name', ar: 'أرسل لنا اسم المقرر وبنسويها لك' },
  'home.helpBtn': { en: 'Message us', ar: 'راسلنا' },
  'home.privacy': { en: 'Privacy policy', ar: 'سياسة الخصوصية' },
  'home.saved': { en: 'Progress is saved on this device', ar: 'تقدّمك محفوظ على هذا الجهاز' },
  'cont.exam': { en: 'Resume your exam', ar: 'أكمل اختبارك' },
  'cont.practice': { en: 'Resume your practice', ar: 'أكمل تدريبك' },
  'cont.mistakes': { en: 'Resume your mistake review', ar: 'أكمل مراجعة أخطائك' },
  'cont.study': { en: 'Continue studying', ar: 'تابع المذاكرة' },
  'qOfN': { en: 'Question {i} of {n}', ar: 'السؤال {i} من {n}' },
  'masteredPct': { en: '{p}% mastered', ar: 'أتقنت {p}%' },
  'topicN': { en: 'Topic {n}', ar: 'الموضوع {n}' },
  'topicTitle': { en: 'Topic {n}: {title}', ar: 'الموضوع {n}: {title}' },

  // Install
  'inst.titleIos': { en: 'Get the Smart Pro app', ar: 'حمّل تطبيق سمارت برو' },
  'inst.title': { en: 'Install Smart Pro', ar: 'ثبّت تطبيق سمارت برو' },
  'inst.text': { en: 'Opens full screen and works offline', ar: 'يفتح بملء الشاشة ويعمل دون إنترنت' },
  'inst.share': { en: 'Share', ar: 'مشاركة' },
  'inst.s26Dots': { en: 'Tap {icon} next to the address bar', ar: 'اضغط {icon} بجانب شريط العنوان' },
  'inst.s26Share': { en: 'Choose «Share» {icon}', ar: 'اختر «مشاركة» {icon}' },
  'inst.s26Add': { en: 'Scroll down, choose «Add to Home Screen» {icon}, then «Add»', ar: 'انزل واختر «إضافة إلى الشاشة الرئيسية» {icon} ثم «إضافة»' },
  'inst.sShareBottom': { en: 'Tap «Share» {icon} in the bottom bar', ar: 'اضغط «مشاركة» {icon} في الشريط السفلي' },
  'inst.sShareTop': { en: 'Tap «Share» {icon} at the top of the screen', ar: 'اضغط «مشاركة» {icon} أعلى الشاشة' },
  'inst.sShareChrome': { en: 'Tap «Share» {icon} in the address bar', ar: 'اضغط «مشاركة» {icon} في شريط العنوان' },
  'inst.sAdd': { en: 'Choose «Add to Home Screen» {icon}, then «Add»', ar: 'اختر «إضافة إلى الشاشة الرئيسية» {icon} ثم «إضافة»' },
  'inst.sSafari': { en: 'Open this page in «Safari»', ar: 'افتح هذه الصفحة في «سفاري»' },
  'inst.inApp': { en: 'Opened from WhatsApp? Tap {icon} to open in Safari.', ar: 'فتحته من واتساب؟ اضغط {icon} لفتحه في سفاري.' },
  'inst.btn': { en: 'Install', ar: 'تثبيت' },
  'inst.notNow': { en: 'Not now', ar: 'ليس الآن' },

  // Notifications
  'push.follow': { en: 'Turn on notifications', ar: 'تشغيل الإشعارات' },
  'push.following': { en: 'Notifications on', ar: 'الإشعارات مفعّلة' },
  'push.onDone': { en: 'Notifications turned on', ar: 'تم تشغيل الإشعارات' },
  'push.offTitle': { en: 'Turn off {course} notifications?', ar: 'إيقاف إشعارات {course}؟' },
  'push.offBtn': { en: 'Turn off', ar: 'إيقاف' },
  'push.keep': { en: 'Cancel', ar: 'إلغاء' },
  'push.offDone': { en: 'Notifications turned off', ar: 'تم إيقاف الإشعارات' },
  'push.installTitle': { en: 'Turn on notifications', ar: 'تشغيل الإشعارات' },
  'push.installText': { en: 'Add Smart Pro to your Home Screen:', ar: 'أضف سمارت برو إلى الشاشة الرئيسية:' },
  'push.installStep3': { en: 'Open it from the Home Screen and tap {icon}', ar: 'افتحه من الشاشة الرئيسية واضغط {icon}' },
  'push.blockedTitle': { en: 'Notifications are off', ar: 'الإشعارات متوقفة' },
  'push.blockedText': { en: 'Turn on notifications for Smart Pro in your device settings, then tap the bell again.', ar: 'شغّل إشعارات سمارت برو من إعدادات الجهاز، ثم اضغط الجرس مرة أخرى.' },
  'push.denied': { en: 'Notifications not allowed', ar: 'لم يتم السماح بالإشعارات' },
  'push.none': { en: 'Notifications aren’t supported in this browser', ar: 'الإشعارات غير مدعومة في هذا المتصفح' },
  'push.error': { en: 'Couldn’t turn on notifications. Try again.', ar: 'تعذّر تشغيل الإشعارات. حاول مرة أخرى.' },
  'push.inviteTitle': { en: 'Don’t miss new questions', ar: 'لا تفوّت الأسئلة الجديدة' },
  'push.inviteText': { en: 'Get notified when we add questions to {course}.', ar: 'يصلك إشعار عند إضافة أسئلة جديدة في {course}.' },
  'push.inviteYes': { en: 'Turn on notifications', ar: 'تشغيل الإشعارات' },
  'push.inviteDone': { en: 'Notifications turned on', ar: 'تم تشغيل الإشعارات' },

  // Courses / course
  'courses.title': { en: 'Courses', ar: 'المقررات' },
  'progressOf': { en: '{name} progress', ar: 'التقدّم في {name}' },
  'course.back': { en: 'Back to courses', ar: 'العودة للمقررات' },
  'course.topics': { en: 'Topics', ar: 'المواضيع' },
  'course.questions': { en: 'Questions', ar: 'الأسئلة' },
  'course.mastered': { en: 'Mastered', ar: 'الإتقان' },
  'bestPct': { en: 'Best {p}%', ar: 'الأفضل {p}%' },
  'n.mistakes': {
    en: { one: '{n} mistake', other: '{n} mistakes' },
    ar: { one: 'خطأ واحد', two: 'خطآن', few: '{n} أخطاء', many: '{n} خطأً', other: '{n} خطأ' },
  },

  // Review tab
  'review.title': { en: 'Review', ar: 'المراجعة' },
  'review.lead': { en: 'Questions you got wrong stay here until you answer them right twice in a row.', ar: 'تبقى هنا الأسئلة التي أخطأت فيها حتى تجيب عنها إجابة صحيحة مرتين متتاليتين.' },
  'review.empty': { en: 'No mistakes to review', ar: 'لا توجد أخطاء للمراجعة' },
  'review.emptyText': { en: 'Questions you get wrong will appear here, so you can practise them until they stick.', ar: 'ستظهر هنا الأسئلة التي تخطئ فيها، لتتدرّب عليها حتى تتقنها.' },
  'browseCourses': { en: 'Browse courses', ar: 'تصفّح المقررات' },

  // Quiz setup
  'setup.mode': { en: 'Mode', ar: 'النمط' },
  'mode.practice': { en: 'Practice', ar: 'تدريب' },
  'mode.practiceText': { en: 'Instant feedback', ar: 'تصحيح فوري' },
  'mode.exam': { en: 'Exam', ar: 'اختبار' },
  'mode.examText': { en: 'Score at the end', ar: 'النتيجة في النهاية' },
  'mode.mistakes': { en: 'Mistakes', ar: 'الأخطاء' },
  'setup.types': { en: 'Question types', ar: 'أنواع الأسئلة' },
  'setup.count': { en: 'Number of questions', ar: 'عدد الأسئلة' },
  'setup.all': { en: 'All {n}', ar: 'الكل {n}' },
  'setup.start': {
    en: { one: 'Start {n} question', other: 'Start {n} questions' },
    ar: { one: 'ابدأ سؤالًا واحدًا', two: 'ابدأ سؤالين', few: 'ابدأ {n} أسئلة', many: 'ابدأ {n} سؤالًا', other: 'ابدأ {n} سؤال' },
  },
  'setup.chooseType': { en: 'Choose a question type', ar: 'اختر نوع أسئلة' },
  'type.mcq': { en: 'MCQ', ar: 'اختيار من متعدد' },
  'type.tf': { en: 'True / False', ar: 'صح أو خطأ' },
  'type.fib': { en: 'Fill in the Blank', ar: 'أكمل الفراغ' },
  'type.matching': { en: 'Matching', ar: 'توصيل' },
  'hint.mcq': { en: 'Choose one answer', ar: 'اختر إجابة واحدة' },
  'hint.tf': { en: 'Is the statement correct?', ar: 'هل العبارة صحيحة؟' },
  'hint.fib': { en: 'Choose the missing word', ar: 'اختر الكلمة الناقصة' },
  'hint.matching': { en: 'Match each item with its description', ar: 'صِل كل عنصر بوصفه' },
  'resume.label': { en: 'Unfinished quiz', ar: 'اختبار لم يكتمل' },
  'resume.exam': { en: 'Unfinished exam', ar: 'اختبار لم يكتمل' },
  'resume.practice': { en: 'Unfinished practice', ar: 'تدريب لم يكتمل' },
  'resume.mistakes': { en: 'Unfinished mistake review', ar: 'مراجعة أخطاء لم تكتمل' },
  'resume.text': { en: 'Question {i} of {n}, {a} answered', ar: 'السؤال {i} من {n}، أجبت عن {a}' },
  'resume.discard': { en: 'Discard', ar: 'تجاهل' },
  'resume.resume': { en: 'Resume', ar: 'أكمل' },
  'mist.title': {
    en: { one: '{n} mistake to review', other: '{n} mistakes to review' },
    ar: { one: 'خطأ واحد للمراجعة', two: 'خطآن للمراجعة', few: '{n} أخطاء للمراجعة', many: '{n} خطأً للمراجعة', other: '{n} خطأ للمراجعة' },
  },
  'mist.text': { en: 'Right twice in a row clears one', ar: 'يُزال الخطأ بعد إجابتين صحيحتين متتاليتين' },
  'backTo': { en: 'Back to {name}', ar: 'العودة إلى {name}' },

  // Quiz run
  'quiz.leave': { en: 'Leave quiz', ar: 'الخروج من الاختبار' },
  'leave.title': { en: 'Leave this quiz?', ar: 'هل تريد الخروج من الاختبار؟' },
  'leave.text': { en: 'Your progress is saved on this device. You can resume it from the topic page.', ar: 'تقدّمك محفوظ على هذا الجهاز، ويمكنك المتابعة من صفحة الموضوع.' },
  'leave.stay': { en: 'Keep going', ar: 'أكمل' },
  'leave.go': { en: 'Leave', ar: 'خروج' },
  'q.question': { en: 'Question', ar: 'السؤال' },
  'q.of': { en: 'of {n}', ar: 'من {n}' },
  'q.map': { en: 'Question map, {a} of {n} answered', ar: 'خريطة الأسئلة، أجبت عن {a} من {n}' },
  'q.soFar': { en: '{n} correct so far', ar: '{n} صحيحة حتى الآن' },
  'q.options': { en: 'Answer options', ar: 'خيارات الإجابة' },
  'q.tfGroup': { en: 'True or false', ar: 'صح أو خطأ' },
  'q.words': { en: 'Word choices', ar: 'الكلمات' },
  'true': { en: 'True', ar: 'صح' },
  'false': { en: 'False', ar: 'خطأ' },
  'q.check': { en: 'Check', ar: 'تحقّق' },
  'q.next': { en: 'Next', ar: 'التالي' },
  'q.reviewSubmit': { en: 'Review and submit', ar: 'مراجعة وتسليم' },
  'q.prev': { en: 'Previous question', ar: 'السؤال السابق' },
  'q.blank': { en: 'blank', ar: 'فراغ' },
  'match.choose': { en: 'Choose…', ar: 'اختر…' },
  'match.clear': { en: 'Clear this choice', ar: 'إلغاء هذا الاختيار' },
  'answerLabel': { en: 'Answer:', ar: 'الإجابة:' },
  'v.correct': { en: 'Correct', ar: 'إجابة صحيحة' },
  'v.wrong': { en: 'Not quite', ar: 'إجابة غير صحيحة' },
  'v.matched': { en: '{r} of {n} matched. Corrections are shown above.', ar: '{r} من {n} صحيحة. التصحيح موضّح بالأعلى.' },
  'continue': { en: 'Continue', ar: 'متابعة' },
  'seeResults': { en: 'See results', ar: 'عرض النتيجة' },
  'map.title': { en: 'Questions', ar: 'الأسئلة' },
  'map.answered': { en: '{n} answered', ar: 'أجبت عن {n}' },
  'map.unanswered': { en: '{n} not answered', ar: '{n} بلا إجابة' },
  'map.cell': { en: 'Question {i}, {state}', ar: 'السؤال {i}، {state}' },
  'state.answered': { en: 'answered', ar: 'تمت الإجابة' },
  'state.unanswered': { en: 'not answered', ar: 'بلا إجابة' },
  'submit': { en: 'Submit exam', ar: 'تسليم الاختبار' },
  'close': { en: 'Close', ar: 'إغلاق' },
  'submit.title': {
    en: { one: 'Submit with {n} unanswered question?', other: 'Submit with {n} unanswered questions?' },
    ar: { one: 'هل تريد التسليم مع وجود سؤال بلا إجابة؟', two: 'هل تريد التسليم مع وجود سؤالين بلا إجابة؟', few: 'هل تريد التسليم مع وجود {n} أسئلة بلا إجابة؟', many: 'هل تريد التسليم مع وجود {n} سؤالًا بلا إجابة؟', other: 'هل تريد التسليم مع وجود {n} سؤال بلا إجابة؟' },
  },
  'submit.text': { en: 'Unanswered questions count as wrong.', ar: 'تُحتسب الأسئلة التي بلا إجابة خاطئة.' },
  'submit.stay': { en: 'Keep answering', ar: 'أكمل الإجابة' },
  'submit.go': { en: 'Submit', ar: 'تسليم' },
  'pageN': { en: 'Page {p}', ar: 'صفحة {p}' },

  // Results
  'res.mistakes': { en: 'Mistake review', ar: 'مراجعة الأخطاء' },
  'res.exam': { en: 'Exam result', ar: 'نتيجة الاختبار' },
  'res.practice': { en: 'Practice result', ar: 'نتيجة التدريب' },
  'res.line': { en: '{c} of {n} correct', ar: '{c} من {n} إجابات صحيحة' },
  'res.underMinute': { en: 'Under a minute', ar: 'أقل من دقيقة' },
  'res.hours': { en: '{h} h {m} min', ar: '{h} س {m} د' },
  'res.best': { en: 'New best, up from {p}%', ar: 'رقم قياسي جديد، كان {p}%' },
  'st.correct': { en: 'Correct', ar: 'صحيحة' },
  'st.wrong': { en: 'Wrong', ar: 'خاطئة' },
  'st.skipped': { en: 'Skipped', ar: 'متروكة' },
  'res.answers': { en: 'Answers', ar: 'الإجابات' },
  'res.cell': { en: 'Question {i}, {state}. Show in review', ar: 'السؤال {i}، {state}. اعرضه في المراجعة' },
  'state.correct': { en: 'correct', ar: 'صحيحة' },
  'state.wrong': { en: 'wrong', ar: 'خاطئة' },
  'state.skipped': { en: 'skipped', ar: 'متروكة' },
  'res.byType': { en: 'By question type', ar: 'حسب نوع السؤال' },
  'res.reviewBtn': { en: 'Review answers', ar: 'مراجعة الإجابات' },
  'res.share': { en: 'Share your score', ar: 'شارك نتيجتك' },
  'res.shareText': { en: 'I got {c} out of {n} in {topic} on Smart Pro. Try the questions:', ar: 'حصلت على {c} من {n} في {topic} على سمارت برو. جرّب الأسئلة:' },
  'res.retry': { en: 'Retry missed', ar: 'أعد الأخطاء' },
  'done': { en: 'Done', ar: 'تم' },
  'rev.back': { en: 'Back to results', ar: 'العودة للنتيجة' },
  'rev.missed': { en: 'Missed {n}', ar: 'الأخطاء {n}' },
  'rev.all': { en: 'All {n}', ar: 'الكل {n}' },
  'rev.show': { en: 'Show', ar: 'عرض' },
  'rev.yours': { en: 'Your answer', ar: 'إجابتك' },
  'rev.correct': { en: 'Correct answer', ar: 'الإجابة الصحيحة' },
  'rev.none': { en: 'No answer', ar: 'بلا إجابة' },

  // Pages
  'nf.title': { en: 'Page not found', ar: 'الصفحة غير موجودة' },
  'nf.text': { en: 'This link doesn’t match any course or topic. It may have moved.', ar: 'هذا الرابط لا يطابق أي مقرر أو موضوع، وربما تغيّر مكانه.' },
  'err.title': { en: 'Courses didn’t load', ar: 'تعذّر تحميل المقررات' },
  'err.text': { en: 'Check your internet connection, then try again.', ar: 'تحقّق من اتصالك بالإنترنت ثم أعد المحاولة.' },
  'err.retry': { en: 'Try again', ar: 'أعد المحاولة' },
  'priv.back': { en: 'Back to home', ar: 'العودة للرئيسية' },
};

function initialLang() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (LANGS.includes(saved)) return saved;
  } catch {
    /* storage unavailable */
  }
  return DEFAULT_LANG;
}

let current = typeof localStorage === 'undefined' ? DEFAULT_LANG : initialLang();
const listeners = new Set();

export const lang = () => current;
export const isRTL = () => current === 'ar';

/** Looks up a string. Unknown keys return the key itself so a missing string is visible, not blank. */
export function t(key, vars = {}, language = current) {
  const entry = S[key]?.[language] ?? S[key]?.en;
  if (entry === undefined) return key;
  let text = entry;
  if (typeof entry === 'object') {
    const cat = new Intl.PluralRules(language).select(vars.n ?? 0);
    text = entry[cat] ?? entry.other;
  }
  return text.replace(/\{(\w+)\}/g, (m, k) => (vars[k] !== undefined ? String(vars[k]) : m));
}

/** Course/topic names: Arabic first in the Arabic interface when the catalog has an Arabic name. */
export function localName(item) {
  const en = item.titleEn ?? item.title;
  const ar = item.titleAr;
  return current === 'ar' && ar ? { main: ar, sub: en, mainLang: 'ar', subLang: 'en' } : { main: en, sub: ar ?? null, mainLang: 'en', subLang: 'ar' };
}

export function applyLang() {
  const root = document.documentElement;
  root.lang = current;
  root.dir = current === 'ar' ? 'rtl' : 'ltr';
}

export function setLang(next) {
  if (!LANGS.includes(next) || next === current) return;
  current = next;
  try {
    localStorage.setItem(STORAGE_KEY, next);
  } catch {
    /* storage unavailable: the choice lasts until the page closes */
  }
  applyLang();
  listeners.forEach((fn) => fn(next));
}

export function onLangChange(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

/** For tests: every key, so both languages can be checked for completeness. */
export const STRINGS = S;
