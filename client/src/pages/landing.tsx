import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import { CheckCircle, FileText, BarChart3, ShieldCheck, ArrowLeft, BookOpen, Users, Award, Lock, Zap, Globe } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

export default function Landing() {
  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <div className="min-h-screen bg-background font-sans" dir="rtl" data-testid="page-landing">
      <div className="absolute inset-0 -z-10 h-full w-full bg-white dark:bg-slate-950 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] dark:bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)]"></div>

      <nav className="container mx-auto px-6 py-6 flex justify-between items-center relative z-10 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <div className="h-10 w-10 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white hidden md:block">ميثاق الأداء الوظيفي</h1>
        </div>
        <div className="flex items-center gap-4">
          <ThemeToggle />
          <Link href="/login" data-testid="link-login">
            <Button variant="outline" className="font-bold border-primary text-primary" data-testid="button-login">
              تسجيل الدخول
            </Button>
          </Link>
        </div>
      </nav>

      <main className="container mx-auto px-6 pt-16 pb-12 text-center relative z-10">
        <motion.div
          initial="hidden"
          animate="visible"
          transition={{ duration: 0.5 }}
          variants={fadeIn}
          className="max-w-3xl mx-auto space-y-6"
        >
          <div className="inline-block px-4 py-1.5 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-sm font-semibold mb-4 border border-blue-100 dark:border-blue-800" data-testid="badge-moe">
            متوافق مع معايير وزارة التعليم الجديدة
          </div>
          <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 dark:text-white tracking-tight leading-tight" data-testid="text-hero-title">
            نظام <span className="text-transparent bg-clip-text bg-gradient-to-l from-blue-600 to-green-600">توثيق الأداء</span> الذكي
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 leading-relaxed max-w-2xl mx-auto" data-testid="text-hero-subtitle">
            منصة متكاملة تمكن المعلمين من توثيق منجزاتهم المهنية، وتتيح للمديرين متابعة الأداء واعتماد الشواهد بدقة وسهولة.
          </p>

          <div className="flex justify-center gap-4 pt-4 flex-wrap">
            <Link href="/login" data-testid="link-get-started">
              <Button size="lg" className="shadow-lg bg-gradient-to-l from-blue-600 to-green-600 border-0" data-testid="button-get-started">
                ابدأ الآن <ArrowLeft className="mr-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
          variants={fadeIn}
          className="grid md:grid-cols-3 gap-8 mt-24"
        >
          <FeatureCard
            icon={<FileText className="h-8 w-8 text-blue-500" />}
            title="توثيق الشواهد"
            description="رفع وتنظيم الشواهد المنهجية وغير المنهجية وربطها بالمعايير الوزارية بضغطة زر."
            testId="feature-docs"
          />
          <FeatureCard
            icon={<CheckCircle className="h-8 w-8 text-green-500" />}
            title="الاعتماد الفوري"
            description="نظام إشعارات لحظي يتيح للمدير مراجعة واعتماد الملفات مع التغذية الراجعة."
            testId="feature-approval"
          />
          <FeatureCard
            icon={<BarChart3 className="h-8 w-8 text-purple-500" />}
            title="تقارير الأداء"
            description="لوحات معلومات تحليلية تظهر نسب الإنجاز وتدعم اتخاذ القرار التربوي."
            testId="feature-reports"
          />
        </motion.div>
      </main>

      <section className="relative z-10 py-16 bg-gray-50/80 dark:bg-slate-900/50 border-t border-b border-gray-200 dark:border-gray-800">
        <div className="container mx-auto px-6">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            variants={fadeIn}
          >
            <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-2" data-testid="text-how-title">
              كيف يعمل النظام؟
            </h2>
            <p className="text-center text-gray-500 dark:text-gray-400 mb-12 max-w-xl mx-auto">
              ثلاث خطوات بسيطة لتوثيق أدائك الوظيفي واعتماده
            </p>
          </motion.div>
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <StepCard
              number="1"
              icon={<BookOpen className="h-6 w-6" />}
              title="أضف المؤشرات"
              description="حدد أهداف الأداء والجدارات المهنية مع الأوزان والمعايير المطلوبة."
              testId="step-1"
            />
            <StepCard
              number="2"
              icon={<FileText className="h-6 w-6" />}
              title="ارفع الشواهد"
              description="أرفق الشواهد والأدلة مع اقتراحات ذكية من المعايير الوزارية."
              testId="step-2"
            />
            <StepCard
              number="3"
              icon={<Award className="h-6 w-6" />}
              title="احصل على الاعتماد"
              description="قدّم الميثاق للمدير للمراجعة والاعتماد واطبع النسخة الرسمية."
              testId="step-3"
            />
          </div>
        </div>
      </section>

      <section className="relative z-10 py-16">
        <div className="container mx-auto px-6">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            variants={fadeIn}
          >
            <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-2" data-testid="text-why-title">
              لماذا هذا النظام؟
            </h2>
            <p className="text-center text-gray-500 dark:text-gray-400 mb-12 max-w-xl mx-auto">
              مميزات مصممة خصيصاً لبيئة التعليم السعودية
            </p>
          </motion.div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            <MiniFeature
              icon={<ShieldCheck className="h-5 w-5 text-green-600" />}
              title="متوافق مع الوزارة"
              description="معايير ومؤشرات مطابقة لمتطلبات وزارة التعليم."
              testId="mini-moe"
            />
            <MiniFeature
              icon={<Zap className="h-5 w-5 text-amber-500" />}
              title="ضغط تلقائي للصور"
              description="ضغط الصور تلقائياً لتسريع الرفع وتوفير المساحة."
              testId="mini-compress"
            />
            <MiniFeature
              icon={<Users className="h-5 w-5 text-blue-500" />}
              title="أدوار متعددة"
              description="نظام صلاحيات للمعلمين والمديرين والمشرفين."
              testId="mini-roles"
            />
            <MiniFeature
              icon={<Lock className="h-5 w-5 text-red-500" />}
              title="حماية البيانات"
              description="عزل كامل لبيانات كل معلم مع تشفير آمن."
              testId="mini-security"
            />
            <MiniFeature
              icon={<Globe className="h-5 w-5 text-teal-500" />}
              title="واجهة عربية كاملة"
              description="تصميم RTL احترافي بخطوط عربية واضحة."
              testId="mini-rtl"
            />
            <MiniFeature
              icon={<BarChart3 className="h-5 w-5 text-purple-500" />}
              title="إحصائيات لحظية"
              description="تتبع نسب الإنجاز والتقدم بلوحات معلومات ذكية."
              testId="mini-stats"
            />
          </div>
        </div>
      </section>

      <section className="relative z-10 py-16 bg-gray-50/80 dark:bg-slate-900/50 border-t border-gray-200 dark:border-gray-800">
        <div className="container mx-auto px-6 text-center">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            variants={fadeIn}
            className="max-w-2xl mx-auto"
          >
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4" data-testid="text-cta-title">
              ابدأ توثيق أدائك الآن
            </h2>
            <p className="text-gray-500 dark:text-gray-400 mb-8">
              انضم للنظام وابدأ بإضافة مؤشراتك ورفع شواهدك للحصول على الاعتماد بسهولة.
            </p>
            <Link href="/login" data-testid="link-cta-start">
              <Button size="lg" className="shadow-lg bg-gradient-to-l from-blue-600 to-green-600 border-0" data-testid="button-cta-start">
                سجّل الآن مجاناً <ArrowLeft className="mr-2 h-5 w-5" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      <footer className="border-t py-8 text-center text-gray-500 dark:text-gray-400 text-sm bg-white/50 dark:bg-slate-950/50 relative z-10">
        <p data-testid="text-footer">جميع الحقوق محفوظة &copy; {new Date().getFullYear()} - نظام إدارة الأداء الوظيفي</p>
        <p className="text-xs mt-2 opacity-70">الصفحة من إعداد عبدالعزيز الخلفان</p>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description, testId }: { icon: React.ReactNode; title: string; description: string; testId: string }) {
  return (
    <Card className="border-none shadow-md bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm" data-testid={testId}>
      <CardContent className="pt-6 text-center space-y-4">
        <div className="h-16 w-16 bg-gray-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
          {icon}
        </div>
        <h3 className="text-xl font-bold text-gray-900 dark:text-white">{title}</h3>
        <p className="text-gray-500 dark:text-gray-400 leading-relaxed">{description}</p>
      </CardContent>
    </Card>
  );
}

function StepCard({ number, icon, title, description, testId }: { number: string; icon: React.ReactNode; title: string; description: string; testId: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay: Number(number) * 0.15 }}
      className="text-center"
      data-testid={testId}
    >
      <div className="relative mx-auto mb-4 w-14 h-14 rounded-full bg-gradient-to-bl from-blue-600 to-green-600 flex items-center justify-center text-white shadow-md">
        {icon}
        <span className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-white dark:bg-slate-800 text-xs font-bold flex items-center justify-center text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 shadow-sm">
          {number}
        </span>
      </div>
      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{title}</h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed max-w-xs mx-auto">{description}</p>
    </motion.div>
  );
}

function MiniFeature({ icon, title, description, testId }: { icon: React.ReactNode; title: string; description: string; testId: string }) {
  return (
    <div className="flex items-start gap-3 p-4 rounded-lg" data-testid={testId}>
      <div className="h-10 w-10 rounded-lg bg-gray-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0">
        {icon}
      </div>
      <div>
        <h4 className="font-bold text-gray-900 dark:text-white text-sm mb-1">{title}</h4>
        <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{description}</p>
      </div>
    </div>
  );
}
