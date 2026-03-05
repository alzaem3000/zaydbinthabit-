import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    ArrowRight, FileCheck, ChevronDown, ChevronUp, Upload, Link as LinkIcon,
    X, CheckCircle2, Briefcase, Users, UserCheck, Lightbulb, TrendingUp,
    Calendar, Monitor, Home, UserCog, BarChart, CheckCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import imageCompression from "browser-image-compression";
import { PERFORMANCE_STANDARDS_FALLBACK } from "@/lib/constants";
import type { IndicatorWithCriteria } from "@shared/schema";

const ICON_COLORS = [
    { bg: "bg-blue-100 dark:bg-blue-950", text: "text-blue-600 dark:text-blue-400", border: "border-blue-200 dark:border-blue-800", badge: "bg-blue-600" },
    { bg: "bg-emerald-100 dark:bg-emerald-950", text: "text-emerald-600 dark:text-emerald-400", border: "border-emerald-200 dark:border-emerald-800", badge: "bg-emerald-600" },
    { bg: "bg-violet-100 dark:bg-violet-950", text: "text-violet-600 dark:text-violet-400", border: "border-violet-200 dark:border-violet-800", badge: "bg-violet-600" },
    { bg: "bg-amber-100 dark:bg-amber-950", text: "text-amber-600 dark:text-amber-400", border: "border-amber-200 dark:border-amber-800", badge: "bg-amber-600" },
    { bg: "bg-rose-100 dark:bg-rose-950", text: "text-rose-600 dark:text-rose-400", border: "border-rose-200 dark:border-rose-800", badge: "bg-rose-600" },
    { bg: "bg-cyan-100 dark:bg-cyan-950", text: "text-cyan-600 dark:text-cyan-400", border: "border-cyan-200 dark:border-cyan-800", badge: "bg-cyan-600" },
    { bg: "bg-indigo-100 dark:bg-indigo-950", text: "text-indigo-600 dark:text-indigo-400", border: "border-indigo-200 dark:border-indigo-800", badge: "bg-indigo-600" },
    { bg: "bg-teal-100 dark:bg-teal-950", text: "text-teal-600 dark:text-teal-400", border: "border-teal-200 dark:border-teal-800", badge: "bg-teal-600" },
    { bg: "bg-orange-100 dark:bg-orange-950", text: "text-orange-600 dark:text-orange-400", border: "border-orange-200 dark:border-orange-800", badge: "bg-orange-600" },
    { bg: "bg-pink-100 dark:bg-pink-950", text: "text-pink-600 dark:text-pink-400", border: "border-pink-200 dark:border-pink-800", badge: "bg-pink-600" },
    { bg: "bg-lime-100 dark:bg-lime-950", text: "text-lime-600 dark:text-lime-400", border: "border-lime-200 dark:border-lime-800", badge: "bg-lime-600" },
];

