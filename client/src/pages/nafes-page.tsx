import { useState, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/theme-toggle";
import { useToast } from "@/hooks/use-toast";
import {
    FileUp,
    ArrowRight,
    UploadCloud,
    X,
    File,
    Image as ImageIcon,
    CheckCircle2,
    FileText
} from "lucide-react";
import imageCompression from "browser-image-compression";

interface UploadedFile {
    id: string;
    fileName: string;
    fileSize: number;
    fileType: string;
    fileUrl: string;
    title: string;
}

export default function NafesPage() {
    const { user } = useAuth();
    const { toast } = useToast();
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { data: uploadedFiles = [], isLoading } = useQuery<UploadedFile[]>({
        queryKey: ["/api/nafes"],
    });

    const uploadMutation = useMutation({
        mutationFn: async (fileData: Partial<UploadedFile>) => {
            const res = await apiRequest("POST", "/api/nafes", fileData);
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/nafes"] });
            toast({
                title: "تم الرفع بنجاح",
                description: "تم رفع الشاهد وحفظه بنجاح",
            });
        },
        onError: () => {
            toast({
                title: "خطأ في الرفع",
                description: "حدث خطأ أثناء حفظ الملف، يرجى المحاولة مرة أخرى.",
                variant: "destructive"
            });
        }
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            await apiRequest("DELETE", `/api/nafes/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/nafes"] });
            toast({
                title: "تم الحذف",
                description: "تم حذف الشاهد بنجاح",
            });
        },
        onError: () => {
            toast({
                title: "خطأ",
                description: "حدث خطأ أثناء الحذف.",
                variant: "destructive"
            });
        }
    });

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        setIsUploading(true);

        try {
            // Process each file
            for (let i = 0; i < files.length; i++) {
                let file = files[i];
                let fileUrl = "";

                // Image compression
                if (file.type.startsWith("image/")) {
                    const options = {
                        maxSizeMB: 1,
                        maxWidthOrHeight: 1920,
                        useWebWorker: true,
                    };
                    toast({
                        title: "جاري المعالجة",
                        description: `يتم الآن ضغط الصورة: ${file.name}...`,
                    });
                    file = await imageCompression(file, options);
                }

                // Convert to base64 for local preview
                const reader = new FileReader();
                const base64Promise = new Promise<string>((resolve, reject) => {
                    reader.onload = () => resolve(reader.result as string);
                    reader.onerror = reject;
                });
                reader.readAsDataURL(file);
                fileUrl = await base64Promise;

                const newFile = {
                    title: `شاهد لتطبيق نافس - ${file.name}`,
                    fileName: file.name,
                    fileSize: file.size,
                    fileType: file.type.startsWith("image/") ? "image" : file.type === "application/pdf" ? "pdf" : "document",
                    fileUrl: fileUrl
                };

                await uploadMutation.mutateAsync(newFile);
            }
        } catch (error) {
            console.error("Upload error:", error);
            toast({
                title: "خطأ في الرفع",
                description: "حدث خطأ أثناء معالجة الملف، يرجى المحاولة مرة أخرى.",
                variant: "destructive"
            });
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    const removeFile = (id: string) => {
        if (confirm("هل أنت متأكد من حذف هذا الملف؟")) {
            deleteMutation.mutate(id);
        }
    };

    return (
        <div className="min-h-screen bg-background pb-20" dir="rtl">
            <div className="fixed top-4 left-4 z-50">
                <ThemeToggle />
            </div>

            {/* Header */}
            <div className="bg-blue-600 dark:bg-blue-900 border-b relative overflow-hidden text-white">
                <div className="absolute inset-0 bg-blue-500/20 dark:bg-blue-950/40 pattern-grid-lg"></div>
                <div className="max-w-4xl mx-auto px-4 py-8 relative z-10">
                    <Link href="/home">
                        <Button variant="ghost" size="sm" className="mb-6 text-white hover:bg-blue-700 hover:text-white transition-colors bg-blue-700/50">
                            <ArrowRight className="h-4 w-4 ml-2" />
                            العودة للرئيسية
                        </Button>
                    </Link>

                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-2xl border-4 border-white/20 bg-blue-500 flex items-center justify-center shrink-0 shadow-xl">
                            <FileUp className="h-8 w-8 text-white" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-extrabold mb-2 tracking-tight">أعمال نافس</h1>
                            <p className="text-blue-100 max-w-lg leading-relaxed mb-3">
                                نافذة مخصصة لرفع وتوثيق شواهد اختبارات نافس الخاصة بك بكل سهولة وبصيغ متعددة
                            </p>
                            <div className="flex flex-wrap gap-2">
                                <Badge className="bg-white/20 hover:bg-white/30 text-white border-none backdrop-blur-sm">
                                    دعم جميع الصيغ
                                </Badge>
                                <Badge className="bg-white/20 hover:bg-white/30 text-white border-none backdrop-blur-sm">
                                    ضغط تلقائي للصور لتوفير المساحة
                                </Badge>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-4xl mx-auto px-4 mt-8">
                <Card className="p-8 border-2 border-dashed border-blue-200 bg-blue-50/30 dark:border-blue-800 dark:bg-blue-950/10 transition-all text-center mb-8 relative overflow-hidden group">
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileUpload}
                        multiple
                        accept="image/*,.pdf,.doc,.docx"
                        className="hidden"
                    />

                    <div className="max-w-md mx-auto relative z-10">
                        <div className="w-20 h-20 bg-blue-100 dark:bg-blue-900/50 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                            <UploadCloud className="h-10 w-10 text-blue-600 dark:text-blue-400" />
                        </div>

                        <h3 className="text-2xl font-bold text-foreground mb-3 tracking-tight">
                            اسحب وأفلت الملفات هنا
                        </h3>

                        <p className="text-muted-foreground mb-8 leading-relaxed">
                            يمكنك رفع صور أو مستندات أو ملفات PDF لشواهد وتطبيقات نافس
                            <br />
                            سيتم ضغط الصور تلقائيًا لتسريع عملية الرفع
                        </p>

                        <Button
                            size="lg"
                            className="w-full text-lg h-14 bg-blue-600 hover:bg-blue-700 hover:scale-[1.02] shadow-lg transition-all"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isUploading}
                        >
                            {isUploading ? (
                                <>جاري المعالجة والرفع...</>
                            ) : (
                                <>تصفح الملفات</>
                            )}
                        </Button>
                    </div>
                </Card>

                {isLoading ? (
                    <div className="text-center py-8 text-muted-foreground">جاري تحميل الملفات...</div>
                ) : uploadedFiles.length > 0 && (
                    <div>
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold flex items-center gap-2">
                                <CheckCircle2 className="h-6 w-6 text-green-500" />
                                الشواهد المرفوعة ({uploadedFiles.length})
                            </h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {uploadedFiles.map((file) => (
                                <Card key={file.id} className="p-4 hover:shadow-md transition-shadow group flex items-start gap-4 border-muted">
                                    <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center shrink-0">
                                        {file.fileType === "image" ? (
                                            <ImageIcon className="h-6 w-6 text-green-500" />
                                        ) : file.fileType === "pdf" ? (
                                            <FileText className="h-6 w-6 text-red-500" />
                                        ) : (
                                            <File className="h-6 w-6 text-blue-500" />
                                        )}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-bold text-sm truncate mb-1">{file.title}</h4>
                                        <p className="text-xs text-muted-foreground">
                                            {(file.fileSize / 1024 / 1024).toFixed(2)} MB
                                        </p>
                                    </div>

                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="text-muted-foreground hover:text-destructive shrink-0 opacity-50 group-hover:opacity-100 transition-opacity"
                                        onClick={() => removeFile(file.id)}
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                </Card>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
