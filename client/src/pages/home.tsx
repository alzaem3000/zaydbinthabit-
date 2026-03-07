import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ThemeToggle } from "@/components/theme-toggle";
import { AddIndicatorModal } from "@/components/add-indicator-modal";
import { StrategiesModal } from "@/components/strategies-modal";
import { PrintReportModal } from "@/components/print-report-modal";
import type {
  DashboardStats,
  IndicatorWithCriteria,
  Strategy,
  StrategyWithSelection,
  User,
  Witness
} from "@shared/schema";
import {
  Plus,
  Printer,
  FileDown,
  FileUp,
  RotateCcw,
  CheckCircle,
  User as UserIcon,
  School,
  Building,
  BookOpen,
  Award,
  UserCog,
  Calendar,
  Mail,
  Pencil,
  Trash2,
  FileText,
  BarChart3,
  Target,
  Users,
  Lightbulb,
  Settings,
  ClipboardList,
  TrendingUp,
  Layers,
  Star,
  LogOut,
  Send,
  Clock,
  CheckCircle2,
  Hash,
  GraduationCap,
  AlertTriangle,
  Eye,
  Image,
  Video,
  File,
  Download,
  Phone,
  LayoutGrid,
  List,
} from "lucide-react";
import type { SignatureWithDetails } from "@shared/schema";

const educationalLevels = [
  { value: "معلم", label: "معلم" },
  { value: "معلم ممارس", label: "معلم ممارس" },
  { value: "معلم متقدم", label: "معلم متقدم" },
  { value: "معلم خبير", label: "معلم خبير" },
];

const indicatorIcons: Record<string, React.ReactNode> = {
  "أداء الواجبات الوظيفية": <ClipboardList className="h-6 w-6" />,
  "التفاعل مع المجتمع المهني": <Users className="h-6 w-6" />,
  "التفاعل مع أولياء الأمور": <UserIcon className="h-6 w-6" />,
  "استراتيجيات التدريس": <Target className="h-6 w-6" />,
  "تحسين نتائج المتعلمين": <TrendingUp className="h-6 w-6" />,
  "إعداد وتنفيذ خطط التعلم": <FileText className="h-6 w-6" />,
  "توظيف تقنيات ووسائل التعلم المناسبة": <Layers className="h-6 w-6" />,
  "تهيئة البيئة التعليمية": <School className="h-6 w-6" />,
  "الإدارة الصفية": <Building className="h-6 w-6" />,
  "تحليل نتائج المتعلمين وتشخيص مستوياتهم": <BarChart3 className="h-6 w-6" />,
  "تنوع أساليب التقويم": <CheckCircle className="h-6 w-6" />,
  "الإبداع والابتكار": <Star className="h-6 w-6" />,
};

const getIndicatorIcon = (title: string, indicator?: IndicatorWithCriteria): React.ReactNode => {
  if (indicator?.performanceStandard?.icon && indicatorIcons[indicator.performanceStandard.icon]) {
    return indicatorIcons[indicator.performanceStandard.icon];
  }
  return indicatorIcons[title] || <Target className="h-6 w-6" />;
};

const domainLabels: Record<string, string> = {
  values: "القيم والمسؤوليات المهنية",
  knowledge: "المعرفة المهنية",
  practice: "الممارسة المهنية",
};

import { WitnessUploadModal } from "@/components/witness-upload-modal";

