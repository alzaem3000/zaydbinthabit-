import { useQuery } from "@tanstack/react-query";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Target, Clock, CheckCircle2, XCircle } from "lucide-react";
import type { PrincipalDashboardStats, TeacherWithStats } from "@shared/schema";

interface PrincipalAnalyticsProps {
  stats: PrincipalDashboardStats;
  teachers: TeacherWithStats[];
}

export function PrincipalAnalytics({ stats, teachers }: PrincipalAnalyticsProps) {
  const activeTeachers = teachers.filter(t => t.indicatorCount > 0).length;
  const inactiveTeachers = teachers.length - activeTeachers;

  const chartData = [
    { name: "معلمون فاعلون", value: activeTeachers, color: "hsl(var(--primary))" },
    { name: "معلمون غير فاعلين", value: inactiveTeachers, color: "hsl(var(--muted))" },
  ];

  const statusData = [
    { name: "مكتملة", value: stats.approvedIndicators, color: "#10b981" },
    { name: "قيد الانتظار", value: stats.pendingApprovals, color: "#f59e0b" },
    { name: "مرفوضة", value: stats.rejectedIndicators, color: "#ef4444" },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard 
          title="إجمالي المعلمين" 
          value={stats.totalTeachers} 
          icon={<Users className="h-5 w-5 text-blue-500" />} 
        />
        <SummaryCard 
          title="إجمالي المؤشرات" 
          value={stats.totalIndicators} 
          icon={<Target className="h-5 w-5 text-primary" />} 
        />
        <SummaryCard 
          title="بانتظار الاعتماد" 
          value={stats.pendingApprovals} 
          icon={<Clock className="h-5 w-5 text-yellow-500" />} 
        />
        <SummaryCard 
          title="مؤشرات معتمدة" 
          value={stats.approvedIndicators} 
          icon={<CheckCircle2 className="h-5 w-5 text-green-500" />} 
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">تفاعل المعلمين</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">حالات المؤشرات</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function SummaryCard({ title, value, icon }: { title: string; value: number; icon: React.ReactNode }) {
  return (
    <Card>
      <CardContent className="p-6 flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold mt-1">{value}</p>
        </div>
        <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
          {icon}
        </div>
      </CardContent>
    </Card>
  );
}
