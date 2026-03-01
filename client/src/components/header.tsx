import { Card } from "@/components/ui/card";
import type { DashboardStats, User } from "@shared/schema";
import { 
  BookOpen, 
  RefreshCw, 
  Target, 
  CheckCircle2 
} from "lucide-react";
import { NotificationsPopover } from "./notifications-popover";
import { ThemeToggle } from "./theme-toggle";

interface HeaderProps {
  stats: DashboardStats;
  user?: User;
}

export function Header({ stats, user }: HeaderProps) {
  const principalName = user?.firstName && user?.lastName 
    ? `${user.firstName} ${user.lastName}`
    : "غير محدد";
    
  const schoolName = user?.schoolName || "غير محدد";

  return (
    <Card className="p-6 border-r-4 border-r-primary shadow-sm" data-testid="header-section">
      <div className="flex justify-end gap-2 mb-4 no-print">
        <NotificationsPopover />
        <ThemeToggle />
      </div>
      <div className="text-center">
        <h1 className="text-2xl md:text-3xl font-bold text-primary mb-2" data-testid="text-school-title">
          {schoolName}
        </h1>
        <h2 className="text-lg md:text-xl font-medium text-accent mb-6" data-testid="text-page-title">
          توثيق شواهد الأداء الوظيفي
        </h2>
        
        <div className="p-4 bg-muted rounded-lg mb-6">
          <div className="text-center p-3" data-testid="text-principal-info">
            <span className="font-bold text-foreground">مدير المدرسة:</span>
            <span className="text-muted-foreground mr-2">{principalName}</span>
          </div>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard 
            icon={<BookOpen className="h-6 w-6" />}
            value={stats.totalCapabilities} 
            label="إجمالي القدرات" 
            testId="stat-capabilities"
          />
          <StatCard 
            icon={<RefreshCw className="h-6 w-6" />}
            value={stats.totalChanges} 
            label="إجمالي التغيرات" 
            testId="stat-changes"
          />
          <StatCard 
            icon={<Target className="h-6 w-6" />}
            value={stats.totalIndicators} 
            label="المؤشرات المهنية" 
            testId="stat-indicators"
          />
          <StatCard 
            icon={<CheckCircle2 className="h-6 w-6" />}
            value={stats.completedIndicators} 
            label="المؤشرات المكتملة" 
            testId="stat-completed"
          />
        </div>
      </div>
    </Card>
  );
}

interface StatCardProps {
  icon: React.ReactNode;
  value: number;
  label: string;
  testId: string;
}

function StatCard({ icon, value, label, testId }: StatCardProps) {
  return (
    <div 
      className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground p-5 rounded-lg text-center shadow-sm"
      data-testid={testId}
    >
      <div className="flex justify-center mb-2 opacity-90">
        {icon}
      </div>
      <div className="text-3xl md:text-4xl font-bold mb-1" data-testid={`${testId}-value`}>
        {value}
      </div>
      <div className="text-sm opacity-90" data-testid={`${testId}-label`}>
        {label}
      </div>
    </div>
  );
}
