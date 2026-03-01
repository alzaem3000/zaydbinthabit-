import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";
import type { IndicatorWithCriteria, DashboardStats, User } from "@shared/schema";
import { PrintableCharter } from "./printable-charter";

interface PrintReportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  indicators: IndicatorWithCriteria[];
  stats: DashboardStats;
  user?: User;
  filterCompleted?: boolean;
}

export function PrintReportModal({
  open,
  onOpenChange,
  indicators,
  stats,
  user,
  filterCompleted = false
}: PrintReportModalProps) {
  const filteredIndicators = filterCompleted
    ? indicators.filter(i => i.status === "completed")
    : indicators;

  const goals = filteredIndicators.filter(i => i.type === "goal" || !i.type);
  const competencies = filteredIndicators.filter(i => i.type === "competency");

  const handlePrint = () => {
    window.print();
  };

  const defaultUser: User = {
    id: "",
    email: null,
    firstName: null,
    lastName: null,
    fullNameArabic: null,
    profileImageUrl: null,
    password: null,
    role: "teacher",
    jobNumber: null,
    specialization: null,
    educationalLevel: "معلم",
    schoolName: null,
    educationDepartment: null,
    subject: null,
    mobileNumber: null,
    principalName: null,
    yearsOfService: null,
    contactEmail: null,
    nationalId: null,
    onboardingCompleted: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto print:max-w-full print:h-full" data-testid="print-report-modal">
        <DialogHeader className="print:hidden">
          <DialogTitle className="text-right">ميثاق الأداء الوظيفي - نسخة الطباعة</DialogTitle>
        </DialogHeader>

        <PrintableCharter
          user={user || defaultUser}
          goals={goals}
          competencies={competencies}
        />

        <div className="flex gap-3 pt-4 print:hidden">
          <Button
            onClick={handlePrint}
            className="flex-1 gap-2"
            style={{ backgroundColor: "#006C35" }}
            data-testid="button-print"
          >
            <Printer className="h-4 w-4" />
            طباعة الميثاق
          </Button>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="flex-1"
            data-testid="button-close-print"
          >
            إغلاق
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
