import { 
  Briefcase, Users, UserCheck, Lightbulb, TrendingUp, 
  Calendar, Monitor, Home, UserCog, BarChart, CheckCircle,
  type LucideIcon
} from "lucide-react";

const ICON_MAP: Record<string, LucideIcon> = {
  Briefcase, Users, UserCheck, Lightbulb, TrendingUp,
  Calendar, Monitor, Home, UserCog, BarChart, CheckCircle,
};

export type PerformanceStandardUI = {
  id: number;
  title: string;
  weight: string;
  icon: LucideIcon;
  description: string;
  suggestedEvidence: string[];
};

export const PERFORMANCE_STANDARDS_FALLBACK: PerformanceStandardUI[] = [
  {
    id: 1,
    title: "أداء الواجبات الوظيفية",
    weight: "10%",
    icon: Briefcase,
    description: "الالتزام بالدوام الرسمي، الحصص، المناوبة، والإشراف.",
    suggestedEvidence: [
      "سجل الدوام الرسمي (حضور وانصراف)",
      "سجل المناوبة والإشراف اليومي",
      "سجل حصص الانتظار",
      "خطة توزيع المنهج المعتمدة"
    ]
  },
  {
    id: 2,
    title: "التفاعل مع المجتمع المهني",
    weight: "10%",
    icon: Users,
    description: "المشاركة في مجتمعات التعلم، الدورات، والزيارات المتبادلة.",
    suggestedEvidence: [
      "سجل لقاءات مجتمعات التعلم المهنية",
      "استمارة تبادل زيارات صفية",
      "شهادات حضور دورات تدريبية",
      "تقرير تنفيذ درس تطبيقي"
    ]
  },
  {
    id: 3,
    title: "التفاعل مع أولياء الأمور",
    weight: "10%",
    icon: UserCheck,
    description: "التواصل الفعال مع الأسرة وإشراكهم في تعلم الطالب.",
    suggestedEvidence: [
      "سجل التواصل مع أولياء الأمور",
      "محاضر اجتماعات الجمعية العمومية",
      "نماذج إشعارات مستوى الطلاب المرسلة",
      "صورة من تفعيل الخطة الأسبوعية"
    ]
  },
  {
    id: 4,
    title: "التنويع في استراتيجيات التدريس",
    weight: "10%",
    icon: Lightbulb,
    description: "استخدام طرق تدريس متنوعة تراعي الفروق الفردية.",
    suggestedEvidence: [
      "تقرير عن استراتيجيات التدريس المطبقة",
      "صور من تنفيذ الدروس (التعلم النشط)",
      "ملف معالجة الفروق الفردية",
      "نماذج من تخطيط الدروس المتمايزة"
    ]
  },
  {
    id: 5,
    title: "تحسين نتائج المتعلمين",
    weight: "10%",
    icon: TrendingUp,
    description: "رفع مستوى التحصيل الدراسي ومعالجة الفاقد التعليمي.",
    suggestedEvidence: [
      "نتائج الاختبارات القبلية والبعدية",
      "سجل الخطط العلاجية للطلاب المتعثرين",
      "سجل الخطط الإثرائية للموهوبين",
      "شواهد تكريم الطلاب المتميزين"
    ]
  },
  {
    id: 6,
    title: "إعداد وتنفيذ خطة التعلم",
    weight: "10%",
    icon: Calendar,
    description: "التخطيط المتقن للدروس والواجبات والاختبارات.",
    suggestedEvidence: [
      "سجل إعداد الدروس (تحضير)",
      "نماذج من الواجبات المنزلية المصححة",
      "نماذج من الاختبارات القصيرة",
      "تقرير تنفيذ المنهج الدراسي"
    ]
  },
  {
    id: 7,
    title: "توظيف تقنيات التعلم",
    weight: "10%",
    icon: Monitor,
    description: "دمج التقنية والوسائل التعليمية في العملية التربوية.",
    suggestedEvidence: [
      "صور استخدام الوسائل التعليمية بالفصل",
      "روابط دروس تفاعلية أو إثرائية",
      "تقرير استخدام المنصات التعليمية",
      "نماذج من إنتاج محتوى رقمي"
    ]
  },
  {
    id: 8,
    title: "تهيئة البيئة التعليمية",
    weight: "5%",
    icon: Home,
    description: "توفير بيئة صفية محفزة وآمنة نفسياً ومادياً.",
    suggestedEvidence: [
      "صور من تنظيم البيئة الصفية",
      "تقرير عن الحوافز والتعزيز المقدم للطلاب",
      "قوائم تصنيف الطلاب حسب أنماط التعلم"
    ]
  },
  {
    id: 9,
    title: "الإدارة الصفية",
    weight: "5%",
    icon: UserCog,
    description: "ضبط السلوك الصفي واستثمار وقت التعلم بفاعلية.",
    suggestedEvidence: [
      "سجل متابعة حضور وغياب الطلاب",
      "قواعد السلوك والمواظبة الصفية",
      "كشف رصد المخالفات السلوكية والإجراءات"
    ]
  },
  {
    id: 10,
    title: "تحليل نتائج المتعلمين",
    weight: "10%",
    icon: BarChart,
    description: "تشخيص واقع التحصيل الدراسي وتحديد نقاط القوة والضعف.",
    suggestedEvidence: [
      "تقرير التحليل الإحصائي لنتائج الاختبارات",
      "بيان تصنيف الطلاب حسب المستويات",
      "تقرير دراسة الفاقد التعليمي"
    ]
  },
  {
    id: 11,
    title: "تنوع أساليب التقويم",
    weight: "10%",
    icon: CheckCircle,
    description: "استخدام أدوات قياس متنوعة وشاملة.",
    suggestedEvidence: [
      "نماذج اختبارات (ورقية/إلكترونية)",
      "سلالم تقدير للمشاريع والمهام الأدائية",
      "ملفات إنجاز الطلاب (عينات)",
      "بنك أسئلة متنوع المستويات"
    ]
  }
];

export const PERFORMANCE_STANDARDS = PERFORMANCE_STANDARDS_FALLBACK;

export function mapDbStandardToUI(dbStandard: { id: number; title: string; weight: string; icon: string; description: string; suggestedEvidence: string[] }): PerformanceStandardUI {
  return {
    ...dbStandard,
    icon: ICON_MAP[dbStandard.icon] || Briefcase,
  };
}

export function getIconComponent(iconName: string): LucideIcon {
  return ICON_MAP[iconName] || Briefcase;
}