export default function Home() {
  const { user, logoutMutation } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();

  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [addIndicatorOpen, setAddIndicatorOpen] = useState(false);
  const [addIndicatorType, setAddIndicatorType] = useState<"goal" | "competency">("goal");
  const [witnessUploadOpen, setWitnessUploadOpen] = useState(false);
  const [selectedIndicatorId, setSelectedIndicatorId] = useState<string | null>(null);
  const [strategiesOpen, setStrategiesOpen] = useState(false);
  const [printOpen, setPrintOpen] = useState(false);
  const [printFilterCompleted, setPrintFilterCompleted] = useState(false);
  const [expandedIndicator, setExpandedIndicator] = useState<string | null>(null);
  const [previewWitness, setPreviewWitness] = useState<Witness | null>(null);
  const [activeTab, setActiveTab] = useState("competencies");
  const [profileForm, setProfileForm] = useState({
    fullNameArabic: "",
    jobNumber: "",
    specialization: "",
    schoolName: "",
    educationDepartment: "",
    subject: "",
    educationalLevel: "معلم",
    principalName: "",
    yearsOfService: "",
    contactEmail: "",
    mobileNumber: "",
  });

  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/stats"],
  });

  const { data: indicators, isLoading: indicatorsLoading } = useQuery<IndicatorWithCriteria[]>({
    queryKey: ["/api/indicators"],
  });

  const { data: strategies } = useQuery<Strategy[]>({
    queryKey: ["/api/strategies"],
  });

  const { data: userStrategies } = useQuery<Strategy[]>({
    queryKey: ["/api/user-strategies"],
  });

  const selectedIndicator = indicators?.find(i => i.id === selectedIndicatorId);

  const { data: expandedWitnesses, isLoading: witnessesLoading } = useQuery<Witness[]>({
    queryKey: ["/api/indicators", expandedIndicator, "witnesses"],
    queryFn: async () => {
      const res = await fetch(`/api/indicators/${expandedIndicator}/witnesses`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch witnesses");
      return res.json();
    },
    enabled: !!expandedIndicator,
  });

  const goalIndicators = indicators?.filter(i => i.type === "goal" || !i.type) || [];
  const competencyIndicators = indicators?.filter(i => i.type === "competency") || [];

  const goalsTotalWeight = goalIndicators.reduce((sum, i) => sum + (i.weight || Number(i.performanceStandard?.weight) || 0), 0);
  const competenciesTotalWeight = competencyIndicators.reduce((sum, i) => sum + (i.weight || Number(i.performanceStandard?.weight) || 0), 0);

  const strategiesWithSelection: StrategyWithSelection[] = (strategies || []).map(s => ({
    ...s,
    isSelected: (userStrategies || []).some(us => us.id === s.id),
  }));

  const addIndicatorMutation = useMutation({
    mutationFn: async (data: { title: string; description?: string; criteria: string[]; type: string; weight: number; domain?: string; targetOutput?: string }) => {
      return apiRequest("POST", "/api/indicators", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/indicators"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      setAddIndicatorOpen(false);
      toast({ title: "تم بنجاح", description: "تم إضافة المؤشر الجديد" });
    },
    onError: () => {
      toast({ title: "خطأ", description: "فشل في إضافة المؤشر", variant: "destructive" });
    },
  });


  const deleteWitnessMutation = useMutation({
    mutationFn: async (witnessId: string) => {
      return apiRequest("DELETE", `/api/witnesses/${witnessId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/indicators"] });
      queryClient.invalidateQueries({ queryKey: ["/api/indicators", expandedIndicator, "witnesses"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({ title: "تم بنجاح", description: "تم حذف الشاهد" });
    },
    onError: () => {
      toast({ title: "خطأ", description: "فشل في حذف الشاهد", variant: "destructive" });
    },
  });

  const updateStrategiesMutation = useMutation({
    mutationFn: async (strategyIds: string[]) => {
      return apiRequest("POST", "/api/user-strategies", { strategyIds });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user-strategies"] });
      setStrategiesOpen(false);
      toast({ title: "تم بنجاح", description: "تم تحديث الاستراتيجيات" });
    },
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (data: Partial<User>) => {
      return apiRequest("PATCH", "/api/user", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      setIsEditingProfile(false);
      toast({ title: "تم بنجاح", description: "تم حفظ بيانات المعلم بنجاح" });
    },
    onError: () => {
      toast({ title: "خطأ", description: "فشل في حفظ البيانات", variant: "destructive" });
    },
  });

  const toggleCriteriaMutation = useMutation({
    mutationFn: async ({ indicatorId, criteriaId, isCompleted }: { indicatorId: string; criteriaId: string; isCompleted: boolean }) => {
      return apiRequest("PATCH", `/api/indicators/${indicatorId}/criteria/${criteriaId}`, { isCompleted });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/indicators"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
    },
    onError: () => {
      toast({ title: "خطأ", description: "فشل في تحديث بند الإنجاز", variant: "destructive" });
    },
  });

  const { data: mySignatures = [] } = useQuery<SignatureWithDetails[]>({
    queryKey: ["/api/my-signatures"],
  });

  const submitForApprovalMutation = useMutation({
    mutationFn: async (indicatorId: string) => {
      return apiRequest("POST", "/api/signatures", { indicatorId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/my-signatures"] });
      toast({ title: "تم بنجاح", description: "تم تقديم المؤشر للاعتماد" });
    },
    onError: () => {
      toast({ title: "خطأ", description: "فشل في تقديم الطلب", variant: "destructive" });
    },
  });

  const deleteIndicatorMutation = useMutation({
    mutationFn: async (indicatorId: string) => {
      return apiRequest("DELETE", `/api/indicators/${indicatorId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/indicators"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      setExpandedIndicator(null);
      toast({ title: "تم بنجاح", description: "تم حذف المؤشر" });
    },
    onError: () => {
      toast({ title: "خطأ", description: "فشل في حذف المؤشر", variant: "destructive" });
    },
  });

  const getSignatureStatus = (indicatorId: string) => {
    const signature = mySignatures.find(s => s.indicatorId === indicatorId);
    return signature?.status;
  };

  const handleEditProfile = () => {
    setProfileForm({
      fullNameArabic: user?.fullNameArabic || `${user?.firstName || ""} ${user?.lastName || ""}`.trim(),
      jobNumber: user?.jobNumber || "",
      specialization: user?.specialization || "",
      schoolName: user?.schoolName || "",
      educationDepartment: user?.educationDepartment || "",
      subject: user?.subject || "",
      educationalLevel: user?.educationalLevel || "معلم",
      principalName: user?.principalName || "",
      yearsOfService: user?.yearsOfService?.toString() || "",
      contactEmail: user?.contactEmail || "",
      mobileNumber: user?.mobileNumber || "",
    });
    setIsEditingProfile(true);
  };

  const handleSaveProfile = () => {
    const nameParts = profileForm.fullNameArabic.trim().split(" ");
    updateProfileMutation.mutate({
      fullNameArabic: profileForm.fullNameArabic,
      firstName: nameParts[0] || "",
      lastName: nameParts.slice(1).join(" ") || "",
      jobNumber: profileForm.jobNumber,
      specialization: profileForm.specialization,
      schoolName: profileForm.schoolName,
      educationDepartment: profileForm.educationDepartment,
      subject: profileForm.subject,
      educationalLevel: profileForm.educationalLevel,
      principalName: profileForm.principalName,
      yearsOfService: profileForm.yearsOfService ? parseInt(profileForm.yearsOfService) : undefined,
      contactEmail: profileForm.contactEmail,
      mobileNumber: profileForm.mobileNumber,
    });
  };

  const handleAddWitness = (indicatorId: string) => {
    setSelectedIndicatorId(indicatorId);
    setWitnessUploadOpen(true);
  };

  const handleAddIndicator = (type: "goal" | "competency") => {
    setAddIndicatorType(type);
    setAddIndicatorOpen(true);
  };

  const handlePrintReport = () => {
    setPrintFilterCompleted(false);
    setPrintOpen(true);
  };

  const handlePrintCompleted = () => {
    setPrintFilterCompleted(true);
    setPrintOpen(true);
  };

  const handleExportData = () => {
    if (!indicators || indicators.length === 0) {
      toast({ title: "لا توجد بيانات", description: "لا توجد مؤشرات لتصديرها", variant: "destructive" });
      return;
    }
    const exportData = {
      exportDate: new Date().toISOString(),
      teacher: {
        name: user?.fullNameArabic || `${user?.firstName || ""} ${user?.lastName || ""}`.trim(),
        jobNumber: user?.jobNumber,
        specialization: user?.specialization,
        school: user?.schoolName,
        department: user?.educationDepartment,
        subject: user?.subject,
        level: user?.educationalLevel,
      },
      strategies: userStrategies?.map(s => s.name) || [],
      indicators: indicators.map(indicator => ({
        title: indicator.title,
        description: indicator.description,
        type: indicator.type,
        weight: indicator.weight || Number(indicator.performanceStandard?.weight) || 0,
        domain: indicator.domain,
        targetOutput: indicator.targetOutput,
        status: indicator.status,
        criteria: indicator.criteria?.map(c => ({ title: c.title, isCompleted: c.isCompleted })) || [],
      })),
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `charter-data-${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast({ title: "تم التصدير بنجاح", description: "تم تحميل ملف البيانات" });
  };

  const reEvaluateMutation = useMutation({
    mutationFn: async (indicatorIds: string[]) => {
      return apiRequest("POST", "/api/indicators/re-evaluate", { indicatorIds });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/indicators"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({ title: "تم إعادة التعيين", description: "تم إعادة تعيين بنود الإنجاز والشواهد" });
    },
  });

  const handleReset = () => {
    if (!indicators || indicators.length === 0) return;
    if (confirm("هل أنت متأكد من إعادة تعيين جميع المؤشرات؟")) {
      reEvaluateMutation.mutate(indicators.map(i => i.id));
    }
  };

  const defaultStats: DashboardStats = {
    totalCapabilities: 12,
    totalChanges: 12,
    totalIndicators: indicators?.length || 0,
    completedIndicators: indicators?.filter(i => i.status === "completed").length || 0,
    pendingIndicators: indicators?.filter(i => i.status === "pending").length || 0,
    inProgressIndicators: indicators?.filter(i => i.status === "in_progress").length || 0,
    totalWitnesses: indicators?.reduce((acc, i) => acc + (i.witnessCount || 0), 0) || 0,
  };

  const currentStats = stats || defaultStats;
  const completionPercentage = currentStats.totalIndicators > 0
    ? Math.round((currentStats.completedIndicators / currentStats.totalIndicators) * 100)
    : 0;

  const renderWeightBar = (totalWeight: number, label: string) => {
    const isValid = totalWeight === 100;
    return (
      <div className="mb-4 p-3 rounded-md border border-border bg-muted/30" data-testid={`weight-bar-${label}`}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            {!isValid && totalWeight > 0 && (
              <AlertTriangle className="h-4 w-4 text-amber-500" />
            )}
            {isValid && <CheckCircle2 className="h-4 w-4 text-green-500" />}
            <span className="text-sm font-medium">
              {isValid ? "مجموع الأوزان مكتمل" : `مجموع الأوزان: ${totalWeight}% من 100%`}
            </span>
          </div>
          <Badge variant={isValid ? "default" : "secondary"} className={isValid ? "bg-green-600" : ""}>
            {totalWeight}%
          </Badge>
        </div>
        <Progress value={Math.min(totalWeight, 100)} className="h-2" />
      </div>
    );
  };

  const getCompletionPercent = (indicator: IndicatorWithCriteria) => {
    if (!indicator.criteria || indicator.criteria.length === 0) return 0;
    const completed = indicator.criteria.filter(c => c.isCompleted).length;
    return Math.round((completed / indicator.criteria.length) * 100);
  };

  const getStatusBorderClass = (indicator: IndicatorWithCriteria) => {
    if (indicator.status === "completed") return "border-r-4 border-r-green-500";
    if (indicator.status === "in_progress") return "border-r-4 border-r-amber-500";
    return "border-r-4 border-r-muted-foreground/30";
  };

  const renderIndicatorGrid = (indicatorList: IndicatorWithCriteria[], type: "goal" | "competency") => {
    if (indicatorsLoading) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="overflow-visible">
              <div className="p-5">
                <div className="flex items-center gap-3 mb-4">
                  <Skeleton className="h-12 w-12 rounded-lg" />
                  <div className="flex-1">
                    <Skeleton className="h-5 w-3/4 mb-2" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
                <Skeleton className="h-3 w-full mb-4" />
                <Skeleton className="h-9 w-full" />
              </div>
            </Card>
          ))}
        </div>
      );
    }

    if (indicatorList.length === 0) {
      return (
        <div className="text-center py-16 bg-muted/20 rounded-xl border-2 border-dashed" data-testid={`text-no-${type}`}>
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
            <Target className="h-10 w-10 text-primary" />
          </div>
          <p className="text-lg font-bold mb-2">
            {type === "goal" ? "لا توجد أهداف بعد" : "لا توجد جدارات بعد"}
          </p>
          <p className="text-muted-foreground mb-6 text-sm">
            {type === "goal" ? "ابدأ بإضافة أهداف الأداء الوظيفي لبناء ميثاقك" : "أضف الجدارات المهنية لتوثيق كفاءاتك"}
          </p>
          <Button onClick={() => handleAddIndicator(type)} data-testid={`button-add-first-${type}`}>
            <Plus className="h-4 w-4 ml-2" />
            {type === "goal" ? "إضافة أول هدف" : "إضافة أول جدارة"}
          </Button>
        </div>
      );
    }

    return (
      <>
        {renderWeightBar(
          indicatorList.reduce((sum, i) => sum + (i.weight || Number(i.performanceStandard?.weight) || 0), 0),
          type
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
          {indicatorList.map((indicator) => {
            const completionPct = getCompletionPercent(indicator);
            const signatureStatus = getSignatureStatus(indicator.id);
            const completedCriteria = indicator.criteria?.filter(c => c.isCompleted).length || 0;
            const totalCriteria = indicator.criteria?.length || 0;

            return (
              <Card
                key={indicator.id}
                className={`overflow-visible cursor-pointer transition-all hover-elevate ${getStatusBorderClass(indicator)} ${expandedIndicator === indicator.id ? "ring-2 ring-primary shadow-lg" : ""
                  }`}
                onClick={() => setExpandedIndicator(expandedIndicator === indicator.id ? null : indicator.id)}
                data-testid={`indicator-card-${indicator.id}`}
              >
                <div className="p-5">
                  <div className="flex items-start gap-4 mb-4">
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center shrink-0 ${indicator.status === "completed"
                      ? "bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-400"
                      : indicator.status === "in_progress"
                        ? "bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400"
                        : "bg-muted text-muted-foreground"
                      }`}>
                      {getIndicatorIcon(indicator.title)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-sm leading-tight line-clamp-2 mb-1" data-testid={`text-indicator-title-${indicator.id}`}>
                        {indicator.title}
                      </h3>
                      <div className="flex items-center gap-2 flex-wrap">
                        {(indicator.weight || indicator.performanceStandard?.weight) ? (
                          <Badge variant="secondary" className="text-xs">{indicator.weight || indicator.performanceStandard?.weight}%</Badge>
                        ) : null}
                        {indicator.domain && (
                          <Badge variant="outline" className="text-xs">{domainLabels[indicator.domain] || indicator.domain}</Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs text-muted-foreground">
                        {completedCriteria} / {totalCriteria} بند إنجاز
                      </span>
                      <span className={`text-xs font-bold ${completionPct === 100 ? "text-green-600" : "text-muted-foreground"}`}>
                        {completionPct}%
                      </span>
                    </div>
                    <Progress value={completionPct} className="h-2" />
                  </div>

                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2">
                      <Badge variant={indicator.status === "completed" ? "default" : "secondary"} className={indicator.status === "completed" ? "bg-green-600" : ""}>
                        {indicator.status === "completed" ? "مكتمل" : indicator.status === "in_progress" ? "قيد التنفيذ" : "غير مكتمل"}
                      </Badge>
                      {signatureStatus === "pending" && (
                        <Badge className="bg-amber-500/10 text-amber-600 border-amber-200 gap-1">
                          <Clock className="h-3 w-3" />
                          بانتظار الاعتماد
                        </Badge>
                      )}
                      {signatureStatus === "approved" && (
                        <Badge className="bg-green-500/10 text-green-600 border-green-200 gap-1">
                          <CheckCircle2 className="h-3 w-3" />
                          معتمد
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5" data-testid={`witnesses-icons-${indicator.id}`}>
                      {indicator.witnesses && indicator.witnesses.length > 0 ? (
                        <>
                          {indicator.witnesses.slice(0, 5).map((w) => (
                            <div
                              key={w.id}
                              className="h-6 w-6 rounded bg-muted flex items-center justify-center"
                              title={w.title}
                              data-testid={`witness-icon-${w.id}`}
                            >
                              {w.fileType === "pdf" && <FileText className="h-3.5 w-3.5 text-destructive" />}
                              {w.fileType === "image" && <Image className="h-3.5 w-3.5 text-green-500" />}
                              {w.fileType === "video" && <Video className="h-3.5 w-3.5 text-blue-500" />}
                              {(!w.fileType || w.fileType === "document") && <File className="h-3.5 w-3.5 text-muted-foreground" />}
                            </div>
                          ))}
                          {indicator.witnesses.length > 5 && (
                            <span className="text-xs text-muted-foreground font-medium" data-testid={`text-witness-overflow-${indicator.id}`}>+{indicator.witnesses.length - 5}</span>
                          )}
                        </>
                      ) : (
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Eye className="h-3 w-3" />
                          {indicator.witnessCount || 0} شاهد
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="border-t px-5 py-3 bg-muted/20">
                  <Button
                    onClick={(e) => { e.stopPropagation(); handleAddWitness(indicator.id); }}
                    size="sm"
                    className="w-full gap-2"
                    style={{ backgroundColor: "#006C35" }}
                    data-testid={`button-add-witness-card-${indicator.id}`}
                  >
                    <Plus className="h-4 w-4" />
                    إضافة شاهد
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>

        {expandedIndicator && indicatorList.find(i => i.id === expandedIndicator) && (
          <Card className="p-6 border-2 border-primary/20 mb-6" data-testid="expanded-indicator">
            {(() => {
              const indicator = indicatorList.find(i => i.id === expandedIndicator);
              if (!indicator) return null;
              const completionPct = getCompletionPercent(indicator);
              return (
                <div>
                  <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
                    <div className="flex gap-2 flex-wrap">
                      <Button
                        onClick={() => handleAddWitness(indicator.id)}
                        size="sm"
                        className="gap-2"
                        style={{ backgroundColor: "#006C35" }}
                        data-testid="button-add-witness-expanded"
                      >
                        <Plus className="h-4 w-4" />
                        إضافة شاهد
                      </Button>
                      {indicator.status === "completed" && !getSignatureStatus(indicator.id) && (
                        <Button
                          onClick={() => submitForApprovalMutation.mutate(indicator.id)}
                          size="sm"
                          className="gap-2 bg-amber-500"
                          disabled={submitForApprovalMutation.isPending}
                          data-testid="button-submit-approval"
                        >
                          <Send className="h-4 w-4" />
                          تقديم للاعتماد
                        </Button>
                      )}
                      <Button
                        onClick={() => {
                          if (confirm("هل أنت متأكد من حذف هذا المؤشر؟")) {
                            deleteIndicatorMutation.mutate(indicator.id);
                          }
                        }}
                        size="sm"
                        variant="ghost"
                        className="text-destructive"
                        data-testid="button-delete-indicator"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="text-right">
                      <h3 className="text-lg font-bold flex items-center gap-2 justify-end">
                        {indicator.title}
                        {getIndicatorIcon(indicator.title)}
                      </h3>
                      <div className="flex items-center gap-2 justify-end mt-1 flex-wrap">
                        <Badge variant={indicator.status === "completed" ? "default" : "secondary"}>
                          {indicator.status === "completed" ? "مكتمل" : indicator.status === "in_progress" ? "قيد التنفيذ" : "غير مكتمل"}
                        </Badge>
                        {(indicator.weight || indicator.performanceStandard?.weight) ? <Badge variant="outline">{indicator.weight || indicator.performanceStandard?.weight}%</Badge> : null}
                        {indicator.targetOutput && (
                          <span className="text-xs text-muted-foreground">المخرج: {indicator.targetOutput}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="mb-6 p-4 bg-muted/20 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">نسبة إنجاز بنود الأداء</span>
                      <span className="text-sm font-bold">{completionPct}%</span>
                    </div>
                    <Progress value={completionPct} className="h-3" />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {indicator.criteria?.map((criterion, idx) => (
                      <Card
                        key={criterion.id}
                        className={`p-4 ${criterion.isCompleted ? 'bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800' : 'bg-muted/30'}`}
                        data-testid={`criterion-${criterion.id}`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex gap-2 items-center">
                            <Checkbox
                              checked={criterion.isCompleted || false}
                              onCheckedChange={(checked) =>
                                toggleCriteriaMutation.mutate({
                                  indicatorId: indicator.id,
                                  criteriaId: criterion.id,
                                  isCompleted: checked as boolean
                                })
                              }
                              data-testid={`checkbox-criterion-${criterion.id}`}
                              className="h-5 w-5"
                            />
                            <Button
                              onClick={() => handleAddWitness(indicator.id)}
                              size="sm"
                              className="gap-2"
                              style={{ backgroundColor: "#006C35" }}
                              data-testid={`button-add-witness-${criterion.id}`}
                            >
                              <Plus className="h-3 w-3" />
                              شاهد
                            </Button>
                          </div>
                          <div className="text-right flex-1">
                            <span className={`font-medium ${criterion.isCompleted ? 'line-through text-muted-foreground' : ''}`}>
                              {idx + 1}. {criterion.title}
                            </span>
                            {criterion.isCompleted && (
                              <Badge variant="secondary" className="mr-2 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
                                مكتمل
                              </Badge>
                            )}
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>

                  <div className="mt-6">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-bold text-foreground flex items-center gap-2">
                        <Eye className="h-4 w-4" />
                        الشواهد المرفقة ({expandedWitnesses?.length || 0})
                      </h4>
                    </div>
                    {witnessesLoading ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <Skeleton className="h-24 w-full rounded-xl" />
                        <Skeleton className="h-24 w-full rounded-xl" />
                      </div>
                    ) : !expandedWitnesses || expandedWitnesses.length === 0 ? (
                      <div className="text-center py-6" data-testid="text-no-witnesses">
                        <FileText className="h-10 w-10 mx-auto mb-2 text-muted-foreground opacity-30" />
                        <p className="text-muted-foreground text-sm">لا توجد شواهد مرفقة لهذا المؤشر</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {expandedWitnesses.map((witness) => {
                          const iconConfig = witness.fileType === "pdf"
                            ? { icon: FileText, color: "text-red-500", bg: "bg-red-100 dark:bg-red-900/30", label: "PDF" }
                            : witness.fileType === "image"
                              ? { icon: Image, color: "text-green-500", bg: "bg-green-100 dark:bg-green-900/30", label: "صورة" }
                              : witness.fileType === "video"
                                ? { icon: Video, color: "text-blue-500", bg: "bg-blue-100 dark:bg-blue-900/30", label: "فيديو" }
                                : { icon: File, color: "text-muted-foreground", bg: "bg-muted", label: "مستند" };
                          const WitnessIcon = iconConfig.icon;
                          return (
                            <Card key={witness.id} className="overflow-visible hover-elevate transition-all" data-testid={`witness-card-${witness.id}`}>
                              <div className="p-4 flex items-center gap-4">
                                <div className={`w-12 h-12 rounded-xl ${iconConfig.bg} flex items-center justify-center shrink-0`} data-testid={`icon-witness-type-${witness.id}`}>
                                  <WitnessIcon className={`h-6 w-6 ${iconConfig.color}`} />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h5 className="font-bold text-sm truncate mb-1" data-testid={`text-witness-title-${witness.id}`}>
                                    {witness.title}
                                  </h5>
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <Badge variant="outline" className="text-[10px]" data-testid={`badge-witness-type-${witness.id}`}>{iconConfig.label}</Badge>
                                    {witness.fileName && (
                                      <span className="text-[10px] text-muted-foreground truncate max-w-[120px]">{witness.fileName}</span>
                                    )}
                                  </div>
                                </div>
                                <div className="flex gap-1 shrink-0">
                                  {witness.fileUrl && (
                                    <>
                                      <Button
                                        size="icon"
                                        variant="ghost"
                                        onClick={() => setPreviewWitness(witness)}
                                        data-testid={`button-preview-witness-${witness.id}`}
                                      >
                                        <Eye className="h-4 w-4" />
                                      </Button>
                                      <Button
                                        size="icon"
                                        variant="ghost"
                                        onClick={() => {
                                          const link = document.createElement("a");
                                          link.href = witness.fileUrl!;
                                          link.download = witness.fileName || "شاهد";
                                          link.click();
                                        }}
                                        data-testid={`button-download-witness-${witness.id}`}
                                      >
                                        <Download className="h-4 w-4" />
                                      </Button>
                                    </>
                                  )}
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="text-destructive"
                                    onClick={() => {
                                      if (confirm("هل أنت متأكد من حذف هذا الشاهد؟")) {
                                        deleteWitnessMutation.mutate(witness.id);
                                      }
                                    }}
                                    data-testid={`button-delete-witness-${witness.id}`}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            </Card>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}
          </Card>
        )}
      </>
    );
  };

  return (
    <div className="min-h-screen bg-background" dir="rtl" data-testid="page-home">
      <div className="fixed top-4 left-4 z-50">
        <ThemeToggle />
      </div>

      <div className="max-w-7xl mx-auto p-4 md:p-6">
        <div className="relative overflow-hidden rounded-2xl shadow-xl mb-8 border border-primary/20 bg-gradient-to-r from-[#006C35] via-[#008f4c] to-[#005126] text-white p-8">
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h2 className="text-3xl font-bold mb-2">مرحباً بك، {user?.fullNameArabic || user?.firstName}</h2>
              <p className="text-white/80">لوحة معلومات الأداء الوظيفي الخاصة بك</p>
            </div>
            <div className="flex items-center gap-6">
              <div className="text-center">
                <div className="text-4xl font-extrabold">{currentStats.totalIndicators}</div>
                <div className="text-sm text-white/80 mt-1">المعايير</div>
              </div>
              <div className="w-px h-12 bg-white/20 hidden md:block"></div>
              <div className="text-center">
                <div className="text-4xl font-extrabold">{currentStats.completedIndicators}</div>
                <div className="text-sm text-white/80 mt-1">مكتمل</div>
              </div>
              <div className="w-px h-12 bg-white/20 hidden md:block"></div>
              <div className="text-center">
                <div className="text-4xl font-extrabold">{completionPercentage}%</div>
                <div className="text-sm text-white/80 mt-1">نسبة الإنجاز</div>
              </div>
            </div>
          </div>
          <div className="absolute top-0 opacity-10 right-0 w-64 h-64 -translate-y-1/4 translate-x-1/4 rounded-full bg-white blur-3xl" />
        </div>

        {/* Shortcuts Row */}
        <div className="mb-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Nafes shortcut */}
          <div
            className="p-4 rounded-xl border-2 border-dashed border-blue-400/40 bg-blue-50/50 dark:bg-blue-950/20 cursor-pointer hover:bg-blue-100/50 hover:border-blue-400/70 transition-all flex items-center justify-between"
            onClick={() => navigate('/nafes')}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center">
                <FileUp className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="font-bold text-sm text-blue-700 dark:text-blue-400">أعمال نافس</p>
                <p className="text-xs text-muted-foreground">رفع شواهد اختبارات نافس</p>
              </div>
            </div>
            <span className="text-xs bg-blue-500 text-white px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1">رفع الشواهد <FileUp className="h-3 w-3" /></span>
          </div>

          {/* Standards shortcut */}
          <div
            className="p-4 rounded-xl border-2 border-dashed border-amber-400/40 bg-amber-50/50 dark:bg-amber-950/20 cursor-pointer hover:bg-amber-100/50 hover:border-amber-400/70 transition-all flex items-center justify-between"
            onClick={() => navigate('/standards')}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center">
                <Award className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="font-bold text-sm text-amber-700 dark:text-amber-400">معايير الأداء الـ 11</p>
                <p className="text-xs text-muted-foreground">دليل شواهد الأداء الوزارية</p>
              </div>
            </div>
            <span className="text-xs bg-amber-500 text-white px-3 py-1.5 rounded-lg font-semibold">عرض →</span>
          </div>
        </div>

        <Card className="p-6 mb-6" data-testid="section-teacher-info">
          <div className="flex items-center justify-between mb-6 flex-wrap gap-2">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <GraduationCap className="h-5 w-5" style={{ color: "#006C35" }} />
              بيانات المعلم/ة
            </h2>
            {!isEditingProfile ? (
              <Button variant="outline" size="sm" onClick={handleEditProfile} className="gap-2" data-testid="button-edit-profile">
                <Pencil className="h-4 w-4" />
                تحرير
              </Button>
            ) : (
              <Button variant="outline" size="sm" onClick={() => setIsEditingProfile(false)} className="gap-2" data-testid="button-cancel-edit">
                إلغاء
              </Button>
            )}
          </div>

          {isEditingProfile ? (
            <div className="space-y-6" data-testid="edit-profile-form">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">الاسم الكامل</label>
                  <Input value={profileForm.fullNameArabic} onChange={(e) => setProfileForm({ ...profileForm, fullNameArabic: e.target.value })} placeholder="الاسم الرباعي" data-testid="input-name" />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">الرقم الوظيفي</label>
                  <Input value={profileForm.jobNumber} onChange={(e) => setProfileForm({ ...profileForm, jobNumber: e.target.value })} placeholder="الرقم الوظيفي" data-testid="input-job-number" />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">التخصص</label>
                  <Input value={profileForm.specialization} onChange={(e) => setProfileForm({ ...profileForm, specialization: e.target.value })} placeholder="التخصص العلمي" data-testid="input-specialization" />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">المدرسة</label>
                  <Input value={profileForm.schoolName} onChange={(e) => setProfileForm({ ...profileForm, schoolName: e.target.value })} placeholder="اسم المدرسة" data-testid="input-school" />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">إدارة التعليم</label>
                  <Input value={profileForm.educationDepartment} onChange={(e) => setProfileForm({ ...profileForm, educationDepartment: e.target.value })} placeholder="إدارة التعليم" data-testid="input-department" />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">المادة الدراسية</label>
                  <Input value={profileForm.subject} onChange={(e) => setProfileForm({ ...profileForm, subject: e.target.value })} placeholder="المادة" data-testid="input-subject" />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">الرتبة</label>
                  <Select value={profileForm.educationalLevel} onValueChange={(value) => setProfileForm({ ...profileForm, educationalLevel: value })}>
                    <SelectTrigger data-testid="select-educational-level"><SelectValue placeholder="اختر الرتبة" /></SelectTrigger>
                    <SelectContent>
                      {educationalLevels.map((level) => (<SelectItem key={level.value} value={level.value}>{level.label}</SelectItem>))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">مدير/ة المدرسة</label>
                  <Input value={profileForm.principalName} onChange={(e) => setProfileForm({ ...profileForm, principalName: e.target.value })} placeholder="اسم المدير" data-testid="input-principal" />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">سنوات الخدمة</label>
                  <Input type="number" value={profileForm.yearsOfService} onChange={(e) => setProfileForm({ ...profileForm, yearsOfService: e.target.value })} placeholder="عدد السنوات" data-testid="input-years" />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">رقم الجوال</label>
                  <Input value={profileForm.mobileNumber} onChange={(e) => setProfileForm({ ...profileForm, mobileNumber: e.target.value })} placeholder="05XXXXXXXX" dir="ltr" data-testid="input-mobile" />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">وسيلة التواصل</label>
                  <Input value={profileForm.contactEmail} onChange={(e) => setProfileForm({ ...profileForm, contactEmail: e.target.value })} placeholder="البريد الإلكتروني" data-testid="input-contact" />
                </div>
              </div>
              <div className="flex gap-3 justify-start">
                <Button onClick={handleSaveProfile} disabled={updateProfileMutation.isPending} style={{ backgroundColor: "#006C35" }} className="gap-2" data-testid="button-save-profile">
                  <FileDown className="h-4 w-4" />
                  حفظ البيانات
                </Button>
                <Button variant="destructive" onClick={() => setIsEditingProfile(false)} className="gap-2" data-testid="button-cancel-profile">
                  إلغاء
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4" data-testid="profile-display">
              <Card className="p-4 bg-muted/50">
                <div className="flex items-center gap-2 mb-2">
                  <UserIcon className="h-5 w-5" style={{ color: "#006C35" }} />
                  <span className="font-medium">الاسم</span>
                </div>
                <div className="text-muted-foreground" data-testid="display-name">
                  {user?.fullNameArabic || `${user?.firstName || ""} ${user?.lastName || ""}`.trim() || "غير محدد"}
                </div>
              </Card>
              <Card className="p-4 bg-muted/50">
                <div className="flex items-center gap-2 mb-2">
                  <Hash className="h-5 w-5" style={{ color: "#006C35" }} />
                  <span className="font-medium">الرقم الوظيفي</span>
                </div>
                <div className="text-muted-foreground" data-testid="display-job-number">
                  {user?.jobNumber || "غير محدد"}
                </div>
              </Card>
              <Card className="p-4 bg-muted/50">
                <div className="flex items-center gap-2 mb-2">
                  <BookOpen className="h-5 w-5" style={{ color: "#006C35" }} />
                  <span className="font-medium">التخصص</span>
                </div>
                <div className="text-muted-foreground" data-testid="display-specialization">
                  {user?.specialization || "غير محدد"}
                </div>
              </Card>
              <Card className="p-4 bg-muted/50">
                <div className="flex items-center gap-2 mb-2">
                  <School className="h-5 w-5" style={{ color: "#006C35" }} />
                  <span className="font-medium">المدرسة</span>
                </div>
                <div className="text-muted-foreground" data-testid="display-school">
                  {user?.schoolName || "غير محدد"}
                </div>
              </Card>
              <Card className="p-4 bg-muted/50">
                <div className="flex items-center gap-2 mb-2">
                  <Building className="h-5 w-5" style={{ color: "#006C35" }} />
                  <span className="font-medium">إدارة التعليم</span>
                </div>
                <div className="text-muted-foreground" data-testid="display-department">
                  {user?.educationDepartment || "غير محدد"}
                </div>
              </Card>
              <Card className="p-4 bg-muted/50">
                <div className="flex items-center gap-2 mb-2">
                  <BookOpen className="h-5 w-5" style={{ color: "#006C35" }} />
                  <span className="font-medium">المادة الدراسية</span>
                </div>
                <div className="text-muted-foreground" data-testid="display-subject">
                  {user?.subject || "غير محدد"}
                </div>
              </Card>
              <Card className="p-4 bg-muted/50">
                <div className="flex items-center gap-2 mb-2">
                  <Award className="h-5 w-5" style={{ color: "#006C35" }} />
                  <span className="font-medium">الرتبة</span>
                </div>
                <div className="text-muted-foreground" data-testid="display-level">
                  {user?.educationalLevel || "غير محدد"}
                </div>
              </Card>
              <Card className="p-4 bg-muted/50">
                <div className="flex items-center gap-2 mb-2">
                  <Phone className="h-5 w-5" style={{ color: "#006C35" }} />
                  <span className="font-medium">رقم الجوال</span>
                </div>
                <div className="text-muted-foreground" dir="ltr" data-testid="display-mobile">
                  {user?.mobileNumber || "غير محدد"}
                </div>
              </Card>
              <Card className="p-4 bg-muted/50">
                <div className="flex items-center gap-2 mb-2">
                  <UserCog className="h-5 w-5" style={{ color: "#006C35" }} />
                  <span className="font-medium">مدير/ة المدرسة</span>
                </div>
                <div className="text-muted-foreground" data-testid="display-principal">
                  {user?.principalName || "غير محدد"}
                </div>
              </Card>
            </div>
          )}
        </Card>

        <Card className="p-6 mb-6" data-testid="section-quick-actions">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2 justify-end">
            الإجراءات السريعة
            <Settings className="h-5 w-5" style={{ color: "#006C35" }} />
          </h2>
          <div className="flex flex-wrap gap-3 justify-center">
            <Button onClick={handlePrintCompleted} style={{ backgroundColor: "#006C35" }} className="gap-2" data-testid="button-print-completed">
              <CheckCircle className="h-4 w-4" />
              طباعة المكتمل
            </Button>
            <Button onClick={handlePrintReport} className="gap-2 bg-blue-600" data-testid="button-print-full">
              <Printer className="h-4 w-4" />
              طباعة التقرير الرسمي
            </Button>
            <Button onClick={handleExportData} className="gap-2 bg-blue-500" data-testid="button-export">
              <FileDown className="h-4 w-4" />
              تصدير البيانات
            </Button>
            <Button onClick={() => setStrategiesOpen(true)} className="gap-2 bg-purple-600" data-testid="button-strategies">
              <Lightbulb className="h-4 w-4" />
              استراتيجيات التدريس
            </Button>
            <Button onClick={handleReset} variant="destructive" className="gap-2" data-testid="button-reset">
              <RotateCcw className="h-4 w-4" />
              إعادة تعيين
            </Button>
            <Button variant="outline" className="gap-2" onClick={() => logoutMutation.mutate()} disabled={logoutMutation.isPending} data-testid="button-logout">
              <LogOut className="h-4 w-4" />
              {logoutMutation.isPending ? "جاري الخروج..." : "تسجيل الخروج"}
            </Button>
          </div>
        </Card>



        <footer className="text-center py-8 border-t border-border" data-testid="footer">
          <p className="text-muted-foreground">نظام ميثاق الأداء الوظيفي</p>
          <p className="text-sm text-muted-foreground mt-2">نظام إلكتروني متكامل لتوثيق الأداء المهني وفق معايير وزارة التعليم</p>
          <p className="text-sm text-muted-foreground mt-4 font-medium">الصفحة من إعداد عبدالعزيز الخلفان</p>
        </footer>
      </div>

      <AddIndicatorModal
        open={addIndicatorOpen}
        onOpenChange={setAddIndicatorOpen}
        onSubmit={(data) => addIndicatorMutation.mutate(data)}
        isLoading={addIndicatorMutation.isPending}
        defaultType={addIndicatorType}
      />

      {selectedIndicatorId && (
        <WitnessUploadModal
          indicatorId={selectedIndicatorId}
          indicatorTitle={indicators?.find(i => i.id === selectedIndicatorId)?.title || ""}
          isOpen={witnessUploadOpen}
          onClose={() => setWitnessUploadOpen(false)}
        />
      )}

      <StrategiesModal
        open={strategiesOpen}
        onOpenChange={setStrategiesOpen}
        strategies={strategiesWithSelection}
        onSubmit={(ids) => updateStrategiesMutation.mutate(ids)}
        isLoading={updateStrategiesMutation.isPending}
      />

      <PrintReportModal
        open={printOpen}
        onOpenChange={setPrintOpen}
        indicators={indicators || []}
        stats={currentStats}
        user={user || undefined}
        filterCompleted={printFilterCompleted}
      />

      <Dialog open={!!previewWitness} onOpenChange={(open) => !open && setPreviewWitness(null)}>
        <DialogContent className="max-w-4xl h-[80vh] flex flex-col p-0">
          <DialogHeader className="p-4 border-b">
            <DialogTitle>معاينة الشاهد: {previewWitness?.title}</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-accent/20">
            {previewWitness?.fileUrl ? (
              previewWitness.fileUrl.startsWith("data:image/") ? (
                <img src={previewWitness.fileUrl} alt="Preview" className="max-w-full max-h-full object-contain rounded-lg shadow-sm" />
              ) : previewWitness.fileUrl.startsWith("data:application/pdf") ? (
                <iframe src={previewWitness.fileUrl} className="w-full h-full rounded-lg shadow-sm" title="PDF Preview" />
              ) : (
                <div className="text-center p-8">
                  <File className="h-16 w-16 mx-auto text-muted-foreground mb-4 opacity-50" />
                  <p className="font-medium">هذا النوع من الملفات لا يدعم المعاينة المباشرة</p>
                  <Button variant="outline" className="mt-4" onClick={() => {
                    const link = document.createElement("a");
                    link.href = previewWitness.fileUrl!;
                    link.download = previewWitness.fileName || "شاهد";
                    link.click();
                  }}>
                    تحميل الملف
                  </Button>
                </div>
              )
            ) : null}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
