/* ── JoPass i18n ── */
const TRANSLATIONS = {
  en: {
    /* Nav */
    'nav.browse': 'Browse', 'nav.bookings': 'Bookings',
    'nav.credits': 'Credits', 'nav.profile': 'Profile',
    /* Browse */
    'browse.title': 'Discover Deals', 'browse.balance': 'Your Balance',
    'browse.buy': '+ Buy Credits', 'browse.search': 'Search venues…',
    'browse.noResults': 'No venues found for',
    /* Vendor */
    'vendor.deals': 'Deals', 'vendor.standard': 'Standard Booking',
    'vendor.everyday': 'Every Day', 'vendor.bookNow': 'Book Now',
    'vendor.full': 'Full', 'vendor.passed': 'Passed',
    'vendor.follow': '🤍 Follow', 'vendor.following': '❤️ Following',
    'vendor.amenities': 'AMENITIES', 'vendor.location': 'LOCATION',
    'vendor.openMaps': 'Open in Google Maps ↗',
    'vendor.reviews': 'Reviews', 'vendor.verified': 'Verified',
    'vendor.save': 'Save', 'vendor.left': 'left',
    'vendor.buyMore': 'buy more', 'vendor.notEnough': 'Not enough credits —',
    'vendor.back': '← Back',
    /* Bookings page */
    'bookings.title': 'My Bookings',
    'bookings.empty': 'No Bookings Yet',
    'bookings.emptyDesc': 'Browse deals and book your first experience!',
    'bookings.browseDeals': 'Browse Deals',
    'bookings.noFound': 'No Bookings Found',
    'bookings.noFoundDesc': 'No bookings match the selected filter.',
    'bookings.confirmed': 'Confirmed', 'bookings.completed': 'Completed',
    'bookings.cancelled': 'Cancelled', 'bookings.reviewed': 'Reviewed',
    'bookings.review': 'Review', 'bookings.cancel': 'Cancel',
    'bookings.cancelNR': 'Cancel (no refund)', 'bookings.remove': 'Remove',
    'bookings.all': 'All', 'bookings.today': 'Today',
    'bookings.week': 'This Week', 'bookings.month': 'This Month',
    /* Credits */
    'credits.title': 'Buy Credits', 'credits.balance': 'Current Balance',
    'credits.credits': 'Credits', 'credits.packs': 'Credit Packs',
    'credits.howWorks': 'How It Works',
    'credits.step1': '1. Buy Credits', 'credits.step1Desc': 'Choose a pack that fits your needs.',
    'credits.step2': '2. Browse Deals', 'credits.step2Desc': 'Discover discounted services nearby.',
    'credits.step3': '3. Book & Save', 'credits.step3Desc': 'Use credits to book at up to 50% off.',
    'credits.step4': '4. Enjoy!', 'credits.step4Desc': 'Show up and enjoy the experience.',
    /* Profile */
    'profile.title': 'Profile', 'profile.editTitle': 'Edit Profile',
    'profile.creditBalance': 'Credit Balance',
    'profile.referTitle': 'REFER A FRIEND',
    'profile.referDesc': 'Share your code — earn <strong>2 credits</strong> every time a friend makes their first credit purchase.',
    'profile.editProfile': 'Edit Profile', 'profile.myBookings': 'My Bookings',
    'profile.buyCredits': 'Buy Credits', 'profile.notifications': 'Notifications',
    'profile.settings': 'Settings', 'profile.help': 'Help & Support',
    'profile.privacy': 'Privacy Policy', 'profile.terms': 'Terms & Conditions',
    'profile.logout': 'Log Out', 'profile.language': 'Language',
    'profile.share': 'Share',
    /* Edit Profile */
    'editProfile.name': 'Full Name', 'editProfile.phone': 'Phone Number',
    'editProfile.save': 'Save Changes', 'editProfile.saving': 'Saving…',
    /* Settings */
    'settings.title': 'Settings',
    /* Confirm dialog */
    'dialog.cancel': 'Cancel',
    'dialog.confirmBooking': 'Confirm Booking',
    'dialog.cancelBooking': 'Cancel Booking?',
    'dialog.removeBooking': 'Remove Booking?',
    'dialog.removeDesc': 'Remove this completed booking from your history?',
    /* Booking dialog */
    'booking.selectDate': 'Select Date & Time',
    'booking.notEnough': 'Not Enough Credits',
    /* Misc */
    'at': 'at', 'credits': 'credits', 'back': '← Back',
    'save': 'Save', 'cancel': 'Cancel', 'confirm': 'Confirm',
    /* Owner */
    'owner.deals': 'Deals', 'owner.standard': 'Standard Booking',
    'owner.addDeal': 'Add Deal', 'owner.addStandard': '+ Add Standard Booking',
    'owner.addStandardTitle': 'Add Standard Booking',
    'owner.addStandardBtn': 'Add Standard Booking',
    'owner.noDeals': 'No Deals Yet', 'owner.noStandard': 'No Standard Booking Yet',
    'owner.received': 'Received', 'owner.profile': 'Business Profile',
    'owner.bookings': 'Bookings', 'owner.editService': 'Edit Service',
    'owner.manageSlots': 'Manage Slots', 'owner.publish': 'Publish Opening',
    'owner.slotsOpen': 'open', 'owner.slotsPassed': 'Slots passed',
    'owner.full': 'Full', 'owner.everyday': 'Everyday Offer',
    'owner.everydayDesc': 'Available every day at selected times',
    'owner.saveProfile': 'Save Profile', 'owner.saving': 'Saving…',
    'owner.serviceName': 'Service Name', 'owner.duration': 'Duration',
    'owner.regularPrice': 'Regular Price (JOD)', 'owner.jopassPrice': 'JoPass Price (JOD)',
    'owner.autoClose': 'Auto-close slot after booking',
    'owner.autoCloseDesc': '(1 reservation per slot)',
    'owner.availableSlots': 'Available Time Slots',
    'owner.slotsDesc': 'Tap a slot to close it. Green = open, grey = closed.',
    'owner.saveChanges': 'Save Changes',
    'owner.newBooking': 'New Booking Received!',
    'owner.viewBooking': 'View Booking',
    'owner.markViewed': 'Mark as Viewed',
    'owner.confirmMark': 'Please confirm the booking on your side',
    'owner.filterAll': 'All', 'owner.filterToday': 'Today',
    'owner.filterWeek': 'This Week', 'owner.filterMonth': 'This Month',
    /* Login */
    'login.title': 'Book amazing experiences for less.',
    'login.email': 'Email', 'login.password': 'Password',
    'login.forgot': 'Forgot password?', 'login.signin': 'Log In',
    'login.signing': 'Signing in…', 'login.noAccount': "Don't have an account?",
    'login.signup': 'Sign up', 'login.venue': 'Are you a venue?',
    'login.venueLink': 'Sign in here',
    'login.resetTitle': 'Reset your password',
    'login.resetEmail': 'Email address', 'login.sendReset': 'Send Reset Link',
    'login.sending': 'Sending…', 'login.sent': 'Sent!',
    'login.resetSent': 'Check your email and tap the reset link to open the app.',
    /* Signup */
    'signup.title': 'Create your account and start saving.',
    'signup.name': 'Full Name', 'signup.email': 'Email',
    'signup.phone': 'Phone Number', 'signup.password': 'Password',
    'signup.confirm': 'Confirm Password', 'signup.create': 'Create Account',
    'signup.creating': 'Creating account…', 'signup.hasAccount': 'Already have an account?',
    'signup.login': 'Log in',
  },
  ar: {
    /* Nav */
    'nav.browse': 'تصفح', 'nav.bookings': 'حجوزاتي',
    'nav.credits': 'الرصيد', 'nav.profile': 'حسابي',
    /* Browse */
    'browse.title': 'اكتشف العروض', 'browse.balance': 'رصيدك',
    'browse.buy': '+ شراء رصيد', 'browse.search': 'ابحث عن أماكن…',
    'browse.noResults': 'لا توجد أماكن لـ',
    /* Vendor */
    'vendor.deals': 'العروض', 'vendor.standard': 'حجز عادي',
    'vendor.everyday': 'كل يوم', 'vendor.bookNow': 'احجز الآن',
    'vendor.full': 'ممتلئ', 'vendor.passed': 'انتهى',
    'vendor.follow': '🤍 متابعة', 'vendor.following': '❤️ تتابع',
    'vendor.amenities': 'المرافق', 'vendor.location': 'الموقع',
    'vendor.openMaps': 'فتح في خرائط جوجل ↙',
    'vendor.reviews': 'التقييمات', 'vendor.verified': 'موثق',
    'vendor.save': 'وفر', 'vendor.left': 'متبقي',
    'vendor.buyMore': 'اشترِ المزيد', 'vendor.notEnough': 'رصيد غير كافٍ —',
    'vendor.back': 'رجوع →',
    /* Bookings page */
    'bookings.title': 'حجوزاتي',
    'bookings.empty': 'لا توجد حجوزات بعد',
    'bookings.emptyDesc': 'تصفح العروض واحجز تجربتك الأولى!',
    'bookings.browseDeals': 'تصفح العروض',
    'bookings.noFound': 'لا توجد حجوزات',
    'bookings.noFoundDesc': 'لا توجد حجوزات تطابق الفلتر.',
    'bookings.confirmed': 'مؤكد', 'bookings.completed': 'مكتمل',
    'bookings.cancelled': 'ملغى', 'bookings.reviewed': 'تم التقييم',
    'bookings.review': 'تقييم', 'bookings.cancel': 'إلغاء',
    'bookings.cancelNR': 'إلغاء (بدون استرداد)', 'bookings.remove': 'حذف',
    'bookings.all': 'الكل', 'bookings.today': 'اليوم',
    'bookings.week': 'هذا الأسبوع', 'bookings.month': 'هذا الشهر',
    /* Credits */
    'credits.title': 'شراء رصيد', 'credits.balance': 'الرصيد الحالي',
    'credits.credits': 'رصيد', 'credits.packs': 'باقات الرصيد',
    'credits.howWorks': 'كيف يعمل',
    'credits.step1': '١. شراء رصيد', 'credits.step1Desc': 'اختر الباقة المناسبة لك.',
    'credits.step2': '٢. تصفح العروض', 'credits.step2Desc': 'اكتشف خدمات مخفضة بالقرب منك.',
    'credits.step3': '٣. احجز ووفّر', 'credits.step3Desc': 'استخدم رصيدك للحجز بخصم يصل إلى ٥٠٪.',
    'credits.step4': '٤. استمتع!', 'credits.step4Desc': 'احضر واستمتع بتجربتك.',
    /* Profile */
    'profile.title': 'حسابي', 'profile.editTitle': 'تعديل الملف',
    'profile.creditBalance': 'رصيد الكريدت',
    'profile.referTitle': 'دعوة صديق',
    'profile.referDesc': 'شارك كودك — اكسب <strong>٢ رصيد</strong> في كل مرة يشتري فيها صديق رصيده الأول.',
    'profile.editProfile': 'تعديل الملف', 'profile.myBookings': 'حجوزاتي',
    'profile.buyCredits': 'شراء رصيد', 'profile.notifications': 'الإشعارات',
    'profile.settings': 'الإعدادات', 'profile.help': 'المساعدة والدعم',
    'profile.privacy': 'سياسة الخصوصية', 'profile.terms': 'الشروط والأحكام',
    'profile.logout': 'تسجيل الخروج', 'profile.language': 'اللغة',
    'profile.share': 'مشاركة',
    /* Edit Profile */
    'editProfile.name': 'الاسم الكامل', 'editProfile.phone': 'رقم الهاتف',
    'editProfile.save': 'حفظ التغييرات', 'editProfile.saving': 'جارٍ الحفظ…',
    /* Settings */
    'settings.title': 'الإعدادات',
    /* Confirm dialog */
    'dialog.cancel': 'إلغاء',
    'dialog.confirmBooking': 'تأكيد الحجز',
    'dialog.cancelBooking': 'إلغاء الحجز؟',
    'dialog.removeBooking': 'حذف الحجز؟',
    'dialog.removeDesc': 'حذف هذا الحجز المكتمل من سجلك؟',
    /* Booking dialog */
    'booking.selectDate': 'اختر التاريخ والوقت',
    'booking.notEnough': 'رصيد غير كافٍ',
    /* Misc */
    'at': 'في', 'credits': 'رصيد', 'back': 'رجوع →',
    'save': 'حفظ', 'cancel': 'إلغاء', 'confirm': 'تأكيد',
    /* Owner */
    'owner.deals': 'العروض', 'owner.standard': 'حجز عادي',
    'owner.addDeal': 'إضافة عرض', 'owner.addStandard': '+ إضافة حجز عادي',
    'owner.addStandardTitle': 'إضافة حجز عادي',
    'owner.addStandardBtn': 'إضافة حجز عادي',
    'owner.noDeals': 'لا توجد عروض بعد', 'owner.noStandard': 'لا توجد حجوزات عادية بعد',
    'owner.received': 'الطلبات', 'owner.profile': 'ملف الأعمال',
    'owner.bookings': 'الحجوزات', 'owner.editService': 'تعديل الخدمة',
    'owner.manageSlots': 'إدارة الأوقات', 'owner.publish': 'نشر العرض',
    'owner.slotsOpen': 'متاح', 'owner.slotsPassed': 'انتهى الوقت',
    'owner.full': 'ممتلئ', 'owner.everyday': 'عرض يومي',
    'owner.everydayDesc': 'متاح كل يوم في الأوقات المحددة',
    'owner.saveProfile': 'حفظ الملف', 'owner.saving': 'جارٍ الحفظ…',
    'owner.serviceName': 'اسم الخدمة', 'owner.duration': 'المدة',
    'owner.regularPrice': 'السعر الأصلي (دينار)', 'owner.jopassPrice': 'سعر جوباس (دينار)',
    'owner.autoClose': 'إغلاق الوقت بعد الحجز',
    'owner.autoCloseDesc': '(حجز واحد لكل وقت)',
    'owner.availableSlots': 'الأوقات المتاحة',
    'owner.slotsDesc': 'اضغط لإغلاق/فتح. أخضر = مفتوح، رمادي = مغلق.',
    'owner.saveChanges': 'حفظ التغييرات',
    'owner.newBooking': 'حجز جديد!',
    'owner.viewBooking': 'عرض الحجز',
    'owner.markViewed': 'وضع علامة مشاهدة',
    'owner.confirmMark': 'يرجى تأكيد الحجز من جهتك',
    'owner.filterAll': 'الكل', 'owner.filterToday': 'اليوم',
    'owner.filterWeek': 'هذا الأسبوع', 'owner.filterMonth': 'هذا الشهر',
    /* Login */
    'login.title': 'احجز تجارب رائعة بأسعار أقل.',
    'login.email': 'البريد الإلكتروني', 'login.password': 'كلمة المرور',
    'login.forgot': 'نسيت كلمة المرور؟', 'login.signin': 'تسجيل الدخول',
    'login.signing': 'جارٍ الدخول…', 'login.noAccount': 'ليس لديك حساب؟',
    'login.signup': 'إنشاء حساب', 'login.venue': 'هل أنت صاحب مكان؟',
    'login.venueLink': 'سجّل دخولك هنا',
    'login.resetTitle': 'إعادة تعيين كلمة المرور',
    'login.resetEmail': 'البريد الإلكتروني', 'login.sendReset': 'إرسال رابط الاسترداد',
    'login.sending': 'جارٍ الإرسال…', 'login.sent': 'تم الإرسال!',
    'login.resetSent': 'تحقق من بريدك واضغط على رابط الاسترداد.',
    /* Signup */
    'signup.title': 'أنشئ حسابك وابدأ التوفير.',
    'signup.name': 'الاسم الكامل', 'signup.email': 'البريد الإلكتروني',
    'signup.phone': 'رقم الهاتف', 'signup.password': 'كلمة المرور',
    'signup.confirm': 'تأكيد كلمة المرور', 'signup.create': 'إنشاء حساب',
    'signup.creating': 'جارٍ إنشاء الحساب…', 'signup.hasAccount': 'لديك حساب بالفعل؟',
    'signup.login': 'تسجيل الدخول',
  },
};

