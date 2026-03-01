import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import type { User } from "@shared/schema";
import { useAuth } from "@/hooks/useAuth";
import {
  FileText,
  Download,
  Upload,
  RefreshCw,
  LogOut,
  Edit,
  User as UserIcon
} from "lucide-react";

interface SidebarProfileProps {
  user?: User;
  onEditProfile?: () => void;
  onPrintReport?: () => void;
  onExportData?: () => void;
  onImportData?: () => void;
  onReEvaluate?: () => void;
  isAuthenticated?: boolean;
}

export function SidebarProfile({
  user,
  onEditProfile,
  onPrintReport,
  onExportData,
  onImportData,
  onReEvaluate,
  isAuthenticated
}: SidebarProfileProps) {
  const { logoutMutation } = useAuth();
  const displayName = user?.firstName && user?.lastName
    ? `الأستاذ / ${user.firstName} ${user.lastName}`
    : "غير محدد";

  const schoolName = user?.schoolName || "غير محدد";
  const department = user?.educationDepartment || "غير محدد";
  const email = user?.email || user?.contactEmail || "غير محدد";
  const yearsOfService = user?.yearsOfService || 0;

  const initials = user?.firstName && user?.lastName
    ? `${user.firstName[0]}${user.lastName[0]}`
    : "؟";

  return (
    <Card className="p-6 shadow-sm h-fit sticky top-4" data-testid="sidebar-profile">
      <div className="text-center mb-6">
        <Avatar className="w-20 h-20 mx-auto mb-4 border-3 border-primary">
          <AvatarImage src={user?.profileImageUrl || undefined} alt={displayName} />
          <AvatarFallback className="bg-secondary text-primary text-xl font-bold">
            {initials}
          </AvatarFallback>
        </Avatar>
        <h3 className="font-bold text-lg text-foreground" data-testid="text-profile-title">
          بيانات مدير المدرسة
        </h3>
      </div>

      <div className="space-y-4">
        <InfoGroup label="الإسم" value={displayName} testId="info-name" />
        <InfoGroup label="المدرسة" value={schoolName} testId="info-school" />
        <InfoGroup label="إدارة التعليم" value={department} testId="info-department" />
        <InfoGroup label="وسيلة التواصل" value={email} testId="info-email" />
        <InfoGroup label="سنة الخدمة" value={`${yearsOfService} سنة`} testId="info-years" />
      </div>

      <Separator className="my-6" />

      <div className="grid grid-cols-1 gap-3">
        <ActionButton
          icon={<Edit className="h-4 w-4" />}
          label="تحرير البيانات"
          onClick={onEditProfile}
          testId="button-edit-profile"
        />
        <ActionButton
          icon={<FileText className="h-4 w-4" />}
          label="طباعة التقرير"
          onClick={onPrintReport}
          testId="button-print-report"
        />
        <ActionButton
          icon={<Download className="h-4 w-4" />}
          label="تصدير البيانات"
          onClick={onExportData}
          testId="button-export-data"
        />
        <ActionButton
          icon={<Upload className="h-4 w-4" />}
          label="استيراد البيانات"
          onClick={onImportData}
          testId="button-import-data"
        />
        <ActionButton
          icon={<RefreshCw className="h-4 w-4" />}
          label="إعادة تحقيق"
          onClick={onReEvaluate}
          testId="button-re-evaluate"
        />
      </div>

      {isAuthenticated && (
        <>
          <Separator className="my-6" />
          <Button
            variant="outline"
            className="w-full gap-2"
            data-testid="button-logout"
            onClick={() => logoutMutation.mutate()}
            disabled={logoutMutation.isPending}
          >
            <LogOut className="h-4 w-4" />
            {logoutMutation.isPending ? "جاري الخروج..." : "تسجيل الخروج"}
          </Button>
        </>
      )}
    </Card>
  );
}

interface InfoGroupProps {
  label: string;
  value: string;
  testId: string;
}

function InfoGroup({ label, value, testId }: InfoGroupProps) {
  return (
    <div className="pb-4 border-b border-border last:border-b-0 last:pb-0" data-testid={testId}>
      <div className="text-sm font-bold text-primary mb-1">{label}</div>
      <div className="text-muted-foreground">{value}</div>
    </div>
  );
}

interface ActionButtonProps {
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
  testId: string;
}

function ActionButton({ icon, label, onClick, testId }: ActionButtonProps) {
  return (
    <Button
      variant="secondary"
      className="w-full justify-start gap-2 hover-elevate"
      onClick={onClick}
      data-testid={testId}
    >
      {icon}
      {label}
    </Button>
  );
}
