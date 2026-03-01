# مسارات الخادم (API Routes) والمصادقة

يمتلك مشروع زيد بن ثابت واجهة برمجة تطبيقات (API) قوية مبنية على Express.js، مع نظام حماية (Middleware) لضمان أمان الوصول وعزل بيانات المشتركين.

جميع المسارات (Routes) مُعرفة في ملف التوجيه الرئيسي لمنطق الخادم: `server/routes.ts`.

## 1. مسارات المصادقة (Authentication API)

### أ. تسجيل دخول المعلم (Teacher Login)
- **المسار:** `POST /api/auth/teacher/login`
- **الحمولة (Payload):** `{ nationalId, mobileNumber }`
- **الوصف:** يتم فحص جدول المستخدمين `users`. إذا وُجد المعلم، يتم إنشاء جلسة (Session) وتخزين معلومات المستخدم الحالية بداخلها عبر `req.login`.

### ب. تسجيل حساب جديد (Teacher Registration)
- **المسار:** `POST /api/auth/teacher/register`
- **الحمولة:** `{ fullNameArabic, nationalId, mobileNumber }`
- **الوصف:** ينشئ مستخدم جديد بدور `teacher`، ثم يُنشئ جلسة تسجيل الدخول فورياً.

### ج. تسجيل دخول المدير (Admin Login)
- **المسار:** `POST /api/auth/admin/login`
- **الحمولة:** `{ password }`
- **الوصف:** يصادق على كلمة السر البيئية (`ADMIN_PASSWORD`). ويسجل الدخول بدور `admin`.

### د. تسجيل خروج (Logout)
- **المسار:** `POST /api/auth/logout` أو `GET /api/logout`
- **الوصف:** يتلف الجلسة (Session Destruction) ويمسح ملف تعريف الارتباط (Cookie).

### هـ. جلب معلومات المستخدم الحالي
- **المسار:** `GET /api/user`
- **الوصف:** يرسل الواجهة الأمامية (Client) طلبًا بصورة دورية للتحقق من أن المستخدم مسجل الدخول وتحديث حالة الواجهة (React Context / React Query).

## 2. حماية المسارات (Middleware)

لحماية مسارات الـ API الأخرى، تم استخدام وظائف مساعدة مبنية في `replitAuth.ts`:
- **`isAuthenticated`:** يضمن أن الطلب القادم يمتلك جلسة نشطة ومعلومات مستخدم مبدئية. (يتم إرفاق `req.user` لجميع الطلبات القادمة).
- **`isPrincipal`:** يضمن أن مسار معين لا يتم الولوج إليه إلا إذا كان المستخدم المُصرح يملك الـ Role = 'admin'.
- **`isCreator`:** مخصصة لمنشئ الموقع.

## 3. مسارات بيانات النظام (Data Endpoints)

### أ. المؤشرات (Indicators)
- **`GET /api/indicators`:** يجلب جميع مؤشرات المعلم المسجل دخوله حالياً (باستخدام `req.user.id`).
- **`POST /api/indicators`:** يُنشئ مؤشراً جديداً ويربطه بالمعلم.

### ب. الشواهد (Witnesses)
- **`POST /api/witnesses`:** يرفع شاهدًا جديدًا مرتبطًا بمؤشر مُحدد `indicatorId`.
- **`PATCH /api/witnesses/:id`:** يحدّث بيانات أو حالة شاهد موجود.

### ج. لوحة المدير (Principal API)
جميع هذه المسارات مُغلّفة بحماية الـ `isPrincipal`:
- **`GET /api/principal/stats`:** يجلب الإحصائيات العامة للمدرسة (مثل إجمالي المؤشرات المكتملة والشواهد المعتمدة).
- **`GET /api/principal/teachers`:** يجلب قائمة بالمعلمين النشطين وحالة مواثيقهم.
- **`POST /api/principal/approve-indicator/:id`:** يعتمد مؤشراً معيناً.
- **`POST /api/principal/reject-indicator/:id`:** يرفض مؤشراً مع إضافة ملاحظة `reviewFeedback`.

## 4. إعدادات الدورات (Cycles Settings)
يدعم النظام ميزة "بدء وإغلاق" الدورات التقييمية عن طريق مسؤول النظام.
- **`GET /api/cycles/settings`:** يجلب إعداد الدورة الحالية (مثال: هل الموقع مغلق عن قبول المؤشرات؟).
- **`POST /api/cycles/settings`:** يحدّث إعداد الدورة وإضافة تواريخ.

## 5. ملاحظة هامة: نظام Replit OAuth (محفوظ للجاهزية)
توجد في `replitAuth.ts` بنية جاهزة للعمل باستخدام منصة Replit OIDC إذا لزم الأمر، لكن تم التركيز الأساسي على المصادقة المحلية المبنية على Sessions والمشفرة لضمان استقلالية المشروع وإمكانية استضافته على أي منصة إنتاجية كحاوية (Docker Container) أو بيئة Node منفردة دون الحاجة لـ Replit.
