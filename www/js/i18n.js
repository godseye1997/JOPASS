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
    /* Categories */
    'cat.All': 'All',
    'cat.Health and Wellness': 'Health and Wellness',
    'cat.Sports Activities': 'Sports Activities',
    'cat.Beauty and Care': 'Beauty and Care',
    'cat.Activities': 'Activities',
    'cat.Education': 'Education',
    'cat.Dining': 'Dining',
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
    'credits.custom': 'Custom Amount', 'credits.customDesc': 'Choose exactly how many credits you need',
    'credits.buyNow': 'Buy', 'credits.purchasing': 'Purchasing',
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
    'editProfile.title': 'Edit Profile', 'editProfile.personalInfo': 'Personal Info',
    'editProfile.name': 'Full Name', 'editProfile.namePlaceholder': 'Your name',
    'editProfile.phone': 'Phone', 'editProfile.optional': '(optional)',
    'editProfile.email': 'Email', 'editProfile.emailNote': 'Email cannot be changed.',
    'editProfile.save': 'Save Changes', 'editProfile.saving': 'Saving…',
    'editProfile.changePassword': 'Change Password',
    'editProfile.newPassword': 'New Password', 'editProfile.newPassPlaceholder': 'At least 6 characters',
    'editProfile.confirmPassword': 'Confirm Password',
    'editProfile.updatePassword': 'Update Password',
    'editProfile.nameEmpty': 'Name cannot be empty.',
    'editProfile.updated': 'Profile updated!', 'editProfile.failed': 'Failed to save. Please try again.',
    'editProfile.passShort': 'Password must be at least 6 characters.',
    'editProfile.passMismatch': 'Passwords do not match.',
    'editProfile.updating': 'Updating…', 'editProfile.passUpdated': 'Password updated!',
    /* Notifications */
    'notif.enabledTitle': 'Notifications Enabled',
    'notif.enabledMsg': 'JoPass notifications are <strong>enabled</strong>.<br><br>To change notification settings, go to:<br><strong>Settings → Apps → JoPass → Notifications</strong>',
    'notif.blockedTitle': 'Notifications Blocked',
    'notif.blockedMsg': 'Notifications are blocked. To enable them, go to:<br><br><strong>Settings → Apps → JoPass → Notifications</strong><br><br>and turn them on.',
    'notif.ok': 'OK',
    'notif.enabled': 'Notifications enabled!',
    'notif.notEnabled': 'Notifications not enabled. You can turn them on in Settings.',
    'notif.manage': 'Open Settings → Apps → JoPass → Notifications to manage alerts.',
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
    /* Owner nav */
    'owner.navProfile': 'Profile', 'owner.navBookings': 'Bookings', 'owner.navReceived': 'Received',
    'owner.portalLabel': 'Owner Portal', 'owner.logout': '← Log out',
    'owner.sidebarProfile': 'Business Profile', 'owner.sidebarDeals': 'Deals',
    'owner.sidebarAddDeal': 'Add Deal', 'owner.sidebarStandard': 'Standard Booking',
    'owner.sidebarReceived': 'Bookings Received',
    /* Owner pages */
    'owner.deals': 'Deals', 'owner.standard': 'Standard Booking',
    'owner.addDeal': 'Add Deal', 'owner.addStandard': '+ Add Standard Booking',
    'owner.addStandardTitle': 'Add Standard Booking', 'owner.addStandardBtn': 'Add Standard Booking',
    'owner.noDeals': 'No Deals Yet', 'owner.noDealsDesc': 'Add time-limited deals customers can book.',
    'owner.noStandard': 'No Standard Booking Yet',
    'owner.received': 'Received', 'owner.receivedTitle': 'Bookings Received',
    'owner.profile': 'Business Profile', 'owner.bookings': 'Bookings',
    'owner.bookingsHub': 'Bookings', 'owner.dealsCard': 'Deals',
    'owner.dealsCardDesc': 'Time-limited slots customers can book',
    'owner.standardCard': 'Standard Booking', 'owner.standardCardDesc': 'Fixed services available anytime',
    'owner.editService': 'Edit Service', 'owner.manageSlots': 'Manage Slots',
    'owner.publish': 'Publish Opening', 'owner.publishing': 'Publishing…',
    'owner.slotsOpen': 'open', 'owner.slotsPassed': 'Slots passed',
    'owner.full': 'Full', 'owner.everyday': 'Everyday Offer',
    'owner.everydayDesc': 'Available every day at selected times',
    'owner.saveProfile': 'Save Profile', 'owner.saving': 'Saving…',
    'owner.serviceName': 'Service Name', 'owner.duration': 'Duration',
    'owner.durationOpt': '(optional)',
    'owner.regularPrice': 'Regular Price (JOD)', 'owner.jopassPrice': 'JoPass Price (JOD)',
    'owner.noDiscount': 'No discount — list at regular price',
    'owner.slotsPerTime': 'Slots Available per Time',
    'owner.autoClose': 'Auto-close slot after booking',
    'owner.autoCloseDesc': '(1 reservation per slot)',
    'owner.availableSlots': 'Available Time Slots',
    'owner.slotsDesc': 'Tap a slot to close it. Green = open, grey = closed.',
    'owner.slotsSelectDesc': 'Select the time slots for this offer.',
    'owner.dateLabel': 'Date', 'owner.saveChanges': 'Save Changes',
    'owner.newBooking': '🔔 New Booking!', 'owner.viewBooking': 'View Booking',
    'owner.markViewed': 'Mark as Viewed',
    'owner.confirmMark': 'Please confirm the booking on your side',
    'owner.noBookingsYet': 'No Bookings Yet', 'owner.noBookingsFound': 'No Bookings Found',
    'owner.noBookingsDesc': 'Bookings from customers will appear here.',
    'owner.filterAll': 'All', 'owner.filterToday': 'Today',
    'owner.filterWeek': 'This Week', 'owner.filterMonth': 'This Month',
    'owner.totalFollowers': 'Total Followers',
    'owner.customerView': '👁 Customer view — this is how your venue appears to customers',
    'owner.editProfile': 'Edit Profile', 'owner.profileIncomplete': 'Profile Incomplete',
    'owner.profileIncompleteDesc': 'Add your business details so customers can find you.',
    'owner.completeProfile': 'Complete Profile',
    'owner.addOpening': 'Add first deal →',
    'owner.seatsEach': 'seats each', 'owner.seat': 'seat',
    'owner.booked': 'booked', 'owner.remaining': 'remaining',
    'owner.timeSlots': 'time slots',
    'owner.addBtn': '+ Add',
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
    /* Categories */
    'cat.All': 'الكل',
    'cat.Health and Wellness': 'الصحة والعافية',
    'cat.Sports Activities': 'الأنشطة الرياضية',
    'cat.Beauty and Care': 'الجمال والعناية',
    'cat.Activities': 'الأنشطة',
    'cat.Education': 'التعليم',
    'cat.Dining': 'المطاعم',
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
    'credits.custom': 'مبلغ مخصص', 'credits.customDesc': 'اختر عدد النقاط التي تحتاجها بالضبط',
    'credits.buyNow': 'شراء', 'credits.purchasing': 'جارٍ الشراء',
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
    'editProfile.title': 'تعديل الملف', 'editProfile.personalInfo': 'المعلومات الشخصية',
    'editProfile.name': 'الاسم الكامل', 'editProfile.namePlaceholder': 'اسمك',
    'editProfile.phone': 'الهاتف', 'editProfile.optional': '(اختياري)',
    'editProfile.email': 'البريد الإلكتروني', 'editProfile.emailNote': 'لا يمكن تغيير البريد الإلكتروني.',
    'editProfile.save': 'حفظ التغييرات', 'editProfile.saving': 'جارٍ الحفظ…',
    'editProfile.changePassword': 'تغيير كلمة المرور',
    'editProfile.newPassword': 'كلمة مرور جديدة', 'editProfile.newPassPlaceholder': '6 أحرف على الأقل',
    'editProfile.confirmPassword': 'تأكيد كلمة المرور',
    'editProfile.updatePassword': 'تحديث كلمة المرور',
    'editProfile.nameEmpty': 'لا يمكن ترك الاسم فارغاً.',
    'editProfile.updated': 'تم تحديث الملف!', 'editProfile.failed': 'فشل الحفظ. حاول مرة أخرى.',
    'editProfile.passShort': 'يجب أن تكون كلمة المرور 6 أحرف على الأقل.',
    'editProfile.passMismatch': 'كلمتا المرور غير متطابقتين.',
    'editProfile.updating': 'جارٍ التحديث…', 'editProfile.passUpdated': 'تم تحديث كلمة المرور!',
    /* Notifications */
    'notif.enabledTitle': 'الإشعارات مفعّلة',
    'notif.enabledMsg': 'إشعارات جوباس <strong>مفعّلة</strong>.<br><br>لتغيير إعدادات الإشعارات، اذهب إلى:<br><strong>الإعدادات → التطبيقات → JoPass → الإشعارات</strong>',
    'notif.blockedTitle': 'الإشعارات محظورة',
    'notif.blockedMsg': 'الإشعارات محظورة. لتفعيلها، اذهب إلى:<br><br><strong>الإعدادات → التطبيقات → JoPass → الإشعارات</strong><br><br>وقم بتشغيلها.',
    'notif.ok': 'حسناً',
    'notif.enabled': 'تم تفعيل الإشعارات!',
    'notif.notEnabled': 'لم يتم تفعيل الإشعارات. يمكنك تشغيلها من الإعدادات.',
    'notif.manage': 'افتح الإعدادات → التطبيقات → JoPass → الإشعارات لإدارة التنبيهات.',
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
    /* Owner nav */
    'owner.navProfile': 'الملف', 'owner.navBookings': 'الحجوزات', 'owner.navReceived': 'الطلبات',
    'owner.portalLabel': 'بوابة الملاك', 'owner.logout': 'خروج →',
    'owner.sidebarProfile': 'ملف الأعمال', 'owner.sidebarDeals': 'العروض',
    'owner.sidebarAddDeal': 'إضافة عرض', 'owner.sidebarStandard': 'حجز عادي',
    'owner.sidebarReceived': 'الحجوزات الواردة',
    /* Owner pages */
    'owner.deals': 'العروض', 'owner.standard': 'حجز عادي',
    'owner.addDeal': 'إضافة عرض', 'owner.addStandard': '+ إضافة حجز عادي',
    'owner.addStandardTitle': 'إضافة حجز عادي', 'owner.addStandardBtn': 'إضافة حجز عادي',
    'owner.noDeals': 'لا توجد عروض بعد', 'owner.noDealsDesc': 'أضف عروضاً بوقت محدد يمكن للعملاء حجزها.',
    'owner.noStandard': 'لا توجد حجوزات عادية بعد',
    'owner.received': 'الطلبات', 'owner.receivedTitle': 'الحجوزات الواردة',
    'owner.profile': 'ملف الأعمال', 'owner.bookings': 'الحجوزات',
    'owner.bookingsHub': 'الحجوزات', 'owner.dealsCard': 'العروض',
    'owner.dealsCardDesc': 'أوقات محدودة يمكن للعملاء حجزها',
    'owner.standardCard': 'حجز عادي', 'owner.standardCardDesc': 'خدمات ثابتة متاحة في أي وقت',
    'owner.editService': 'تعديل الخدمة', 'owner.manageSlots': 'إدارة الأوقات',
    'owner.publish': 'نشر العرض', 'owner.publishing': 'جارٍ النشر…',
    'owner.slotsOpen': 'متاح', 'owner.slotsPassed': 'انتهى الوقت',
    'owner.full': 'ممتلئ', 'owner.everyday': 'عرض يومي',
    'owner.everydayDesc': 'متاح كل يوم في الأوقات المحددة',
    'owner.saveProfile': 'حفظ الملف', 'owner.saving': 'جارٍ الحفظ…',
    'owner.serviceName': 'اسم الخدمة', 'owner.duration': 'المدة',
    'owner.durationOpt': '(اختياري)',
    'owner.regularPrice': 'السعر الأصلي (دينار)', 'owner.jopassPrice': 'سعر جوباس (دينار)',
    'owner.noDiscount': 'بدون خصم — عرض بالسعر الأصلي',
    'owner.slotsPerTime': 'الأماكن المتاحة لكل وقت',
    'owner.autoClose': 'إغلاق الوقت بعد الحجز',
    'owner.autoCloseDesc': '(حجز واحد لكل وقت)',
    'owner.availableSlots': 'الأوقات المتاحة',
    'owner.slotsDesc': 'اضغط لإغلاق/فتح. أخضر = مفتوح، رمادي = مغلق.',
    'owner.slotsSelectDesc': 'اختر الأوقات المتاحة لهذا العرض.',
    'owner.dateLabel': 'التاريخ', 'owner.saveChanges': 'حفظ التغييرات',
    'owner.newBooking': '🔔 حجز جديد!', 'owner.viewBooking': 'عرض الحجز',
    'owner.markViewed': 'وضع علامة مشاهدة',
    'owner.confirmMark': 'يرجى تأكيد الحجز من جهتك',
    'owner.noBookingsYet': 'لا توجد حجوزات بعد', 'owner.noBookingsFound': 'لا توجد حجوزات',
    'owner.noBookingsDesc': 'ستظهر هنا حجوزات العملاء.',
    'owner.filterAll': 'الكل', 'owner.filterToday': 'اليوم',
    'owner.filterWeek': 'هذا الأسبوع', 'owner.filterMonth': 'هذا الشهر',
    'owner.totalFollowers': 'إجمالي المتابعين',
    'owner.customerView': '👁 عرض العملاء — هكذا يبدو مكانك للعملاء',
    'owner.editProfile': 'تعديل الملف', 'owner.profileIncomplete': 'الملف غير مكتمل',
    'owner.profileIncompleteDesc': 'أضف تفاصيل عملك حتى يتمكن العملاء من العثور عليك.',
    'owner.completeProfile': 'إكمال الملف',
    'owner.addOpening': 'إضافة أول عرض →',
    'owner.seatsEach': 'مقعد لكل وقت', 'owner.seat': 'مقعد',
    'owner.booked': 'محجوز', 'owner.remaining': 'متبقٍ',
    'owner.timeSlots': 'أوقات',
    'owner.addBtn': '+ إضافة',
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
    /* Customer nav */
    'navLabelBrowse':        t('nav.browse'),
    'navLabelBookings':      t('nav.bookings'),
    'navLabelCredits':       t('nav.credits'),
    'navLabelProfile':       t('nav.profile'),
    /* Owner nav */
    'ownerNavLabelProfile':  t('owner.navProfile'),
    'ownerNavLabelBookings': t('owner.deals'),
    'ownerNavLabelReceived': t('owner.navReceived'),
    'ownerPortalLabel':      t('owner.portalLabel'),
    'ownerLogoutLink':       t('owner.logout'),
    'ownerSidebarProfile':   t('owner.sidebarProfile'),
    'ownerSidebarDeals':     t('owner.sidebarDeals'),
    'ownerSidebarAddDeal':   t('owner.sidebarAddDeal'),
    'ownerSidebarStandard':  t('owner.sidebarStandard'),
    'ownerSidebarReceived':  t('owner.sidebarReceived'),
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

function _applyLangOnLoad() {
  document.documentElement.dir  = _lang === 'ar' ? 'rtl' : 'ltr';
  document.documentElement.lang = _lang;
  _updateLangToggle();
  _updateNavLabels();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', _applyLangOnLoad);
} else {
  _applyLangOnLoad();
}
