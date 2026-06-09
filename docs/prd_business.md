# Souk ElKanto — PRD + Business Plan (EN + AR)

> Last updated: 2026-06-01 · Status: Draft v1 · Awaiting stakeholder review.

---

# Part A — English

## 1. Product Requirements

### 1.1 Vision

> "The trusted neighborhood marketplace for Madinaty — where families pass goods to families, safely and gracefully."

### 1.2 Problem Statement

Madinaty's 700,000+ residents generate constant goods flow: kids outgrow toys/clothes/furniture every season, families move between phases, expats leave entire apartments at once. Today this flow happens in 40+ fragmented Facebook and WhatsApp groups with no verification, no reputation, no safety, and frequent scams (stolen photos, no-show buyers, price gouging). Sellers waste hours on tire-kickers; buyers can't tell who's a neighbor and who's a scammer.

### 1.3 Target Users

| Persona | Description | Primary need |
|---------|-------------|-------------|
| **The Mover** | Family moving between Madinaty phases or out of city | Sell everything fast |
| **The Outgrowing Parent** | Family with kids 0-12 cycling toys/clothes/strollers | Sell + buy continuously |
| **The Upgrader** | Resident replacing furniture / appliances | Sell mid-value items |
| **The Bargain Hunter** | Cost-conscious resident, new family, students | Buy quality at fraction of new price |
| **The Sustainable Buyer** | Eco-conscious resident, "buy less new" mindset | Buy used by principle |

### 1.4 User Stories (MoSCoW for v1)

**Must Have**
- As a seller, I can post a listing with photos, title, description, category, condition, asking price.
- As a buyer, I can browse listings by category, search by keyword, filter by district + condition + price.
- As a buyer, I can make an offer; seller can accept/counter/decline.
- As either party, I see the other's KYC status + **TrustMeter tier + total** on every offer screen (TrustScore is internal-only).
- As either party, when offer is accepted, the app suggests the nearest Safe Meet Spot.
- As either party, after meetup I tap "Handover confirmed" and rate the other (1-5).
- As a buyer, I can optionally lock individual tokens as a 72h commitment hold.
- As either party, I can report a listing or user — feeds TrustScore (ban gate) **AND** TrustMeter (engagement penalty).
- As a user, I see my listings, offers, handovers, and my **TrustMeter tier with progress to next tier** in a dashboard.
- As a user, when I cross a TrustMeter tier upward, I receive an in-app notification and bonus token grant.
- All UI in Arabic (default) and English. RTL.

**Should Have**
- As a seller, I get an AI suggestion for category + fair price.
- As a buyer, I can favorite listings.
- As a user, I see "recently viewed" history.
- Cross-tenant recommendations ("you bought on Souq, you might want this on Kanto").

**Could Have**
- WhatsApp deep-link directly to seller (from `GlobalUser.metadata.whatsapp`).
- Listing share to WhatsApp/Facebook.

**Won't Have (v1)**
- Auctions, in-app payment, delivery, merchant tier, native mobile.

### 1.5 Acceptance Criteria (sample, full set in `tech_plan.md`)

- A listing without photos cannot be published.
- A listing photo's server-side timestamp must be within 30 days of upload, else it shows a "Photo may be old" warning.
- TrustMeter total + tier must be re-pulled on every listing view (cached 5 min, served from CoreMesh).
- A user with TrustScore ≤ 20 cannot create new listings (existing CoreMesh ban gate).
- A user with TrustMeter total below NEW threshold (0-200) can still list, but listings show "New Seller" chip instead of a tier badge.
- A token hold of 72h must auto-release if no handover-confirmed by both parties.
- Souk ElKanto must emit `souk.handover.confirmed`, `souk.rating.received`, `souk.listing.unlisted.under24h`, `souk.listing.expired`, `souk.listing.sold.within30d`, `souk.offer.noshow`, and `souk.report.verified` events for the TrustMeter event-listener to consume.
- Souk ElKanto must NEVER write directly to TrustMeter — only emit events.

### 1.6 Success Metrics (90 days post-launch)

| Metric | Target |
|--------|--------|
| Listings published | 2,000 |
| Active sellers (≥1 listing) | 800 |
| Offers made | 4,000 |
| Handovers confirmed (both-tap) | 1,200 |
| Average TrustMeter movement after first deal | +40 to +60 (handover + rating + milestone bonus on first deal) |
| Users reaching Bronze tier (>200 pts) within 90 days | ≥ 300 |
| Users reaching Silver tier (>500 pts) within 90 days | ≥ 80 |
| Reported listings rate | < 2% |
| 7-day seller retention | > 35% |

### 1.7 Point Map (Souk ElKanto contribution to TrustMeter)

Authoritative table lives in `CoreMesh/docs/trust-meter.md §4.1`. Souk ElKanto-specific summary:

