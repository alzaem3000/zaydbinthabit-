import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Users,
  FileCheck,
  Clock,
  CheckCircle2,
  XCircle,
  ChevronLeft,
  BarChart3,
  User,
  BookOpen,
  Award,
  AlertCircle,
  Eye,
  ThumbsUp,
  ThumbsDown,
  LogOut,
  Moon,
  Sun,
  Shield,
  Crown,
  UserCog,
  Trash2,
  KeyRound,
  FileText,
  Image,
  Video,
  File,
  Download,
  ChevronDown,
  ChevronUp,
  Target,
  ClipboardList,
  TrendingUp,
  Layers,
  Building,
  School,
  CheckCircle,
  Star,
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  User as UserType,
  PrincipalDashboardStats,
  TeacherWithStats,
  SignatureWithDetails,
  IndicatorWithCriteria,
  Witness,
  NafesFile
} from "@shared/schema";
import { useAuth } from "@/hooks/useAuth";
import { Skeleton } from "@/components/ui/skeleton";
import { PrincipalAnalytics } from "@/components/principal-analytics";
import { Link } from "wouter";
import { Calendar } from "lucide-react";
import { EvidenceReviewModal } from "@/components/evidence-review-modal";
import { Progress } from "@/components/ui/progress";

const indicatorIcons: Record<string, React.ReactNode> = {
  "أداء الواجبات الوظيفية": <ClipboardList className="h-6 w-6" />,
  "التفاعل مع المجتمع المهني": <Users className="h-6 w-6" />,
  "التفاعل مع أولياء الأمور": <User className="h-6 w-6" />,
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

const getIndicatorIcon = (title: string): React.ReactNode => {
  return indicatorIcons[title] || <Target className="h-6 w-6" />;
};

export default function PrincipalDashboard() {
  const { toast } = useToast();
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState<TeacherWithStats | null>(null);
  const [selectedSignature, setSelectedSignature] = useState<SignatureWithDetails | null>(null);
  const [selectedWitness, setSelectedWitness] = useState<Witness | null>(null);
  const [showEvidenceReview, setShowEvidenceReview] = useState(false);
  const [approvalNotes, setApprovalNotes] = useState("");
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [approvalAction, setApprovalAction] = useState<"approve" | "reject">("approve");
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [teacherToDelete, setTeacherToDelete] = useState<TeacherWithStats | null>(null);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [teacherToChangePassword, setTeacherToChangePassword] = useState<TeacherWithStats | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [expandedWitnessIndicator, setExpandedWitnessIndicator] = useState<string | null>(null);

  const { data: user } = useQuery<UserType>({
    queryKey: ["/api/user"],
    staleTime: Infinity,
  });
  const { logoutMutation } = useAuth();

  const { data: stats, isLoading: statsLoading } = useQuery<PrincipalDashboardStats>({
    queryKey: ["/api/principal/stats"],
    staleTime: 60000,
  });

  const { data: teachers = [], isLoading: teachersLoading } = useQuery<TeacherWithStats[]>({
    queryKey: ["/api/principal/teachers"],
    staleTime: 60000,
  });

  const { data: pendingSignatures = [], isLoading: signaturesLoading } = useQuery<SignatureWithDetails[]>({
    queryKey: ["/api/principal/pending-signatures"],
    staleTime: 30000,
  });

  const { data: teacherIndicators = [] } = useQuery<IndicatorWithCriteria[]>({
    queryKey: ["/api/principal/teachers", selectedTeacher?.id, "indicators"],
    enabled: !!selectedTeacher?.id,
  });

  const { data: nafesFiles = [], isLoading: nafesLoading } = useQuery<NafesFile[]>({
    queryKey: ["/api/nafes", selectedTeacher?.id],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/nafes?teacherId=${selectedTeacher?.id}`);
      return res.json();
    },
    enabled: !!selectedTeacher?.id,
  });

  const { data: principalWitnesses, isLoading: principalWitnessesLoading } = useQuery<Witness[]>({
    queryKey: ["/api/principal/indicators", expandedWitnessIndicator, "witnesses"],
    queryFn: async () => {
      const res = await fetch(`/api/principal/indicators/${expandedWitnessIndicator}/witnesses`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch witnesses");
      return res.json();
    },
    enabled: !!expandedWitnessIndicator,
  });

  const approveMutation = useMutation({
    mutationFn: async ({ signatureId, notes }: { signatureId: string; notes?: string }) => {
      return apiRequest("POST", `/api/principal/signatures/${signatureId}/approve`, { notes });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/principal/pending-signatures"] });
      queryClient.invalidateQueries({ queryKey: ["/api/principal/stats"] });
      toast({
        title: "تم الاعتماد",
        description: "تم اعتماد المؤشر بنجاح",
      });
      setShowApprovalModal(false);
      setApprovalNotes("");
      setSelectedSignature(null);
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ signatureId, notes }: { signatureId: string; notes: string }) => {
      return apiRequest("POST", `/api/principal/signatures/${signatureId}/reject`, { notes });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/principal/pending-signatures"] });
      queryClient.invalidateQueries({ queryKey: ["/api/principal/stats"] });
      toast({
        title: "تم الرفض",
        description: "تم رفض المؤشر",
      });
      setShowApprovalModal(false);
      setApprovalNotes("");
      setSelectedSignature(null);
    },
  });

  // Creator-only: Get all users
  const { data: allUsers = [] } = useQuery<UserType[]>({
    queryKey: ["/api/creator/users"],
    enabled: user?.role === "creator",
    staleTime: 60000,
  });

  // Creator-only: Update user role
  const updateRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      return apiRequest("PATCH", `/api/creator/users/${userId}/role`, { role });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/creator/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/principal/teachers"] });
      toast({
        title: "تم التحديث",
        description: "تم تغيير صلاحية المستخدم بنجاح",
      });
    },
    onError: () => {
      toast({
        title: "خطأ",
        description: "فشل في تغيير الصلاحية",
        variant: "destructive",
      });
    },
  });

  // Delete teacher mutation
  const deleteTeacherMutation = useMutation({
    mutationFn: async (userId: string) => {
      const endpoint = user?.role === "creator"
        ? `/api/creator/users/${userId}`
        : `/api/principal/teachers/${userId}`;
      return apiRequest("DELETE", endpoint);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/principal/teachers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/creator/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/principal/stats"] });
      toast({
        title: "تم الحذف",
        description: "تم حذف المعلم بنجاح",
      });
      setDeleteConfirmOpen(false);
      setTeacherToDelete(null);
    },
    onError: () => {
      toast({
        title: "خطأ",
        description: "فشل في حذف المعلم",
        variant: "destructive",
      });
    },
  });

  // Change password mutation
  const changePasswordMutation = useMutation({
    mutationFn: async ({ userId, password }: { userId: string; password: string }) => {
      const endpoint = user?.role === "creator"
        ? `/api/creator/users/${userId}/password`
        : `/api/principal/teachers/${userId}/password`;
      return apiRequest("PATCH", endpoint, { password });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/principal/teachers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/creator/users"] });
      toast({
        title: "تم التحديث",
        description: "تم تغيير كلمة المرور بنجاح",
      });
      setPasswordModalOpen(false);
      setNewPassword("");
      setTeacherToChangePassword(null);
    },
    onError: () => {
      toast({
        title: "خطأ",
        description: "فشل في تغيير كلمة المرور",
        variant: "destructive",
      });
    },
  });

  const handleApproval = () => {
    if (!selectedSignature) return;

    if (approvalAction === "approve") {
      approveMutation.mutate({ signatureId: selectedSignature.id, notes: approvalNotes });
    } else {
      if (!approvalNotes.trim()) {
        toast({
          title: "خطأ",
          description: "يجب إدخال سبب الرفض",
          variant: "destructive",
        });
        return;
      }
      rejectMutation.mutate({ signatureId: selectedSignature.id, notes: approvalNotes });
    }
  };

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    document.documentElement.classList.toggle("dark");
  };

  const getInitials = (firstName?: string | null, lastName?: string | null) => {
    const first = firstName?.[0] || "";
    const last = lastName?.[0] || "";
    return first + last || "م";
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-500/10 text-green-600 border-green-200">مكتمل</Badge>;
      case "in_progress":
        return <Badge className="bg-amber-500/10 text-amber-600 border-amber-200">قيد الإنجاز</Badge>;
      default:
        return <Badge className="bg-gray-500/10 text-gray-600 border-gray-200">معلق</Badge>;
    }
  };

  const isAdminOrCreator = user?.role === "admin" || user?.role === "creator";
  const isCreator = user?.role === "creator";

  const getRoleBadge = (role: string | null | undefined) => {
    switch (role) {
      case "creator":
        return <Badge className="bg-purple-500/10 text-purple-600 border-purple-200 gap-1"><Crown className="h-3 w-3" />منشئ الموقع</Badge>;
      case "admin":
        return <Badge className="bg-blue-500/10 text-blue-600 border-blue-200 gap-1"><Shield className="h-3 w-3" />مدير</Badge>;
      case "supervisor":
        return <Badge className="bg-green-500/10 text-green-600 border-green-200">مشرف</Badge>;
      default:
        return <Badge className="bg-gray-500/10 text-gray-600 border-gray-200">معلم</Badge>;
    }
  };

  if (!user || !isAdminOrCreator) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background" dir="rtl">
        <Card className="p-8 text-center max-w-md">
          <AlertCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">غير مصرح</h2>
          <p className="text-muted-foreground mb-4">
            ليس لديك صلاحية للوصول إلى لوحة تحكم المدير
          </p>
          <a href="/">
            <Button>العودة للصفحة الرئيسية</Button>
          </a>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      {/* Header */}
      <header className="bg-primary text-primary-foreground py-4 px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-primary-foreground/20 flex items-center justify-center">
              <Award className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold">لوحة تحكم مدير المدرسة</h1>
              <p className="text-sm opacity-80">نظام توثيق شواهد الأداء الوظيفي</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleDarkMode}
              className="text-primary-foreground hover:bg-primary-foreground/20"
              data-testid="button-theme-toggle"
            >
              {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="text-primary-foreground hover:bg-primary-foreground/20"
              data-testid="button-logout"
              onClick={() => logoutMutation.mutate()}
              disabled={logoutMutation.isPending}
            >
              <LogOut className="h-5 w-5" />
            </Button>
            <Avatar>
              <AvatarImage src={user.profileImageUrl || undefined} />
              <AvatarFallback>{getInitials(user.firstName, user.lastName)}</AvatarFallback>
            </Avatar>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 px-4">
        {/* Analytics Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              التحليلات والإحصائيات
            </h3>
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => window.open('/api/principal/export-csv')}
              data-testid="button-export-csv"
            >
              <Download className="h-4 w-4" />
              تصدير التقرير (CSV)
            </Button>
            <Link href="/principal/cycles">
              <Button variant="outline" className="gap-2">
                <Calendar className="h-4 w-4" />
                إدارة الأعوام
              </Button>
            </Link>
          </div>
          {stats && teachers ? (
            <PrincipalAnalytics stats={stats} teachers={teachers} />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32 w-full" />)}
            </div>
          )}
        </div>

        {/* Stats Cards (Keeping these for quick overview but adding more context) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 hidden">
          <Card data-testid="card-stat-teachers">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats?.totalTeachers || 0}</p>
                  <p className="text-sm text-muted-foreground">إجمالي المعلمين</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card data-testid="card-stat-pending">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900 flex items-center justify-center">
                  <Clock className="h-6 w-6 text-amber-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats?.pendingApprovals || 0}</p>
                  <p className="text-sm text-muted-foreground">طلبات معلقة</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card data-testid="card-stat-approved">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                  <CheckCircle2 className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats?.approvedIndicators || 0}</p>
                  <p className="text-sm text-muted-foreground">مؤشرات معتمدة</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card data-testid="card-stat-indicators">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
                  <BarChart3 className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats?.totalIndicators || 0}</p>
                  <p className="text-sm text-muted-foreground">إجمالي المؤشرات</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="pending" className="space-y-4">
          <TabsList className={`grid w-full lg:w-auto lg:inline-grid ${isCreator ? 'grid-cols-3' : 'grid-cols-2'}`}>
            <TabsTrigger value="pending" className="gap-2" data-testid="tab-pending">
              <FileCheck className="h-4 w-4" />
              الطلبات المعلقة ({pendingSignatures.length})
            </TabsTrigger>
            <TabsTrigger value="teachers" className="gap-2" data-testid="tab-teachers">
              <Users className="h-4 w-4" />
              المعلمين ({teachers.length})
            </TabsTrigger>
            {isCreator && (
              <TabsTrigger value="users" className="gap-2" data-testid="tab-users">
                <UserCog className="h-4 w-4" />
                إدارة المستخدمين
              </TabsTrigger>
            )}
          </TabsList>

          {/* Pending Approvals Tab */}
          <TabsContent value="pending">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileCheck className="h-5 w-5" />
                  طلبات الاعتماد المعلقة
                </CardTitle>
              </CardHeader>
              <CardContent>
                {signaturesLoading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map(i => (
                      <Card key={i} className="overflow-visible">
                        <div className="p-5">
                          <div className="flex items-center gap-3 mb-4">
                            <Skeleton className="h-10 w-10 rounded-full" />
                            <div className="flex-1">
                              <Skeleton className="h-4 w-3/4 mb-2" />
                              <Skeleton className="h-3 w-1/2" />
                            </div>
                          </div>
                          <Skeleton className="h-3 w-full mb-4" />
                          <Skeleton className="h-9 w-full" />
                        </div>
                      </Card>
                    ))}
                  </div>
                ) : pendingSignatures.length === 0 ? (
                  <div className="text-center py-16 text-muted-foreground">
                    <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-muted/50 flex items-center justify-center">
                      <CheckCircle2 className="h-12 w-12 opacity-30" />
                    </div>
                    <p className="text-lg font-medium mb-2">لا توجد طلبات معلقة</p>
                    <p className="text-sm">جميع الطلبات تمت مراجعتها</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {pendingSignatures.map((signature) => {
                      const sigCriteria = signature.indicator?.criteria || [];
                      const sigCompleted = sigCriteria.filter(c => c.isCompleted).length;
                      const sigPct = sigCriteria.length > 0 ? Math.round((sigCompleted / sigCriteria.length) * 100) : 0;

                      return (
                        <Card
                          key={signature.id}
                          className="overflow-visible hover-elevate border-r-4 border-r-amber-500"
                          data-testid={`signature-${signature.id}`}
                        >
                          <div className="p-5">
                            <div className="flex items-start gap-3 mb-4">
                              <Avatar>
                                <AvatarImage src={signature.teacher?.profileImageUrl || undefined} />
                                <AvatarFallback>
                                  {getInitials(signature.teacher?.firstName, signature.teacher?.lastName)}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold text-sm truncate" data-testid={`text-signature-teacher-${signature.id}`}>
                                  {signature.teacher?.firstName} {signature.teacher?.lastName}
                                </p>
                                <p className="text-xs text-muted-foreground truncate">
                                  {signature.teacher?.specialization || "معلم"}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-start gap-3 mb-4">
                              <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                                {getIndicatorIcon(signature.indicator?.title || "")}
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="font-bold text-sm leading-tight line-clamp-2 mb-1" data-testid={`text-signature-indicator-${signature.id}`}>
                                  {signature.indicator?.title}
                                </h4>
                                <div className="flex items-center gap-2 flex-wrap">
                                  {getStatusBadge(signature.indicator?.status || "pending")}
                                  <span className="text-xs text-muted-foreground">
                                    {sigCriteria.length} معايير
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="mb-4">
                              <div className="flex items-center justify-between mb-1.5">
                                <span className="text-xs text-muted-foreground">{sigCompleted} / {sigCriteria.length} معيار</span>
                                <span className={`text-xs font-bold ${sigPct === 100 ? "text-green-600" : "text-muted-foreground"}`}>{sigPct}%</span>
                              </div>
                              <Progress value={sigPct} className="h-2" />
                            </div>
                          </div>

                          <div className="border-t px-5 py-3 bg-muted/20 flex gap-2">
                            <Button
                              size="sm"
                              className="flex-1 gap-1"
                              onClick={() => {
                                setSelectedSignature(signature);
                                setApprovalAction("approve");
                                setShowApprovalModal(true);
                              }}
                              data-testid={`button-approve-${signature.id}`}
                            >
                              <ThumbsUp className="h-4 w-4" />
                              اعتماد
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="flex-1 gap-1 text-destructive"
                              onClick={() => {
                                setSelectedSignature(signature);
                                setApprovalAction("reject");
                                setShowApprovalModal(true);
                              }}
                              data-testid={`button-reject-${signature.id}`}
                            >
                              <ThumbsDown className="h-4 w-4" />
                              رفض
                            </Button>
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Teachers Tab */}
          <TabsContent value="teachers">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Teachers List */}
              <Card className="lg:col-span-1">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    قائمة المعلمين
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  {teachersLoading ? (
                    <div className="text-center py-8 text-muted-foreground">جاري التحميل...</div>
                  ) : teachers.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>لا يوجد معلمين</p>
                    </div>
                  ) : (
                    <div className="divide-y">
                      {teachers.map((teacher) => (
                        <div
                          key={teacher.id}
                          className={`p-4 cursor-pointer hover-elevate ${selectedTeacher?.id === teacher.id ? "bg-accent" : ""
                            }`}
                          onClick={() => setSelectedTeacher(teacher)}
                          data-testid={`teacher-${teacher.id}`}
                        >
                          <div className="flex items-center gap-3">
                            <Avatar>
                              <AvatarImage src={teacher.profileImageUrl || undefined} />
                              <AvatarFallback>
                                {getInitials(teacher.firstName, teacher.lastName)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">
                                {teacher.firstName} {teacher.lastName}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {teacher.indicatorCount} مؤشر • {teacher.completedCount} مكتمل
                              </p>
                            </div>
                            {teacher.pendingApprovalCount > 0 && (
                              <Badge variant="secondary">{teacher.pendingApprovalCount}</Badge>
                            )}
                            <div className="flex items-center gap-1">
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setTeacherToChangePassword(teacher);
                                  setPasswordModalOpen(true);
                                }}
                                data-testid={`button-change-password-${teacher.id}`}
                              >
                                <KeyRound className="h-4 w-4" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setTeacherToDelete(teacher);
                                  setDeleteConfirmOpen(true);
                                }}
                                data-testid={`button-delete-teacher-${teacher.id}`}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                            <ChevronLeft className="h-4 w-4 text-muted-foreground" />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Teacher Details */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5" />
                    {selectedTeacher
                      ? `مؤشرات ${selectedTeacher.firstName} ${selectedTeacher.lastName}`
                      : "اختر معلماً لعرض مؤشراته"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {!selectedTeacher ? (
                    <div className="text-center py-16 text-muted-foreground">
                      <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-muted/50 flex items-center justify-center">
                        <Eye className="h-12 w-12 opacity-30" />
                      </div>
                      <p className="text-lg font-medium mb-2">اختر معلماً لعرض مؤشراته وأعماله</p>
                      <p className="text-sm">اختر معلماً من القائمة لعرض التفاصيل</p>
                    </div>
                  ) : (
                    <Tabs defaultValue="indicators" className="space-y-4">
                      <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
                        <TabsTrigger value="indicators">المؤشرات</TabsTrigger>
                        <TabsTrigger value="nafes">أعمال نافس</TabsTrigger>
                      </TabsList>

                      <TabsContent value="indicators">
                        {teacherIndicators.length === 0 ? (
                          <div className="text-center py-16 text-muted-foreground">
                            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-muted/50 flex items-center justify-center">
                              <BookOpen className="h-12 w-12 opacity-30" />
                            </div>
                            <p className="text-lg font-medium mb-2">لا توجد مؤشرات</p>
                            <p className="text-sm">لم يضف هذا المعلم أي مؤشرات بعد</p>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {teacherIndicators.map((indicator) => {
                              const completedCriteria = indicator.criteria?.filter(c => c.isCompleted).length || 0;
                              const totalCriteria = indicator.criteria?.length || 0;
                              const pct = totalCriteria > 0 ? Math.round((completedCriteria / totalCriteria) * 100) : 0;
                              const witnessTotal = (indicator.witnesses?.length) || (indicator.witnessCount || 0);

                              return (
                                <Card
                                  key={indicator.id}
                                  className={`overflow-visible transition-all hover-elevate ${indicator.status === "completed"
                                    ? "border-r-4 border-r-green-500"
                                    : indicator.status === "in_progress"
                                      ? "border-r-4 border-r-amber-500"
                                      : "border-r-4 border-r-muted-foreground/30"
                                    }`}
                                  data-testid={`indicator-${indicator.id}`}
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
                                        <h4 className="font-bold text-sm leading-tight line-clamp-2 mb-1" data-testid={`text-indicator-title-${indicator.id}`}>{indicator.title}</h4>
                                        <div className="flex items-center gap-2 flex-wrap">
                                          {indicator.weight ? (
                                            <Badge variant="secondary" className="text-xs">{indicator.weight}%</Badge>
                                          ) : null}
                                          {getStatusBadge(indicator.status || "pending")}
                                        </div>
                                      </div>
                                    </div>

                                    <div className="mb-4">
                                      <div className="flex items-center justify-between mb-1.5">
                                        <span className="text-xs text-muted-foreground">{completedCriteria} / {totalCriteria} معيار</span>
                                        <span className={`text-xs font-bold ${pct === 100 ? "text-green-600" : "text-muted-foreground"}`}>{pct}%</span>
                                      </div>
                                      <Progress value={pct} className="h-2" />
                                    </div>

                                    <div className="flex items-center justify-between gap-2 mb-3">
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
                                          <Badge variant="secondary" className="gap-1 text-xs" data-testid={`badge-witness-count-${indicator.id}`}>
                                            <Eye className="h-3 w-3" />
                                            {indicator.witnessCount || 0} شاهد
                                          </Badge>
                                        )}
                                      </div>
                                    </div>
                                  </div>

                                  <div className="border-t px-5 py-3 bg-muted/20">
                                    <Button
                                      className="w-full gap-2"
                                      onClick={() => setExpandedWitnessIndicator(
                                        expandedWitnessIndicator === indicator.id ? null : indicator.id
                                      )}
                                      data-testid={`button-review-evidence-${indicator.id}`}
                                    >
                                      <Eye className="h-4 w-4" />
                                      مراجعة الشواهد ({witnessTotal})
                                    </Button>
                                  </div>

                                  {expandedWitnessIndicator === indicator.id && (
                                    <div className="px-4 pb-4 border-t bg-muted/20">
                                      {principalWitnessesLoading ? (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-3">
                                          <Skeleton className="h-24 w-full rounded-xl" />
                                          <Skeleton className="h-24 w-full rounded-xl" />
                                        </div>
                                      ) : !principalWitnesses || principalWitnesses.length === 0 ? (
                                        <div className="text-center py-6" data-testid="text-no-witnesses">
                                          <FileText className="h-10 w-10 mx-auto mb-2 text-muted-foreground opacity-30" />
                                          <p className="text-sm text-muted-foreground">لا توجد شواهد مرفقة</p>
                                        </div>
                                      ) : (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-3">
                                          {principalWitnesses.map((witness) => {
                                            const iconConfig = witness.fileType === "pdf"
                                              ? { icon: FileText, color: "text-red-500", bg: "bg-red-100 dark:bg-red-900/30", label: "PDF" }
                                              : witness.fileType === "image"
                                                ? { icon: Image, color: "text-green-500", bg: "bg-green-100 dark:bg-green-900/30", label: "صورة" }
                                                : witness.fileType === "video"
                                                  ? { icon: Video, color: "text-blue-500", bg: "bg-blue-100 dark:bg-blue-900/30", label: "فيديو" }
                                                  : { icon: File, color: "text-muted-foreground", bg: "bg-muted", label: "مستند" };
                                            const WitnessIcon = iconConfig.icon;
                                            return (
                                              <Card
                                                key={witness.id}
                                                className="overflow-visible hover-elevate cursor-pointer transition-all"
                                                onClick={() => {
                                                  if (witness.fileUrl) {
                                                    setSelectedWitness(witness);
                                                    setShowEvidenceReview(true);
                                                  }
                                                }}
                                                data-testid={`principal-witness-${witness.id}`}
                                              >
                                                <div className="p-4 flex items-center gap-4">
                                                  <div className={`w-12 h-12 rounded-xl ${iconConfig.bg} flex items-center justify-center shrink-0`} data-testid={`icon-witness-type-${witness.id}`}>
                                                    <WitnessIcon className={`h-6 w-6 ${iconConfig.color}`} />
                                                  </div>
                                                  <div className="flex-1 min-w-0">
                                                    <h5 className="font-bold text-sm truncate mb-1" data-testid={`text-witness-title-${witness.id}`}>
                                                      {witness.title}
                                                    </h5>
                                                    <Badge variant="outline" className="text-[10px]" data-testid={`badge-witness-type-${witness.id}`}>{iconConfig.label}</Badge>
                                                  </div>
                                                  <div className="flex gap-1 shrink-0">
                                                    <Button
                                                      size="sm"
                                                      className="gap-1.5"
                                                      style={{ backgroundColor: "#006C35" }}
                                                      onClick={(e) => {
                                                        e.stopPropagation();
                                                        if (witness.fileUrl) {
                                                          setSelectedWitness(witness);
                                                          setShowEvidenceReview(true);
                                                        }
                                                      }}
                                                      data-testid={`button-review-witness-${witness.id}`}
                                                    >
                                                      <Eye className="h-3.5 w-3.5" />
                                                      معاينة ذكية
                                                    </Button>
                                                    <Button
                                                      size="icon"
                                                      variant="ghost"
                                                      onClick={(e) => {
                                                        e.stopPropagation();
                                                        const link = document.createElement("a");
                                                        link.href = witness.fileUrl!;
                                                        link.download = witness.fileName || "شاهد";
                                                        link.click();
                                                      }}
                                                      data-testid={`button-download-principal-witness-${witness.id}`}
                                                    >
                                                      <Download className="h-4 w-4" />
                                                    </Button>
                                                  </div>
                                                </div>
                                              </Card>
                                            );
                                          })}
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </Card>
                              );
                            })}
                          </div>
                        )}
                      </TabsContent>

                      <TabsContent value="nafes">
                        <Card className="border-none shadow-none">
                          <CardHeader className="px-0">
                            <CardTitle className="text-lg">أعمال نافس</CardTitle>
                          </CardHeader>
                          <CardContent className="px-0">
                            {nafesLoading ? (
                              <div className="text-center py-8 text-muted-foreground">جاري تحميل الشواهد...</div>
                            ) : nafesFiles.length === 0 ? (
                              <div className="text-center py-12 text-muted-foreground">
                                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted/50 flex items-center justify-center">
                                  <FileText className="h-8 w-8 opacity-30" />
                                </div>
                                <p className="font-medium">لا توجد أعمال نافس</p>
                                <p className="text-sm mt-1">لم يقم هذا المعلم برفع أي شواهد لتطبيقات نافس بعد</p>
                              </div>
                            ) : (
                              <div className="space-y-4">
                                {nafesFiles.map((file) => (
                                  <Card key={file.id} className="p-4 flex items-center gap-4 hover:shadow-sm transition-all border-muted group">
                                    <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center shrink-0">
                                      {file.fileType === "image" ? (
                                        <Image className="h-6 w-6 text-green-500" />
                                      ) : file.fileType === "pdf" ? (
                                        <FileText className="h-6 w-6 text-red-500" />
                                      ) : (
                                        <File className="h-6 w-6 text-blue-500" />
                                      )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <h4 className="font-semibold text-sm truncate mb-1">{file.title}</h4>
                                      <p className="text-xs text-muted-foreground">{file.fileName} • {(Number(file.fileSize || 0) / 1024 / 1024).toFixed(2)} MB</p>
                                    </div>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="gap-2"
                                      onClick={() => {
                                        if (file.fileUrl) window.open(file.fileUrl, '_blank');
                                      }}
                                    >
                                      <Eye className="h-4 w-4" />
                                      عرض
                                    </Button>
                                  </Card>
                                ))}
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      </TabsContent>
                    </Tabs>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* User Management Tab (Creator Only) */}
          {isCreator && (
            <TabsContent value="users">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                        <Crown className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                      </div>
                      <div>
                        <CardTitle>إدارة المستخدمين</CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">
                          تحكم في صلاحيات جميع المستخدمين
                        </p>
                      </div>
                    </div>
                    <Badge className="bg-purple-500/10 text-purple-600 border-purple-200">
                      {allUsers.length} مستخدم
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  {allUsers.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <Users className="h-16 w-16 mx-auto mb-4 opacity-30" />
                      <p>لا يوجد مستخدمين مسجلين</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {allUsers.map((u) => (
                        <div
                          key={u.id}
                          className="flex items-center justify-between p-4 border rounded-lg hover-elevate"
                          data-testid={`user-row-${u.id}`}
                        >
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={u.profileImageUrl || ""} />
                              <AvatarFallback className="bg-primary/10">
                                {getInitials(u.firstName, u.lastName)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">
                                {u.firstName} {u.lastName}
                              </p>
                              <p className="text-sm text-muted-foreground">{u.email}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            {getRoleBadge(u.role)}
                            <Select
                              value={u.role || "teacher"}
                              onValueChange={(role) => updateRoleMutation.mutate({ userId: u.id, role })}
                              disabled={u.id === user.id}
                            >
                              <SelectTrigger className="w-36" data-testid={`select-role-${u.id}`}>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="creator">منشئ الموقع</SelectItem>
                                <SelectItem value="admin">مدير</SelectItem>
                                <SelectItem value="supervisor">مشرف</SelectItem>
                                <SelectItem value="teacher">معلم</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-6 px-4 mt-8">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-sm text-muted-foreground">
            نظام توثيق شواهد الأداء الوظيفي - نظام إلكتروني متكامل
          </p>
          <p className="text-sm text-muted-foreground mt-2 font-medium">
            الصفحة من إعداد عبدالعزيز الخلفان
          </p>
        </div>
      </footer>

      {/* Approval Modal */}
      <Dialog open={showApprovalModal} onOpenChange={setShowApprovalModal}>
        <DialogContent className="sm:max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle>
              {approvalAction === "approve" ? "اعتماد المؤشر" : "رفض المؤشر"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {selectedSignature && (
              <div className="p-4 bg-muted rounded-lg">
                <p className="font-medium">{selectedSignature.indicator?.title}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  المعلم: {selectedSignature.teacher?.firstName} {selectedSignature.teacher?.lastName}
                </p>
              </div>
            )}
            <div>
              <label className="text-sm font-medium mb-2 block">
                {approvalAction === "approve" ? "ملاحظات (اختياري)" : "سبب الرفض (إجباري)"}
              </label>
              <Textarea
                value={approvalNotes}
                onChange={(e) => setApprovalNotes(e.target.value)}
                placeholder={
                  approvalAction === "approve"
                    ? "أضف ملاحظاتك هنا..."
                    : "يرجى توضيح سبب الرفض..."
                }
                rows={3}
                data-testid="input-approval-notes"
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setShowApprovalModal(false)}
              data-testid="button-cancel-approval"
            >
              إلغاء
            </Button>
            <Button
              onClick={handleApproval}
              disabled={approveMutation.isPending || rejectMutation.isPending}
              className={approvalAction === "reject" ? "bg-destructive hover:bg-destructive/90" : ""}
              data-testid="button-confirm-approval"
            >
              {approveMutation.isPending || rejectMutation.isPending
                ? "جاري المعالجة..."
                : approvalAction === "approve"
                  ? "تأكيد الاعتماد"
                  : "تأكيد الرفض"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent className="sm:max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <Trash2 className="h-5 w-5" />
              تأكيد حذف المعلم
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-muted-foreground">
              هل أنت متأكد من حذف المعلم{" "}
              <strong className="text-foreground">
                {teacherToDelete?.firstName} {teacherToDelete?.lastName}
              </strong>
              ؟
            </p>
            <p className="text-sm text-destructive mt-2">
              سيتم حذف جميع بيانات المعلم بما في ذلك المؤشرات والشواهد. لا يمكن التراجع عن هذا الإجراء.
            </p>
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setDeleteConfirmOpen(false);
                setTeacherToDelete(null);
              }}
              data-testid="button-cancel-delete"
            >
              إلغاء
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (teacherToDelete) {
                  deleteTeacherMutation.mutate(teacherToDelete.id);
                }
              }}
              disabled={deleteTeacherMutation.isPending}
              data-testid="button-confirm-delete"
            >
              {deleteTeacherMutation.isPending ? "جاري الحذف..." : "تأكيد الحذف"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Change Password Modal */}
      <Dialog open={passwordModalOpen} onOpenChange={setPasswordModalOpen}>
        <DialogContent className="sm:max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <KeyRound className="h-5 w-5 text-primary" />
              تغيير كلمة المرور
            </DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">المعلم:</p>
              <p className="font-medium">
                {teacherToChangePassword?.firstName} {teacherToChangePassword?.lastName}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">كلمة المرور الجديدة</label>
              <Input
                type="text"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="أدخل كلمة المرور الجديدة"
                data-testid="input-new-password"
              />
              <p className="text-xs text-muted-foreground mt-1">
                يجب أن تكون كلمة المرور 4 أحرف على الأقل
              </p>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setPasswordModalOpen(false);
                setNewPassword("");
                setTeacherToChangePassword(null);
              }}
              data-testid="button-cancel-password"
            >
              إلغاء
            </Button>
            <Button
              onClick={() => {
                if (teacherToChangePassword && newPassword.length >= 4) {
                  changePasswordMutation.mutate({
                    userId: teacherToChangePassword.id,
                    password: newPassword,
                  });
                }
              }}
              disabled={changePasswordMutation.isPending || newPassword.length < 4}
              data-testid="button-confirm-password"
            >
              {changePasswordMutation.isPending ? "جاري التحديث..." : "تغيير كلمة المرور"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <EvidenceReviewModal
        isOpen={showEvidenceReview}
        onClose={() => setShowEvidenceReview(false)}
        indicatorTitle={selectedWitness?.indicatorId ? teacherIndicators.find(i => i.id === selectedWitness.indicatorId)?.title || "" : ""}
        teacherName={selectedTeacher ? `${selectedTeacher.firstName} ${selectedTeacher.lastName}` : ""}
        fileUrl={selectedWitness ? `/api/witnesses/${selectedWitness.id}/download` : ""}
        onApprove={() => {
          if (selectedWitness?.indicatorId) {
            const signature = pendingSignatures.find(s => s.indicatorId === selectedWitness.indicatorId);
            if (signature) {
              approveMutation.mutate({ signatureId: signature.id });
            } else {
              toast({ title: "ملاحظة", description: "لم يتم تقديم المؤشر للاعتماد بعد", variant: "default" });
            }
          }
          setShowEvidenceReview(false);
        }}
        onReject={(notes) => {
          if (selectedWitness?.indicatorId) {
            const signature = pendingSignatures.find(s => s.indicatorId === selectedWitness.indicatorId);
            if (signature) {
              rejectMutation.mutate({ signatureId: signature.id, notes });
            } else {
              toast({ title: "ملاحظة", description: "لم يتم تقديم المؤشر للاعتماد بعد", variant: "default" });
            }
          }
          setShowEvidenceReview(false);
        }}
      />
    </div>
  );
}
