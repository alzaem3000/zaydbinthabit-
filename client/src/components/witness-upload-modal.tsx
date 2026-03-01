import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Upload, Link as LinkIcon, CheckCircle, Lightbulb, ChevronLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import imageCompression from "browser-image-compression";
import { PERFORMANCE_STANDARDS } from "@/lib/constants";

interface WitnessUploadModalProps {
  indicatorId: string;
  indicatorTitle: string;
  isOpen: boolean;
  onClose: () => void;
}

export function WitnessUploadModal({ indicatorId, indicatorTitle, isOpen, onClose }: WitnessUploadModalProps) {
  const [uploadType, setUploadType] = useState<"file" | "link">("file");
  const [file, setFile] = useState<File | null>(null);
  const [fileData, setFileData] = useState<string | null>(null);
  const [link, setLink] = useState("");
  const [witnessName, setWitnessName] = useState("");
  const [isCompressing, setIsCompressing] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const standard = PERFORMANCE_STANDARDS.find(s => indicatorTitle.includes(s.title)) || PERFORMANCE_STANDARDS[0];
  const suggestions = standard.suggestedEvidence || [];

  const resetForm = () => {
    setFile(null);
    setFileData(null);
    setLink("");
    setWitnessName("");
    setUploadType("file");
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const originalFile = e.target.files[0];
      let finalFile = originalFile;

      if (originalFile.type.startsWith("image/")) {
        setIsCompressing(true);
        toast({
          title: "جاري المعالجة",
          description: "يتم الآن ضغط الصورة لتقليل حجمها...",
          duration: 3000,
        });
        try {
          finalFile = await imageCompression(originalFile, {
            maxSizeMB: 0.8,
            maxWidthOrHeight: 1920,
            useWebWorker: true
          });
        } catch (err) {
          console.error("Compression failed, using original", err);
        } finally {
          setIsCompressing(false);
        }
      }

      setFile(finalFile);

      const reader = new FileReader();
      reader.onloadend = () => {
        setFileData(reader.result as string);
      };
      reader.readAsDataURL(finalFile);
    }
  };

  const mutation = useMutation({
    mutationFn: async () => {
      const payload = {
        title: witnessName || "شاهد جديد",
        description: witnessName,
        indicatorId,
        fileType: uploadType === "file" ? (file ? file.type.split('/')[1] : 'unknown') : 'link',
        fileName: uploadType === "file" ? (file ? file.name : 'witness') : 'link',
        fileData: uploadType === "file" ? fileData : null,
        link: uploadType === "link" ? link : null,
      };

      await apiRequest("POST", `/api/indicators/${indicatorId}/witnesses`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/indicators"] });
      queryClient.invalidateQueries({ queryKey: [`/api/indicators/${indicatorId}/witnesses`] });
      toast({ title: "تم الحفظ", description: "تم رفع الشاهد بنجاح", variant: "default" });
      handleClose();
    },
    onError: (error: any) => {
      toast({
        title: "خطأ",
        description: error.message || "فشل في رفع الشاهد",
        variant: "destructive"
      });
    }
  });

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) handleClose(); }}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden font-sans" dir="rtl">
        <DialogHeader className="px-5 pt-5 pb-3 bg-slate-50/80 dark:bg-slate-900/80 border-b backdrop-blur-sm">
          <DialogTitle className="text-right flex items-center gap-2">
            <Upload className="h-5 w-5 text-primary" />
            توثيق الأداء
          </DialogTitle>
        </DialogHeader>

        <div className="p-5">
          <div className="space-y-4 mb-5">
            <Label className="text-xs text-muted-foreground font-bold">عنصر التقييم الحالي</Label>
            <div className="p-3 bg-blue-50/50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900 rounded-lg text-blue-900 dark:text-blue-200 font-medium text-sm flex items-center justify-between">
              {indicatorTitle}
              <CheckCircle className="h-4 w-4 text-blue-500" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Right side in RTL (Suggestions) -> This asks for list on left (in English layout), but in RTL left is logical end. We will just use standard order (right to left). */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Lightbulb className="h-4 w-4 text-amber-500" />
                <Label className="text-xs font-bold">مقترحات الشواهد (اضغط للاختيار)</Label>
              </div>
              <ScrollArea className="h-[250px] rounded-md border bg-slate-50 dark:bg-slate-900 p-2">
                <div className="space-y-2">
                  {suggestions.map((sug: string, idx: number) => (
                    <div
                      key={idx}
                      onClick={() => setWitnessName(sug)}
                      className="flex items-center justify-between p-2.5 bg-white dark:bg-slate-800 rounded-md border shadow-sm cursor-pointer hover:border-primary hover:shadow-md transition-all group"
                    >
                      <span className="text-xs text-muted-foreground group-hover:text-primary font-medium">{sug}</span>
                      <ChevronLeft className="h-3 w-3 text-slate-300 group-hover:text-primary" />
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>

            {/* Left side in RTL (Upload Tabs) */}
            <div className="space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <Label>اسم الشاهد</Label>
                <Input
                  data-testid="input-witness-name"
                  value={witnessName}
                  onChange={(e) => setWitnessName(e.target.value)}
                  placeholder="مثال: سجل الحضور والغياب..."
                />

                <Tabs value={uploadType} onValueChange={(v: any) => setUploadType(v)} className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="file">رفع ملف (PDF/Img)</TabsTrigger>
                    <TabsTrigger value="link">رابط (Drive)</TabsTrigger>
                  </TabsList>

                  <TabsContent value="file" className="mt-3">
                    <div className="border-2 border-dashed rounded-xl p-6 text-center hover:border-primary/50 transition-all relative group cursor-pointer h-32 flex items-center justify-center">
                      <input
                        type="file"
                        onChange={handleFileChange}
                        data-testid="input-witness-file"
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                      />
                      <div className="flex flex-col items-center gap-2">
                        <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-full group-hover:bg-blue-100 dark:group-hover:bg-blue-900 transition-colors">
                          <Upload className="h-5 w-5 text-muted-foreground group-hover:text-blue-600" />
                        </div>
                        <span className="text-sm text-muted-foreground font-medium truncate max-w-[200px]">
                          {file ? file.name : "اضغط هنا لاختيار الملف"}
                        </span>
                        {isCompressing && <span className="text-xs text-amber-600 animate-pulse">جاري ضغط الصورة...</span>}
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="link" className="mt-3">
                    <div className="relative">
                      <LinkIcon className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        data-testid="input-witness-link"
                        value={link}
                        onChange={(e) => setLink(e.target.value)}
                        className="pr-9"
                        placeholder="https://docs.google.com/..."
                      />
                    </div>
                  </TabsContent>
                </Tabs>
              </div>

              <Button
                data-testid="button-submit-witness"
                onClick={() => mutation.mutate()}
                disabled={mutation.isPending || (uploadType === "file" && !file) || (uploadType === "link" && !link)}
                className="w-full font-bold h-12 mt-4"
              >
                {mutation.isPending ? "جاري الرفع..." : "حفظ الشاهد"}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