// --- Inline Upload Panel for each evidence example ---
function EvidenceUploadPanel({
    evidenceName,
    standardId,
    indicators,
    indicatorsLoading,
    colorClass,
    onClose,
    onSuccess,
}: {
    evidenceName: string;
    standardId: number;
    indicators: IndicatorWithCriteria[];
    indicatorsLoading: boolean;
    colorClass: { bg: string; text: string; border: string; badge: string };
    onClose: () => void;
    onSuccess: () => void;
}) {
    // تصفية المؤشرات لعرض المرتبطة بهذا المعيار فقط
    const relatedIndicators = indicators.filter(
        (ind) => ind.performanceStandardId === standardId
    );
    const autoIndicator = relatedIndicators.length === 1 ? relatedIndicators[0] : null;

    const [uploadType, setUploadType] = useState<"file" | "link">("file");
    const [file, setFile] = useState<File | null>(null);
    const [fileData, setFileData] = useState<string | null>(null);
    const [link, setLink] = useState("");
    // إذا كان هناك مؤشر واحد فقط، يُختار تلقائيًا
    const [selectedIndicatorId, setSelectedIndicatorId] = useState<string>(
        autoIndicator ? autoIndicator.id : ""
    );
    const [isCompressing, setIsCompressing] = useState(false);
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) {
            const original = e.target.files[0];
            let finalFile = original;
            if (original.type.startsWith("image/")) {
                setIsCompressing(true);
                toast({
                    title: "جاري المعالجة",
                    description: "يتم الآن ضغط الصورة لتقليل حجمها...",
                    duration: 3000,
                });
                try {
                    finalFile = await imageCompression(original, { maxSizeMB: 0.8, maxWidthOrHeight: 1920, useWebWorker: true });
                } catch { /* use original */ } finally { setIsCompressing(false); }
            }
            setFile(finalFile);
            const reader = new FileReader();
            reader.onloadend = () => setFileData(reader.result as string);
            reader.readAsDataURL(finalFile);
        }
    };

    const effectiveIndicatorId = autoIndicator ? autoIndicator.id : selectedIndicatorId;

    const uploadMutation = useMutation({
        mutationFn: async () => {
            if (!effectiveIndicatorId) throw new Error("لا يوجد مؤشر مرتبط بهذا المعيار");
            const payload = {
                title: evidenceName,
                description: evidenceName,
                indicatorId: effectiveIndicatorId,
                fileType: uploadType === "file" ? (file ? file.type.split("/")[1] : "unknown") : "link",
                fileName: uploadType === "file" ? (file?.name || "witness") : "link",
                fileData: uploadType === "file" ? fileData : null,
                link: uploadType === "link" ? link : null,
            };
            await apiRequest("POST", `/api/indicators/${effectiveIndicatorId}/witnesses`, payload);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/indicators"] });
            toast({ title: "✅ تم الرفع", description: `تم رفع "${evidenceName}" بنجاح` });
            onSuccess();
        },
        onError: (err: any) => {
            toast({ title: "خطأ", description: err.message || "فشل في رفع الشاهد", variant: "destructive" });
        },
    });

    const canSubmit = effectiveIndicatorId && (
        (uploadType === "file" && !!fileData) ||
        (uploadType === "link" && link.startsWith("http"))
    );

    return (
        <div className={`mt-2 rounded-xl border-2 ${colorClass.border} bg-white dark:bg-slate-900 shadow-md p-4 animate-in fade-in slide-in-from-top-2 duration-200`}>
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
                <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
                    <X className="h-4 w-4 text-muted-foreground" />
                </button>
                <div className="text-right">
                    <p className="text-xs font-bold text-slate-700 dark:text-slate-300">رفع شاهد</p>
                    <p className={`text-xs truncate max-w-[260px] ${colorClass.text}`}>{evidenceName}</p>
                </div>
            </div>

            {/* Indicator selector */}
            {indicatorsLoading ? (
                // جاري التحميل → skeleton
                <div className={`mb-3 p-3 rounded-xl border-2 ${colorClass.border} ${colorClass.bg} flex items-center gap-2 animate-pulse`}>
                    <div className="h-4 w-4 rounded bg-current opacity-20" />
                    <div className="h-3 flex-1 rounded bg-current opacity-20" />
                </div>
            ) : autoIndicator ? (
                // مؤشر واحد مرتبط → ربط تلقائي
                <div className={`mb-3 p-2.5 rounded-xl border ${colorClass.border} ${colorClass.bg} flex items-center gap-2`}>
                    <CheckCircle className={`h-4 w-4 flex-shrink-0 ${colorClass.text}`} />
                    <div className="flex-1 text-right min-w-0">
                        <p className="text-[10px] text-slate-500">سيُرفع للمؤشر المرتبط تلقائيًا</p>
                        <p className={`text-xs font-bold truncate ${colorClass.text}`}>{autoIndicator.title}</p>
                    </div>
                </div>
            ) : indicators.length === 0 ? (
                // لا توجد مؤشرات أصلاً → إخفاء كامل
                <div className={`mb-3 p-3 rounded-xl border-2 ${colorClass.border} ${colorClass.bg} text-center`}>
                    <p className={`text-xs font-bold ${colorClass.text} mb-1`}>⚠️ لا توجد مؤشرات بعد</p>
                    <p className="text-[11px] text-slate-500">أضف مؤشراً أولاً من لوحة التحكم</p>
                </div>
            ) : (
                // عرض كل المؤشرات مع تمييز المرتبطة بهذا المعيار
                <div className="mb-3">
                    <Label className="text-xs font-bold mb-1.5 block">
                        {relatedIndicators.length > 0
                            ? `اختر المؤشر لهذا المعيار (${relatedIndicators.length} مرتبط)`
                            : "اختر المؤشر"}
                    </Label>
                    <Select value={selectedIndicatorId} onValueChange={setSelectedIndicatorId}>
                        <SelectTrigger className="h-9 text-sm">
                            <SelectValue placeholder="اختر مؤشراً..." />
                        </SelectTrigger>
                        <SelectContent>
                            {relatedIndicators.length > 0 && (
                                <>
                                    <div className="px-2 py-1 text-[10px] text-muted-foreground font-bold">مرتبط بهذا المعيار ✓</div>
                                    {relatedIndicators.map(ind => (
                                        <SelectItem key={ind.id} value={ind.id}>
                                            <span className="text-xs font-medium">{ind.title}</span>
                                        </SelectItem>
                                    ))}
                                    <div className="px-2 py-1 text-[10px] text-muted-foreground font-bold border-t mt-1 pt-1">مؤشرات أخرى</div>
                                </>
                            )}
                            {indicators
                                .filter(ind => !relatedIndicators.find(r => r.id === ind.id))
                                .map(ind => (
                                    <SelectItem key={ind.id} value={ind.id}>
                                        <span className="text-xs">{ind.title}</span>
                                    </SelectItem>
                                ))}
                        </SelectContent>
                    </Select>
                </div>
            )}

            {/* Upload type tabs */}
            <Tabs value={uploadType} onValueChange={(v: any) => setUploadType(v)}>
                <TabsList className="grid grid-cols-2 h-8 mb-2">
                    <TabsTrigger value="file" className="text-xs">📎 ملف</TabsTrigger>
                    <TabsTrigger value="link" className="text-xs">🔗 رابط</TabsTrigger>
                </TabsList>

                <TabsContent value="file">
                    <div className="relative border-2 border-dashed rounded-xl p-4 text-center hover:border-primary/50 transition-all cursor-pointer group h-20 flex items-center justify-center">
                        <input
                            type="file"
                            onChange={handleFileChange}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                        />
                        <div className="flex flex-col items-center gap-1">
                            <Upload className="h-5 w-5 text-muted-foreground group-hover:text-primary" />
                            <span className="text-xs text-muted-foreground truncate max-w-[200px]">
                                {file ? file.name : "اضغط لاختيار الملف"}
                            </span>
                            {isCompressing && <span className="text-[10px] text-amber-500 animate-pulse">جاري الضغط...</span>}
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="link">
                    <div className="relative">
                        <LinkIcon className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            value={link}
                            onChange={e => setLink(e.target.value)}
                            className="pr-9 h-9 text-sm"
                            placeholder="https://drive.google.com/..."
                        />
                    </div>
                </TabsContent>
            </Tabs>

            {/* Submit — إخفاء الزر فقط إن لم يوجد أي مؤشر أصلاً */}
            {indicators.length > 0 && (
                <Button
                    onClick={() => uploadMutation.mutate()}
                    disabled={!canSubmit || uploadMutation.isPending}
                    className={`w-full mt-3 h-9 text-sm font-bold text-white ${colorClass.badge}`}
                >
                    {uploadMutation.isPending ? "جاري الرفع..." : "حفظ الشاهد ✓"}
                </Button>
            )}
        </div>
    );
}