| Action | Δ |
|--------|---|
| Handover confirmed (each party) | +10 |
| 5-star rating received | +3 |
| 4-star rating received | +1 |
| 2-star rating received | -3 |
| 1-star rating received | -7 |
| Listing sold within 30 days | +5 |
| First lifetime successful deal | +25 (one-time milestone) |
| Listing unlisted under 24h | -2 |
| Listing expired without sale | -1 |
| Offer accepted but no-show | -8 |
| Verified report (severity 1-2 / 3-4 / 5) | -10 / -25 / -50 |

These values are admin-editable in `TrustMeterActionDefinition` — Souk ElKanto code does NOT hardcode them.

---

## 2. Business Plan

### 2.1 Strategic Position

Souk ElKanto is the **community-economy capture mechanism** for Madinaty.AI. It exists to:

1. Lock in resident habit — people return weekly to browse/post.
2. Generate cross-tenant data — what residents buy/sell signals demand for Kitchen, Tutor, Time Bank.
3. Stress-test the CoreMesh primitives (KYC, TrustScore, Token Wallet) with the highest-volume tenant.
4. Replace the noisy WhatsApp/Facebook ecosystem with a trust-layered alternative — same neighbor convenience + reputation.

### 2.2 Go-to-Market

| Stage | Tactic |
|-------|--------|
| **Pre-launch (T-30 days)** | Closed beta with 100 hand-picked Madinaty families across 5 districts. Free token grant (50 individual tokens) to seed wallet feature. |
| **Launch week** | Posts in existing top-5 Madinaty Facebook groups: "Same as the group — but verified neighbors, trust score, safe meet spots." |
| **Month 1-2** | Partner with 3 mommy WhatsApp communities. "Move-out month" campaign targeting end-of-school-year families. |
| **Month 3-4** | First "Free Listing Boost" weekend — gives users a reason to acquire tokens. |
| **Month 5-6** | Cross-promote inside Madinaty Bot ("looking for crib? check Souk ElKanto"). |

### 2.3 Pricing (Closed-loop tokens — v2)

| Action | Cost |
|--------|------|
| Post listing | Free (always) |
| Boost listing 7 days | 10 individual tokens |
| Pin listing to category top | 25 individual tokens |
| Power-seller badge (monthly) | 100 business tokens |

Tokens acquired via existing CoreMesh `POST /api/tokens/credit` (admin flow — offline cash to credit).

### 2.4 Operating Model

- **Engineering:** 1 backend dev (CoreMesh module), 1 frontend dev (Next.js), 1 designer, all part-time, ~8 weeks to v1.
- **Moderation:** Community moderators (3-5 trusted Madinaty residents) review reports; severity ≥ 3 escalates to platform admin.
- **Support:** Async only via in-app report flow + email.
- **Operational cost:** Negligible — rides on existing CoreMesh infra. Marginal cost is photo storage + AI moderation tokens (~$30-80/month at projected volume).

### 2.5 Risks and Mitigations

See `feasibility_swot.md` § Risk Matrix.

---

# Part B — العربية (Arabic)

## 1. متطلبات المنتج

### 1.1 الرؤية

> "السوق الجار الموثوق لسكان مدينتي — حيث تنتقل الأشياء من بيت لبيت، بأمان وكرامة."

### 1.2 المشكلة

سكان مدينتي (أكثر من 700 ألف) يتداولون آلاف الأشياء يومياً: ملابس وألعاب وأثاث وأجهزة. هذا التداول يحدث الآن في أكثر من 40 جروب فيسبوك وواتساب متفرقة، بدون توثيق ولا تقييم ولا أمان، مع نصب متكرر (صور مسروقة، مشتري لا يحضر، أسعار مبالغ فيها). البائع يخسر وقته مع متفرجين، والمشتري لا يقدر يميز جاره من النصاب.

### 1.3 شرائح المستخدمين

| الشخصية | الوصف | الحاجة الأساسية |
|---------|-------|------------------|
| **العائلة الناقلة** | أسرة بتنقل بين أحياء مدينتي أو خارجها | بيع كل شيء بسرعة |
| **الأم الناشطة** | عيال صغار من 0-12 بيكبروا كل موسم | بيع وشراء مستمر |
| **المُحدِّث** | ساكن بيستبدل أثاث أو أجهزة | بيع متوسط القيمة |
| **الباحث عن صفقة** | ساكن مهتم بالميزانية، طالب، أسرة جديدة | شراء بجودة بربع السعر |
| **المشتري الواعي** | يفضّل المستعمل عن الجديد بحكم مبدأ بيئي | شراء استعمال كقناعة |

### 1.4 قصص المستخدمين (للنسخة الأولى)

**يجب**
- البائع ينشر إعلان بصور + عنوان + وصف + تصنيف + حالة + سعر مطلوب.
- المشتري يتصفح بالتصنيف، يبحث بكلمة، يفلتر بالحي والحالة والسعر.
- المشتري يقدم عرض؛ البائع يقبل/يعدّل/يرفض.
- الطرفين يشوفوا حالة التحقق + TrustScore في كل شاشة عرض.
- بعد قبول العرض، التطبيق يقترح أقرب "نقطة لقاء آمنة".
- بعد التسليم، الطرفين يأكدوا "تم التسليم" ويقيّموا (1-5).
- المشتري اختياري يحجز رموز (Tokens) لمدة 72 ساعة كالتزام.
- أي طرف يقدر يبلّغ — يؤثر على TrustScore.
- لوحة تحكم بإعلاناتي وعروضي وتسليماتي.
- واجهة بالعربي (افتراضي) وإنجليزي، مع دعم RTL.

