/** Shared constants for the Souk ElKanto E2E test suite. */

export const LOCALES = ['en', 'ar'] as const;
export type Locale = (typeof LOCALES)[number];

export const TEST_PHONE = '+201000000001';
export const TEST_PHONE_BUYER = '+201000000002';
/** Phone without country code — what the user types in the input field */
export const TEST_PHONE_LOCAL = '1000000001';
export const TEST_PHONE_BUYER_LOCAL = '1000000002';
export const TEST_OTP = '000000';
export const TEST_OTP_WRONG = '999999';

export const BASE_URL = 'http://localhost:3001';
export const BACKEND_URL = 'http://localhost:3000';
export const TENANT_ID = 'kanto';

/** Zustand persist keys */
export const AUTH_STORAGE_KEY = 'kanto.auth.v1';
export const FAVORITES_STORAGE_KEY = 'kanto.favorites.v1';
export const DRAFT_STORAGE_KEY = 'kanto.listing-draft.v1';

/** Playwright storage state paths */
export const AUTH_STATE_PATH = './e2e/.auth/user.json';
export const BUYER_AUTH_STATE_PATH = './e2e/.auth/buyer.json';

/** Expected i18n text (sampled from messages files) */
export const I18N = {
  en: {
    heroTitle: 'Your Nearest Deal',
    makeOffer: 'Make Offer',
    offerSentTitle: 'Offer sent!',
    kycVerified: 'Verified',
    next: 'Next',
    publish: 'Publish Listing',
    publishing: 'Publishing...',
    draftRestored: 'Draft restored',
    errorPhotos: 'Add at least one photo.',
    errorTitle: 'Title must be at least 3 characters.',
    errorPrice: 'Enter a price greater than zero.',
    networkDown: "We can't reach the server. Check your connection and try again.",
    notFound: "This listing doesn't exist.",
    notFoundOrNetworkDown: /(doesn.t exist|can.t reach the server)/i,
    ownListing: "You can't make an offer on your own listing.",
    sendOtp: 'Send code',
    verifyTitle: 'Enter your code',
    resend: 'Resend code',
    resentSuccess: 'Code resent',
    loginTitle: 'Welcome, sign in with your phone',
  },
  ar: {
    heroTitle: 'أقرب صفقة ليك',
    makeOffer: 'اعرض سعر',
    offerSentTitle: 'اتبعت العرض!',
    kycVerified: 'موثق',
    next: 'التالي',
    publish: 'نشر الإعلان',
    publishing: 'بنرفع الإعلان...',
    draftRestored: 'استرجعنا مسودتك',
    errorPhotos: 'ضيف صورة واحدة على الأقل.',
    errorTitle: 'العنوان لازم يكون 3 أحرف على الأقل.',
    errorPrice: 'اكتب سعر أكبر من صفر.',
    networkDown: 'مش قادرين نوصل للسيرفر. تأكد من الإنترنت وحاول تاني.',
    notFound: 'الإعلان ده مش موجود.',
    notFoundOrNetworkDown: /(مش موجود|مش قادرين نوصل)/i,
    ownListing: 'مش قادر تعرض على إعلانك الخاص.',
    sendOtp: 'ابعت الرمز',
    verifyTitle: 'ادخل الرمز',
    resend: 'ابعت الرمز تاني',
    resentSuccess: 'تم إرسال الرمز',
    loginTitle: 'أهلاً، ادخل برقم تليفونك',
  },
} as const;