let _lang = localStorage.getItem('jopass_lang') || 'en';

function t(key) {
  return TRANSLATIONS[_lang]?.[key] ?? TRANSLATIONS.en[key] ?? key;
}

function setLang(lang) {
  _lang = lang;
  localStorage.setItem('jopass_lang', lang);
  document.documentElement.dir  = lang === 'ar' ? 'rtl' : 'ltr';
  document.documentElement.lang = lang;
  _updateNavLabels();
  _updateLangToggle();
  if (typeof navigateTo === 'function' && typeof state !== 'undefined') {
    navigateTo(state.currentView || 'browse');
  } else if (typeof ownerNav === 'function' && typeof ownerState !== 'undefined') {
    ownerNav(ownerState.currentView || 'listings');
  }
}

function _updateNavLabels() {
  const map = {
    'navLabelBrowse':   t('nav.browse'),
    'navLabelBookings': t('nav.bookings'),
    'navLabelCredits':  t('nav.credits'),
    'navLabelProfile':  t('nav.profile'),
  };
  Object.entries(map).forEach(([id, text]) => {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
  });
}

function _updateLangToggle() {
  document.querySelectorAll('.lang-toggle-btn').forEach(btn => {
    btn.textContent = _lang === 'ar' ? 'EN' : 'عر';
  });
}

document.addEventListener('DOMContentLoaded', () => {
  document.documentElement.dir  = _lang === 'ar' ? 'rtl' : 'ltr';
  document.documentElement.lang = _lang;
  _updateLangToggle();
});
