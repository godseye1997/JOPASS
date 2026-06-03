/* ── JoPass i18n ── */
const TRANSLATIONS = {
  en: {
    /* Nav */
    'nav.browse':    'Browse',
    'nav.bookings':  'Bookings',
    'nav.credits':   'Credits',
    'nav.profile':   'Profile',
    /* Browse */
    'browse.title':     'Discover Deals',
    'browse.balance':   'Your Balance',
    'browse.buy':       '+ Buy Credits',
    'browse.search':    'Search venues…',
    'browse.noResults': 'No venues found for',
    /* Vendor detail */
    'vendor.deals':     'Deals',
    'vendor.standard':  'Standard Booking',
    'vendor.everyday':  'Every Day',
    'vendor.bookNow':   'Book Now',
    'vendor.full':      'Full',
    'vendor.passed':    'Passed',
    'vendor.follow':    '🤍 Follow',
    'vendor.following': '❤️ Following',
    'vendor.amenities': 'AMENITIES',
    'vendor.location':  'LOCATION',
    'vendor.openMaps':  'Open in Google Maps ↗',
    'vendor.reviews':   'Reviews',
    'vendor.verified':  'Verified',
    'vendor.save':      'Save',
    'vendor.left':      'left',
    'vendor.buyMore':   'buy more',
    'vendor.notEnough': 'Not enough credits —',
    /* Bookings */
    'bookings.title':       'My Bookings',
    'bookings.empty':       'No Bookings Yet',
    'bookings.emptyDesc':   'Browse deals and book your first experience!',
    'bookings.browseDeals': 'Browse Deals',
    'bookings.noFound':     'No Bookings Found',
    'bookings.noFoundDesc': 'No bookings match the selected filter.',
    'bookings.confirmed':   'Confirmed',
    'bookings.completed':   'Completed',
    'bookings.cancelled':   'Cancelled',
    'bookings.reviewed':    'Reviewed',
    'bookings.review':      'Review',
    'bookings.cancel':      'Cancel',
    'bookings.cancelNR':    'Cancel (no refund)',
    'bookings.remove':      'Remove',
    'bookings.all':         'All',
    'bookings.today':       'Today',
    'bookings.week':        'This Week',
    'bookings.month':       'This Month',
    /* Credits */
    'credits.title':    'Buy Credits',
    'credits.balance':  'Current Balance',
    'credits.credits':  'Credits',
    'credits.howWorks': 'How It Works',
    /* Profile */
    'profile.title':    'My Profile',
    'profile.logout':   '← Log Out',
    'profile.share':    'Share',
    'profile.referral': 'Refer a Friend',
    'profile.notif':    'Notifications',
    'profile.location': 'Location',
    'profile.lang':     'Language',
    /* Misc */
    'at':       'at',
    'credits':  'credits',
    'settings': 'Settings',
    'back':     '← Back',
  },
  ar: {
    /* Nav */
    'nav.browse':    'تصفح',
    'nav.bookings':  'حجوزاتي',
    'nav.credits':   'الرصيد',
    'nav.profile':   'حسابي',
    /* Browse */
    'browse.title':     'اكتشف العروض',
    'browse.balance':   'رصيدك',
    'browse.buy':       '+ شراء رصيد',
    'browse.search':    'ابحث عن أماكن…',
    'browse.noResults': 'لا توجد أماكن لـ',
    /* Vendor detail */
    'vendor.deals':     'العروض',
    'vendor.standard':  'حجز عادي',
    'vendor.everyday':  'كل يوم',
    'vendor.bookNow':   'احجز الآن',
    'vendor.full':      'ممتلئ',
    'vendor.passed':    'انتهى',
    'vendor.follow':    '🤍 متابعة',
    'vendor.following': '❤️ تتابع',
    'vendor.amenities': 'المرافق',
    'vendor.location':  'الموقع',
    'vendor.openMaps':  'فتح في خرائط جوجل ↗',
    'vendor.reviews':   'التقييمات',
    'vendor.verified':  'موثق',
    'vendor.save':      'وفر',
    'vendor.left':      'متبقي',
    'vendor.buyMore':   'اشترِ المزيد',
    'vendor.notEnough': 'رصيد غير كافٍ —',
    /* Bookings */
    'bookings.title':       'حجوزاتي',
    'bookings.empty':       'لا توجد حجوزات بعد',
    'bookings.emptyDesc':   'تصفح العروض واحجز تجربتك الأولى!',
    'bookings.browseDeals': 'تصفح العروض',
    'bookings.noFound':     'لا توجد حجوزات',
    'bookings.noFoundDesc': 'لا توجد حجوزات تطابق الفلتر.',
    'bookings.confirmed':   'مؤكد',
    'bookings.completed':   'مكتمل',
    'bookings.cancelled':   'ملغى',
    'bookings.reviewed':    'تم التقييم',
    'bookings.review':      'تقييم',
    'bookings.cancel':      'إلغاء',
    'bookings.cancelNR':    'إلغاء (بدون استرداد)',
    'bookings.remove':      'حذف',
    'bookings.all':         'الكل',
    'bookings.today':       'اليوم',
    'bookings.week':        'هذا الأسبوع',
    'bookings.month':       'هذا الشهر',
    /* Credits */
    'credits.title':    'شراء رصيد',
    'credits.balance':  'الرصيد الحالي',
    'credits.credits':  'رصيد',
    'credits.howWorks': 'كيف يعمل',
    /* Profile */
    'profile.title':    'حسابي',
    'profile.logout':   '→ تسجيل الخروج',
    'profile.share':    'مشاركة',
    'profile.referral': 'دعوة صديق',
    'profile.notif':    'الإشعارات',
    'profile.location': 'الموقع',
    'profile.lang':     'اللغة',
    /* Misc */
    'at':       'في',
    'credits':  'رصيد',
    'settings': 'الإعدادات',
    'back':     'رجوع →',
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
  if (typeof navigateTo === 'function') navigateTo(state?.currentView || 'browse');
}

function _updateNavLabels() {
  const map = {
    'navLabelBrowse':    t('nav.browse'),
    'navLabelBookings':  t('nav.bookings'),
    'navLabelCredits':   t('nav.credits'),
    'navLabelProfile':   t('nav.profile'),
  };
  Object.entries(map).forEach(([id, text]) => {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
  });
}

function _updateLangToggle() {
  const btn = document.getElementById('langToggleBtn');
  if (btn) btn.textContent = _lang === 'ar' ? 'EN' : 'عر';
}

/* Apply saved language on load */
document.addEventListener('DOMContentLoaded', () => {
  document.documentElement.dir  = _lang === 'ar' ? 'rtl' : 'ltr';
  document.documentElement.lang = _lang;
  _updateLangToggle();
});