**يفضّل**
- اقتراح ذكي للتصنيف والسعر العادل للبائع.
- إضافة الإعلانات للمفضلة.
- تاريخ "شوهد مؤخراً".
- توصيات بين التطبيقات (اشتريت في سوق، ممكن يعجبك في سوق الكانتو).

**ممكن**
- رابط واتساب مباشر للبائع.
- مشاركة الإعلان على واتساب/فيسبوك.

**لن** (في النسخة الأولى)
- مزادات، دفع داخل التطبيق، توصيل، تجار، تطبيق موبايل أصلي.

### 1.5 معايير القبول (عينة)

- لا يمكن نشر إعلان بدون صور.
- لو الصورة المرفوعة فيها timestamp أقدم من 30 يوم، يظهر تحذير "صورة قد تكون قديمة".
- TrustScore يُجلب لحظياً مع كل عرض (مع cache 5 دقائق).
- المستخدم اللي TrustScore عنده ≤ 20 ممنوع من نشر إعلانات جديدة.
- حجز الرموز 72 ساعة لازم يُحرر تلقائياً لو ما تم تأكيد التسليم من الطرفين.

### 1.6 مؤشرات النجاح (90 يوم بعد الإطلاق)

| المؤشر | الهدف |
|--------|------|
| إعلانات منشورة | 2,000 |
| بائعون نشطون (إعلان واحد على الأقل) | 800 |
| عروض مقدمة | 4,000 |
| تسليمات مؤكدة من الطرفين | 1,200 |
| متوسط حركة TrustScore بعد أول صفقة | +5 إلى +8 |
| نسبة الإعلانات المُبلَّغ عنها | أقل من 2% |
| احتفاظ البائعين بعد 7 أيام | أكثر من 35% |

---

## 2. خطة العمل

### 2.1 الموقع الاستراتيجي

سوق الكانتو هو **آلية امتلاك الاقتصاد المجتمعي** لمدينتي AI. وجوده:

1. يثبّت عادة دخول السكان أسبوعياً للتصفح والنشر.
2. يولّد بيانات عبر التطبيقات — ما يُباع ويُشترى يدل على طلب في الأقسام الأخرى.
3. يختبر بنية CoreMesh (KYC، TrustScore، Wallet) بأعلى حجم.
4. يستبدل بيئة الواتساب/الفيسبوك الفوضوية ببديل بثقة موثقة — نفس الراحة الجارية + سمعة.

### 2.2 خطة الإطلاق

| المرحلة | الإجراء |
|---------|---------|
| **قبل الإطلاق (30 يوم)** | بيتا مغلق لـ 100 أسرة منتقاة من 5 أحياء. هدية 50 رمز فردي لكل أسرة. |
| **أسبوع الإطلاق** | منشورات في أقوى 5 جروبات فيسبوك مدينتي: "نفس الجروب، لكن جيران موثقون وتقييم وأماكن لقاء آمنة." |
| **الشهر 1-2** | شراكة مع 3 مجتمعات أمهات على واتساب. حملة "شهر الترحال" آخر العام الدراسي. |
| **الشهر 3-4** | أول "ويك إند تعزيز إعلانات مجاني" — يدفع الناس لاقتناء رموز. |
| **الشهر 5-6** | ترويج عبر بوت مدينتي ("بتدور على سرير أطفال؟ شوف سوق الكانتو"). |

### 2.3 التسعير (رموز مغلقة الحلقة — v2)

| الإجراء | التكلفة |
|---------|---------|
| نشر إعلان | مجاني دائماً |
| تعزيز إعلان 7 أيام | 10 رموز فردية |
| تثبيت في رأس التصنيف | 25 رمز فردي |
| شارة بائع قوي (شهرياً) | 100 رمز تجاري |

تُكتسب الرموز عبر CoreMesh `POST /api/tokens/credit` (تدفق المسؤول — كاش خارج المنصة، رصيد داخل النظام).

### 2.4 نموذج التشغيل

- **الهندسة:** مطور باك إند (وحدة CoreMesh)، مطور فرونت إند (Next.js)، مصمم — كل بدوام جزئي، 8 أسابيع للنسخة الأولى.
- **الإشراف:** مشرفون من المجتمع (3-5 سكان موثوقون) يراجعون البلاغات؛ شدة ≥ 3 تُصعَّد لمسؤول المنصة.
- **الدعم:** غير متزامن فقط عبر تدفق البلاغات + بريد.
- **التكلفة التشغيلية:** ضئيلة — يركب على بنية CoreMesh الحالية. التكلفة الحدّية = تخزين الصور + رموز AI للإشراف (~ 30-80 دولار شهرياً للحجم المتوقع).

### 2.5 المخاطر والتخفيف

راجع `feasibility_swot.md` قسم مصفوفة المخاطر.