// --- Main Page ---
export default function StandardsPage() {
    const [, setLocation] = useLocation();
    const [expandedCards, setExpandedCards] = useState<Set<number>>(new Set([1]));
    // Track which evidence example has its upload panel open: key = `${standardId}-${evidenceIdx}`
    const [openUpload, setOpenUpload] = useState<string | null>(null);
    const [uploadedKeys, setUploadedKeys] = useState<Set<string>>(new Set());

    const { data: indicators = [], isLoading: indicatorsLoading } = useQuery<IndicatorWithCriteria[]>({
        queryKey: ["/api/indicators"],
    });

    const toggleCard = (id: number) => {
        setExpandedCards(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const expandAll = () => setExpandedCards(new Set(PERFORMANCE_STANDARDS_FALLBACK.map(s => s.id)));
    const collapseAll = () => setExpandedCards(new Set());

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950" dir="rtl">
            {/* Header */}
            <div className="sticky top-0 z-10 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-600 rounded-xl">
                            <FileCheck className="h-5 w-5 text-white" />
                        </div>
                        <div>
                            <h1 className="text-lg font-bold text-slate-800 dark:text-slate-100">معايير الأداء الوظيفي</h1>
                            <p className="text-xs text-slate-500 dark:text-slate-400">11 معياراً - وزارة التعليم</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={expandAll} className="text-xs hidden sm:flex">فتح الكل</Button>
                        <Button variant="outline" size="sm" onClick={collapseAll} className="text-xs hidden sm:flex">طي الكل</Button>
                        <Button variant="ghost" size="sm" onClick={() => setLocation("/home")} className="gap-1 text-xs">
                            <ArrowRight className="h-4 w-4" />رجوع
                        </Button>
                    </div>
                </div>
            </div>

            {/* Body */}
            <div className="max-w-5xl mx-auto px-4 pt-8 pb-8">
                {/* Hero */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 text-sm font-medium mb-3">
                        <FileCheck className="h-4 w-4" />
                        دليل شواهد الأداء الوظيفي
                    </div>
                    <h2 className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-slate-100 mb-2">المعايير الوزارية الـ 11</h2>
                    <p className="text-slate-500 dark:text-slate-400 text-sm max-w-xl mx-auto">
                        اضغط على أي مثال لرفع شاهده مباشرةً وربطه بأحد مؤشراتك
                    </p>
                    {/* Quick nav */}
                    <div className="flex flex-wrap justify-center gap-2 mt-4">
                        {PERFORMANCE_STANDARDS_FALLBACK.map((s, i) => (
                            <button
                                key={s.id}
                                onClick={() => {
                                    setExpandedCards(prev => new Set([...prev, s.id]));
                                    document.getElementById(`standard-${s.id}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
                                }}
                                className={`px-3 py-1 rounded-full text-xs font-medium text-white transition-transform hover:scale-105 ${ICON_COLORS[i].badge}`}
                            >
                                {s.id}. {s.title.split(" ").slice(0, 2).join(" ")}...
                            </button>
                        ))}
                    </div>
                </div>

                {/* Cards */}
                <div className="grid grid-cols-1 gap-4">
                    {PERFORMANCE_STANDARDS_FALLBACK.map((standard, index) => {
                        const color = ICON_COLORS[index % ICON_COLORS.length];
                        const isExpanded = expandedCards.has(standard.id);
                        const IconComponent = standard.icon;

                        return (
                            <div
                                key={standard.id}
                                id={`standard-${standard.id}`}
                                className={`rounded-2xl border bg-white dark:bg-slate-900 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden ${color.border}`}
                            >
                                {/* Card header */}
                                <button onClick={() => toggleCard(standard.id)} className="w-full text-right">
                                    <div className="flex items-center gap-4 p-5">
                                        <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-bold text-white text-sm ${color.badge}`}>
                                            {standard.id}
                                        </div>
                                        <div className={`flex-shrink-0 p-2.5 rounded-xl ${color.bg}`}>
                                            <IconComponent className={`h-5 w-5 ${color.text}`} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base">{standard.title}</h3>
                                                <Badge variant="outline" className={`text-xs font-bold border-0 text-white ${color.badge}`}>
                                                    {standard.weight}
                                                </Badge>
                                            </div>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">{standard.description}</p>
                                        </div>
                                        <div className={`flex-shrink-0 p-1.5 rounded-lg ${color.bg} ${color.text}`}>
                                            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                        </div>
                                    </div>
                                </button>

                                {/* Expandable section */}
                                {isExpanded && (
                                    <div className={`px-5 pb-5 border-t ${color.border}`}>
                                        <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mt-4 mb-3 flex items-center gap-1.5">
                                            <span className={`inline-block w-2 h-2 rounded-full ${color.badge}`}></span>
                                            أمثلة الشواهد — اضغط "رفع" لتوثيق شاهد مباشرةً ({standard.suggestedEvidence.length} مثال)
                                        </p>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            {standard.suggestedEvidence.map((evidence, idx) => {
                                                const uploadKey = `${standard.id}-${idx}`;
                                                const isUploadOpen = openUpload === uploadKey;
                                                const isDone = uploadedKeys.has(uploadKey);

                                                return (
                                                    <div key={idx} className="flex flex-col gap-0">
                                                        {/* Evidence row */}
                                                        <div className={`flex items-center gap-2.5 p-3 rounded-xl border bg-white dark:bg-slate-800/50 ${color.border} transition-all ${isDone ? "border-green-400 bg-green-50 dark:bg-green-950/20" : ""}`}>
                                                            {/* Number */}
                                                            <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white ${isDone ? "bg-green-500" : color.badge}`}>
                                                                {isDone ? <CheckCircle2 className="h-3.5 w-3.5" /> : idx + 1}
                                                            </div>
                                                            {/* Text */}
                                                            <span className={`flex-1 text-sm leading-relaxed ${isDone ? "text-green-700 dark:text-green-400" : "text-slate-700 dark:text-slate-300"}`}>
                                                                {evidence}
                                                                {isDone && <span className="mr-2 text-[10px] font-bold text-green-600 bg-green-100 dark:bg-green-900 px-1.5 py-0.5 rounded-full">تم الرفع ✓</span>}
                                                            </span>
                                                            {/* Upload toggle button */}
                                                            <button
                                                                onClick={() => setOpenUpload(isUploadOpen ? null : uploadKey)}
                                                                className={`flex-shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all ${isUploadOpen
                                                                    ? "bg-red-100 text-red-600 hover:bg-red-200"
                                                                    : isDone
                                                                        ? "bg-green-100 text-green-600 hover:bg-green-200"
                                                                        : `${color.bg} ${color.text} hover:opacity-80`
                                                                    }`}
                                                            >
                                                                {isUploadOpen ? (
                                                                    <X className="h-3.5 w-3.5" />
                                                                ) : (
                                                                    <>
                                                                        <Upload className="h-3.5 w-3.5" />
                                                                        {isDone ? "إعادة الرفع" : "رفع"}
                                                                    </>
                                                                )}
                                                            </button>
                                                        </div>

                                                        {/* Inline upload panel */}
                                                        {isUploadOpen && (
                                                            <EvidenceUploadPanel
                                                                evidenceName={evidence}
                                                                standardId={standard.id}
                                                                indicators={indicators}
                                                                indicatorsLoading={indicatorsLoading}
                                                                colorClass={color}
                                                                onClose={() => setOpenUpload(null)}
                                                                onSuccess={() => {
                                                                    setUploadedKeys(prev => new Set([...prev, uploadKey]));
                                                                    setOpenUpload(null);
                                                                }}
                                                            />
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Footer */}
                <div className="mt-8 mb-2 p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900 text-center">
                    <p className="text-sm text-blue-700 dark:text-blue-300 font-medium">
                        📋 هذه الشواهد إرشادية — يمكنك إضافة أي وثيقة تُثبت أداءك في كل معيار
                    </p>
                    <Button onClick={() => setLocation("/home")} className="mt-3 gap-2" size="sm">
                        <ArrowRight className="h-4 w-4" />
                        العودة للوحة التحكم
                    </Button>
                </div>
            </div>
        </div>
    );
}
