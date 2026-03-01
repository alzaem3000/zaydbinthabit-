import { forwardRef } from "react";
import { type User, type IndicatorWithCriteria } from "@shared/schema";

interface PrintableCharterProps {
  user: User;
  goals: IndicatorWithCriteria[];
  competencies: IndicatorWithCriteria[];
}

const domainLabels: Record<string, string> = {
  values: "القيم والمسؤوليات المهنية",
  knowledge: "المعرفة المهنية",
  practice: "الممارسة المهنية",
};

function getStatusLabel(status: string) {
  switch (status) {
    case "completed": return "مكتمل";
    case "in_progress": return "قيد التنفيذ";
    default: return "معلق";
  }
}

function getStatusStyle(status: string) {
  switch (status) {
    case "completed": return { backgroundColor: "#dcfce7", color: "#166534" };
    case "in_progress": return { backgroundColor: "#fef3c7", color: "#92400e" };
    default: return { backgroundColor: "#f3f4f6", color: "#6b7280" };
  }
}

export const PrintableCharter = forwardRef<HTMLDivElement, PrintableCharterProps>(
  ({ user, goals, competencies }, ref) => {
    const today = new Date();

    let hijriDate = "";
    try {
      hijriDate = new Intl.DateTimeFormat("ar-SA-u-ca-islamic", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }).format(today);
    } catch {
      hijriDate = "";
    }

    const gregorianDate = new Intl.DateTimeFormat("ar-SA", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(today);

    const totalGoalWeight = goals.reduce((sum, g) => sum + (g.weight || 0), 0);
    const totalCompetencyWeight = competencies.reduce((sum, c) => sum + (c.weight || 0), 0);

    return (
      <div
        ref={ref}
        dir="rtl"
        className="bg-white text-black p-6 text-sm leading-relaxed"
        style={{ fontFamily: "Cairo, Tajawal, sans-serif", direction: "rtl" }}
        data-testid="printable-charter"
      >
        <div className="border-2 border-gray-700 rounded overflow-hidden">
          <div
            className="text-white text-center py-4 px-6"
            style={{ backgroundColor: "#006C35" }}
          >
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="text-xs text-right leading-relaxed">
                <p className="font-bold">المملكة العربية السعودية</p>
                <p>وزارة التعليم</p>
                {user.educationDepartment && <p>{user.educationDepartment}</p>}
                {user.schoolName && <p>{user.schoolName}</p>}
              </div>
              <div className="text-center flex-1">
                <h1 className="text-xl font-bold mb-1">ميثاق الأداء الوظيفي</h1>
                <p className="text-xs opacity-90">لشاغلي الوظائف التعليمية</p>
              </div>
              <div className="text-xs text-left leading-relaxed">
                {hijriDate && <p>التاريخ: {hijriDate}</p>}
                <p>الموافق: {gregorianDate}</p>
              </div>
            </div>
          </div>

          <div className="p-4">
            <h2
              className="text-center font-bold text-base mb-3"
              style={{ color: "#006C35" }}
              data-testid="text-charter-teacher-info-title"
            >
              بيانات المعلم / المعلمة
            </h2>
            <div className="grid grid-cols-2 gap-x-6 gap-y-2 border border-gray-300 rounded p-3 text-xs" data-testid="charter-teacher-info">
              <InfoRow label="الاسم الرباعي" value={user.fullNameArabic || user.firstName || "---"} testId="text-charter-name" />
              <InfoRow label="الرقم الوظيفي" value={user.jobNumber || "---"} testId="text-charter-job" />
              <InfoRow label="التخصص" value={user.specialization || "---"} testId="text-charter-spec" />
              <InfoRow label="المستوى التعليمي" value={user.educationalLevel || "---"} testId="text-charter-level" />
              <InfoRow label="المادة" value={user.subject || "---"} testId="text-charter-subject" />
              <InfoRow label="رقم الجوال" value={user.mobileNumber || "---"} testId="text-charter-mobile" />
              <InfoRow label="المدرسة" value={user.schoolName || "---"} testId="text-charter-school" />
              <InfoRow label="إدارة التعليم" value={user.educationDepartment || "---"} testId="text-charter-dept" />
            </div>
          </div>

          <div className="px-4 pb-4" data-testid="charter-goals-section">
            <h3
              className="text-base font-bold p-2 border border-gray-300 mb-0 rounded-t flex items-center gap-2"
              style={{ backgroundColor: "#e8f5e9", color: "#006C35" }}
            >
              <span
                className="inline-block w-3 h-3 rounded-full"
                style={{ backgroundColor: "#006C35" }}
              ></span>
              أولاً: أهداف الأداء الوظيفي
              <span className="text-xs font-normal text-gray-500 mr-auto">
                الوزن الكلي: {totalGoalWeight}%
              </span>
            </h3>
            <table className="w-full border-collapse border border-gray-300 text-xs">
              <thead>
                <tr style={{ backgroundColor: "#006C35", color: "white" }}>
                  <th className="border border-gray-300 p-2 w-8">م</th>
                  <th className="border border-gray-300 p-2">الهدف</th>
                  <th className="border border-gray-300 p-2 w-16">الوزن</th>
                  <th className="border border-gray-300 p-2">المخرج المستهدف</th>
                  <th className="border border-gray-300 p-2">نتاجات الأداء (المعايير)</th>
                  <th className="border border-gray-300 p-2 w-16">الحالة</th>
                </tr>
              </thead>
              <tbody>
                {goals.length > 0 ? goals.map((goal, idx) => (
                  <tr key={goal.id} className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                    <td className="border border-gray-300 p-2 text-center font-bold">{idx + 1}</td>
                    <td className="border border-gray-300 p-2">
                      <p className="font-semibold">{goal.title}</p>
                      {goal.description && (
                        <p className="text-gray-500 mt-0.5 text-[10px]">{goal.description}</p>
                      )}
                    </td>
                    <td className="border border-gray-300 p-2 text-center font-bold">{goal.weight}%</td>
                    <td className="border border-gray-300 p-2">{goal.targetOutput || "---"}</td>
                    <td className="border border-gray-300 p-2">
                      {goal.criteria && goal.criteria.length > 0 ? (
                        <ul className="list-none space-y-0.5">
                          {goal.criteria.map((c) => (
                            <li key={c.id} className="flex items-center gap-1">
                              <span style={{ color: c.isCompleted ? "#166534" : "#9ca3af" }}>
                                {c.isCompleted ? "[✓]" : "[ ]"}
                              </span>
                              <span className={c.isCompleted ? "" : "text-gray-500"}>{c.title}</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <span className="text-gray-400">---</span>
                      )}
                    </td>
                    <td className="border border-gray-300 p-2 text-center">
                      <span
                        className="inline-block px-2 py-0.5 rounded text-[10px] font-bold"
                        style={getStatusStyle(goal.status || "pending")}
                      >
                        {getStatusLabel(goal.status || "pending")}
                      </span>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={6} className="border border-gray-300 p-4 text-center text-gray-400">
                      لا توجد أهداف مدخلة
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="px-4 pb-4" data-testid="charter-competencies-section">
            <h3
              className="text-base font-bold p-2 border border-gray-300 mb-0 rounded-t flex items-center gap-2"
              style={{ backgroundColor: "#e3f2fd", color: "#1a5276" }}
            >
              <span
                className="inline-block w-3 h-3 rounded-full"
                style={{ backgroundColor: "#1a5276" }}
              ></span>
              ثانياً: الجدارات المهنية
              <span className="text-xs font-normal text-gray-500 mr-auto">
                الوزن الكلي: {totalCompetencyWeight}%
              </span>
            </h3>
            <table className="w-full border-collapse border border-gray-300 text-xs">
              <thead>
                <tr style={{ backgroundColor: "#1a5276", color: "white" }}>
                  <th className="border border-gray-300 p-2 w-8">م</th>
                  <th className="border border-gray-300 p-2">الجدارة</th>
                  <th className="border border-gray-300 p-2 w-16">الوزن</th>
                  <th className="border border-gray-300 p-2">المجال</th>
                  <th className="border border-gray-300 p-2">نتاجات الأداء (المعايير)</th>
                  <th className="border border-gray-300 p-2 w-16">الحالة</th>
                </tr>
              </thead>
              <tbody>
                {competencies.length > 0 ? competencies.map((comp, idx) => (
                  <tr key={comp.id} className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                    <td className="border border-gray-300 p-2 text-center font-bold">{idx + 1}</td>
                    <td className="border border-gray-300 p-2">
                      <p className="font-semibold">{comp.title}</p>
                      {comp.description && (
                        <p className="text-gray-500 mt-0.5 text-[10px]">{comp.description}</p>
                      )}
                    </td>
                    <td className="border border-gray-300 p-2 text-center font-bold">{comp.weight}%</td>
                    <td className="border border-gray-300 p-2 text-center">
                      {comp.domain ? domainLabels[comp.domain] || comp.domain : "عام"}
                    </td>
                    <td className="border border-gray-300 p-2">
                      {comp.criteria && comp.criteria.length > 0 ? (
                        <ul className="list-none space-y-0.5">
                          {comp.criteria.map((c) => (
                            <li key={c.id} className="flex items-center gap-1">
                              <span style={{ color: c.isCompleted ? "#166534" : "#9ca3af" }}>
                                {c.isCompleted ? "[✓]" : "[ ]"}
                              </span>
                              <span className={c.isCompleted ? "" : "text-gray-500"}>{c.title}</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <span className="text-gray-400">---</span>
                      )}
                    </td>
                    <td className="border border-gray-300 p-2 text-center">
                      <span
                        className="inline-block px-2 py-0.5 rounded text-[10px] font-bold"
                        style={getStatusStyle(comp.status || "pending")}
                      >
                        {getStatusLabel(comp.status || "pending")}
                      </span>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={6} className="border border-gray-300 p-4 text-center text-gray-400">
                      لا توجد جدارات مدخلة
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="px-4 pb-4">
            <div className="grid grid-cols-3 gap-4 mt-4 border-t border-gray-300 pt-6">
              <SignatureBlock label="توقيع المعلم/ـة" name={user.fullNameArabic || "---"} />
              <SignatureBlock label="توقيع المدير المباشر" name={user.principalName || ""} />
              <SignatureBlock label="الاعتماد (المشرف التربوي)" name="" />
            </div>
          </div>

          <div
            className="text-center py-2 text-xs border-t border-gray-300"
            style={{ backgroundColor: "#f9fafb", color: "#6b7280" }}
          >
            <p>تم إعداد هذا الميثاق إلكترونياً عبر نظام ميثاق الأداء الوظيفي</p>
            <p className="mt-0.5" style={{ fontSize: "10px" }}>الصفحة من إعداد عبدالعزيز الخلفان</p>
          </div>
        </div>
      </div>
    );
  }
);

PrintableCharter.displayName = "PrintableCharter";

function InfoRow({ label, value, testId }: { label: string; value: string; testId?: string }) {
  return (
    <div className="flex gap-2" data-testid={testId}>
      <span className="font-bold text-gray-700 min-w-[90px]">{label}:</span>
      <span className="text-gray-900">{value}</span>
    </div>
  );
}

function SignatureBlock({ label, name }: { label: string; name: string }) {
  return (
    <div className="text-center text-xs">
      <p className="font-bold text-gray-700 mb-8">{label}</p>
      <div className="border-b border-gray-400 mx-4 mb-1"></div>
      {name && <p className="text-gray-600">{name}</p>}
      <p className="text-gray-400 mt-2">التاريخ: ___/___/______</p>
    </div>
  );
}
