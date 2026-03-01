import { db } from "../server/db";
import { performanceStandards } from "../shared/schema";
import { sql } from "drizzle-orm";

const STANDARDS_DATA = [
  {
    title: "أداء الواجبات الوظيفية",
    weight: "10%",
    icon: "Briefcase",
    description: "الالتزام بالدوام الرسمي، الحصص، المناوبة، والإشراف.",
    suggestedEvidence: [
      "سجل الدوام الرسمي (حضور وانصراف)",
      "سجل المناوبة والإشراف اليومي",
      "سجل حصص الانتظار",
      "خطة توزيع المنهج المعتمدة"
    ],
    order: 1,
  },
  {
    title: "التفاعل مع المجتمع المهني",
    weight: "10%",
    icon: "Users",
    description: "المشاركة في مجتمعات التعلم، الدورات، والزيارات المتبادلة.",
    suggestedEvidence: [
      "سجل لقاءات مجتمعات التعلم المهنية",
      "استمارة تبادل زيارات صفية",
      "شهادات حضور دورات تدريبية",
      "تقرير تنفيذ درس تطبيقي"
    ],
    order: 2,
  },
  {
    title: "التفاعل مع أولياء الأمور",
    weight: "10%",
    icon: "UserCheck",
    description: "التواصل الفعال مع الأسرة وإشراكهم في تعلم الطالب.",
    suggestedEvidence: [
      "سجل التواصل مع أولياء الأمور",
      "محاضر اجتماعات الجمعية العمومية",
      "نماذج إشعارات مستوى الطلاب المرسلة",
      "صورة من تفعيل الخطة الأسبوعية"
    ],
    order: 3,
  },
  {
    title: "التنويع في استراتيجيات التدريس",
    weight: "10%",
    icon: "Lightbulb",
    description: "استخدام طرق تدريس متنوعة تراعي الفروق الفردية.",
    suggestedEvidence: [
      "تقرير عن استراتيجيات التدريس المطبقة",
      "صور من تنفيذ الدروس (التعلم النشط)",
      "ملف معالجة الفروق الفردية",
      "نماذج من تخطيط الدروس المتمايزة"
    ],
    order: 4,
  },
  {
    title: "تحسين نتائج المتعلمين",
    weight: "10%",
    icon: "TrendingUp",
    description: "رفع مستوى التحصيل الدراسي ومعالجة الفاقد التعليمي.",
    suggestedEvidence: [
      "نتائج الاختبارات القبلية والبعدية",
      "سجل الخطط العلاجية للطلاب المتعثرين",
      "سجل الخطط الإثرائية للموهوبين",
      "شواهد تكريم الطلاب المتميزين"
    ],
    order: 5,
  },
  {
    title: "إعداد وتنفيذ خطة التعلم",
    weight: "10%",
    icon: "Calendar",
    description: "التخطيط المتقن للدروس والواجبات والاختبارات.",
    suggestedEvidence: [
      "سجل إعداد الدروس (تحضير)",
      "نماذج من الواجبات المنزلية المصححة",
      "نماذج من الاختبارات القصيرة",
      "تقرير تنفيذ المنهج الدراسي"
    ],
    order: 6,
  },
  {
    title: "توظيف تقنيات التعلم",
    weight: "10%",
    icon: "Monitor",
    description: "دمج التقنية والوسائل التعليمية في العملية التربوية.",
    suggestedEvidence: [
      "صور استخدام الوسائل التعليمية بالفصل",
      "روابط دروس تفاعلية أو إثرائية",
      "تقرير استخدام المنصات التعليمية",
      "نماذج من إنتاج محتوى رقمي"
    ],
    order: 7,
  },
  {
    title: "تهيئة البيئة التعليمية",
    weight: "5%",
    icon: "Home",
    description: "توفير بيئة صفية محفزة وآمنة نفسياً ومادياً.",
    suggestedEvidence: [
      "صور من تنظيم البيئة الصفية",
      "تقرير عن الحوافز والتعزيز المقدم للطلاب",
      "قوائم تصنيف الطلاب حسب أنماط التعلم"
    ],
    order: 8,
  },
  {
    title: "الإدارة الصفية",
    weight: "5%",
    icon: "UserCog",
    description: "ضبط السلوك الصفي واستثمار وقت التعلم بفاعلية.",
    suggestedEvidence: [
      "سجل متابعة حضور وغياب الطلاب",
      "قواعد السلوك والمواظبة الصفية",
      "كشف رصد المخالفات السلوكية والإجراءات"
    ],
    order: 9,
  },
  {
    title: "تحليل نتائج المتعلمين",
    weight: "10%",
    icon: "BarChart",
    description: "تشخيص واقع التحصيل الدراسي وتحديد نقاط القوة والضعف.",
    suggestedEvidence: [
      "تقرير التحليل الإحصائي لنتائج الاختبارات",
      "بيان تصنيف الطلاب حسب المستويات",
      "تقرير دراسة الفاقد التعليمي"
    ],
    order: 10,
  },
  {
    title: "تنوع أساليب التقويم",
    weight: "10%",
    icon: "CheckCircle",
    description: "استخدام أدوات قياس متنوعة وشاملة.",
    suggestedEvidence: [
      "نماذج اختبارات (ورقية/إلكترونية)",
      "سلالم تقدير للمشاريع والمهام الأدائية",
      "ملفات إنجاز الطلاب (عينات)",
      "بنك أسئلة متنوع المستويات"
    ],
    order: 11,
  },
];

async function seedStandards() {
  console.log("Seeding performance standards...");
  
  await db.delete(performanceStandards);
  
  for (const standard of STANDARDS_DATA) {
    await db.insert(performanceStandards).values(standard);
  }
  
  console.log(`Seeded ${STANDARDS_DATA.length} performance standards successfully.`);
  process.exit(0);
}

seedStandards().catch((err) => {
  console.error("Error seeding standards:", err);
  process.exit(1);
});
