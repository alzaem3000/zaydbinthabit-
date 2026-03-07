import pg from 'pg';
const { Client } = pg;

const client = new Client({
    connectionString: 'postgresql://neondb_owner:npg_Cinp6Qm7ePZS@ep-curly-poetry-ai1sga58-pooler.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require',
    ssl: { rejectUnauthorized: false }
});

const standards = [
    { id: 1, title: "أداء الواجبات الوظيفية", weight: "10", description: "الالتزام بالحضور والانصراف وأداء المهام الموكلة", icon: "Briefcase", order: 1, suggestedEvidence: ["كشوف الحضور والانصراف", "محاضر الاجتماعات", "خطابات الشكر"] },
    { id: 2, title: "التفاعل مع المجتمع المهني", weight: "10", description: "المشاركة في الأنشطة والبرامج المهنية", icon: "Users", order: 2, suggestedEvidence: ["شهادات حضور ورش العمل", "شهادات المشاركة في المؤتمرات", "إفادات المشاركة المجتمعية"] },
    { id: 3, title: "ممارسة التعلم والتطوير المهني", weight: "10", description: "السعي لتطوير الذات مهنياً", icon: "GraduationCap", order: 3, suggestedEvidence: ["شهادات الدورات التدريبية", "سجل التطوير المهني", "شهادات التعلم الذاتي"] },
    { id: 4, title: "تحليل نتائج الطلاب", weight: "10", description: "تحليل نتائج الطلاب واستخدامها لتحسين الأداء", icon: "BarChart3", order: 4, suggestedEvidence: ["تقارير تحليل النتائج", "خطط التحسين", "رسوم بيانية للمقارنة"] },
    { id: 5, title: "التخطيط للدروس", weight: "10", description: "إعداد خطط الدروس وفق المناهج المعتمدة", icon: "ClipboardList", order: 5, suggestedEvidence: ["دفتر تحضير الدروس", "خطط الوحدات", "التوزيع الزمني للمنهج"] },
    { id: 6, title: "تنفيذ الدروس", weight: "10", description: "تطبيق استراتيجيات التدريس الفعالة", icon: "Presentation", order: 6, suggestedEvidence: ["تقارير الزيارات الصفية", "صور من الحصص", "تسجيلات الدروس"] },
    { id: 7, title: "تقويم الطلاب", weight: "10", description: "استخدام أساليب تقويم متنوعة", icon: "Award", order: 7, suggestedEvidence: ["نماذج اختبارات", "سجلات التقويم المستمر", "ملفات إنجاز الطلاب"] },
    { id: 8, title: "إدارة الصف", weight: "5", description: "تهيئة بيئة تعليمية آمنة ومحفزة", icon: "Layout", order: 8, suggestedEvidence: ["خطة إدارة الصف", "صور البيئة الصفية", "سجل السلوك"] },
    { id: 9, title: "استخدام التقنية", weight: "5", description: "توظيف التقنية في العملية التعليمية", icon: "Monitor", order: 9, suggestedEvidence: ["دروس تفاعلية", "منصات تعليمية", "تطبيقات تعليمية"] },
    { id: 10, title: "دعم الطلاب", weight: "10", description: "تقديم الدعم والمساندة للطلاب", icon: "Heart", order: 10, suggestedEvidence: ["برامج علاجية", "سجلات المتابعة", "خطط رعاية الموهوبين"] },
    { id: 11, title: "الأنشطة اللاصفية", weight: "10", description: "المشاركة في الأنشطة المدرسية اللاصفية", icon: "Trophy", order: 11, suggestedEvidence: ["صور الأنشطة", "شهادات المشاركة", "تقارير الأنشطة"] },
];

async function main() {
    await client.connect();
    console.log('Connected to Neon ✓');

    // Check current state
    const existing = await client.query('SELECT count(*) FROM performance_standards');
    console.log(`Current standards count: ${existing.rows[0].count}`);

    for (const s of standards) {
        await client.query(`
            INSERT INTO performance_standards (id, title, weight, description, icon, "order", suggested_evidence)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            ON CONFLICT (id) DO UPDATE SET
                title = EXCLUDED.title,
                weight = EXCLUDED.weight,
                description = EXCLUDED.description,
                icon = EXCLUDED.icon,
                "order" = EXCLUDED."order",
                suggested_evidence = EXCLUDED.suggested_evidence
        `, [s.id, s.title, s.weight, s.description, s.icon, s.order, JSON.stringify(s.suggestedEvidence)]);
        console.log(`  ✓ Standard ${s.id}: ${s.title}`);
    }

    // Verify
    const verify = await client.query('SELECT id, title FROM performance_standards ORDER BY id');
    console.log(`\nTotal standards in DB: ${verify.rows.length}`);
    verify.rows.forEach(r => console.log(`  ${r.id}. ${r.title}`));

    await client.end();
    console.log('\nDone! ✓');
}

main().catch(err => { console.error(err); process.exit(1); });
