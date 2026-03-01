import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Eye, CheckCircle2, XCircle, Info, Download, Image as ImageIcon, File } from "lucide-react";
import { PERFORMANCE_STANDARDS, mapDbStandardToUI, type PerformanceStandardUI } from "@/lib/constants";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

interface EvidenceReviewModalProps {
  indicatorTitle: string;
  teacherName: string;
  fileUrl: string;
  isOpen: boolean;
  onClose: () => void;
  onApprove: () => void;
  onReject: (notes: string) => void;
}

export function EvidenceReviewModal({
  indicatorTitle,
  teacherName,
  fileUrl,
  isOpen,
  onClose,
  onApprove,
  onReject
}: EvidenceReviewModalProps) {
  const [rejectionNotes, setRejectionNotes] = useState("");
  const [isRejecting, setIsRejecting] = useState(false);
  const { data: dbStandards } = useQuery<any[]>({
    queryKey: ["/api/standards"],
    staleTime: 1000 * 60 * 30,
  });

  const standards: PerformanceStandardUI[] = dbStandards?.length
    ? dbStandards.map(mapDbStandardToUI)
    : PERFORMANCE_STANDARDS;

  const standard = standards.find(s => indicatorTitle.includes(s.title)) || standards[0];
  const isImage = fileUrl.match(/\.(jpg|jpeg|png|gif)$/i);
  const isPdf = fileUrl.match(/\.pdf$/i);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl h-[90vh] flex flex-col p-0 overflow-hidden" dir="rtl">
        <DialogHeader className="p-6 border-b">
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2 text-xl font-bold">
              <Eye className="h-5 w-5 text-primary" />
              مراجعة الشاهد: {teacherName}
            </DialogTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => window.open(fileUrl, '_blank')}
              >
                <Download className="h-4 w-4" />
                تحميل
              </Button>
              <Button size="sm" className="bg-green-600 hover:bg-green-700 gap-2" onClick={() => { setIsRejecting(false); onApprove(); }}>
                <CheckCircle2 className="h-4 w-4" />
                اعتماد
              </Button>
              <Button size="sm" variant="destructive" className="gap-2" onClick={() => setIsRejecting(!isRejecting)}>
                <XCircle className="h-4 w-4" />
                رفض
              </Button>
            </div>
          </div>
          {isRejecting && (
            <div className="mt-4 p-4 bg-destructive/10 rounded-lg border border-destructive/20 flex gap-3 items-start animate-in fade-in slide-in-from-top-2">
              <div className="flex-1">
                <label className="text-sm font-bold text-destructive mb-1 block">سبب الرفض (إجباري)</label>
                <textarea
                  className="w-full text-sm p-2 rounded-md border border-destructive/30 bg-background focus:outline-none focus:ring-2 focus:ring-destructive/50 resize-none"
                  rows={2}
                  placeholder="يرجى توضيح سبب الرفض للمعلم..."
                  value={rejectionNotes}
                  onChange={(e) => setRejectionNotes(e.target.value)}
                />
              </div>
              <Button
                variant="destructive"
                className="mt-6"
                disabled={!rejectionNotes.trim()}
                onClick={() => {
                  if (rejectionNotes.trim()) {
                    onReject(rejectionNotes);
                    setIsRejecting(false);
                    setRejectionNotes("");
                  }
                }}
              >
                تأكيد الرفض
              </Button>
            </div>
          )}
          <p className="text-sm text-muted-foreground mt-1">{indicatorTitle}</p>
        </DialogHeader>

        <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 overflow-hidden">
          {/* Right Side: File Preview */}
          <div className="lg:col-span-2 bg-accent/20 flex items-center justify-center p-4 overflow-hidden">
            {isImage ? (
              <img src={fileUrl} alt="Evidence" className="max-w-full max-h-full object-contain rounded-lg shadow-lg" />
            ) : isPdf ? (
              <iframe src={fileUrl} className="w-full h-full rounded-lg shadow-lg" title="PDF Preview" />
            ) : (
              <div className="text-center p-12 bg-background rounded-2xl shadow-sm border">
                <File className="h-24 w-24 mx-auto text-muted-foreground mb-4 opacity-20" />
                <p className="font-bold">معاينة غير متاحة</p>
                <p className="text-sm text-muted-foreground mb-4">هذا النوع من الملفات لا يدعم المعاينة المباشرة</p>
                <Button variant="outline" onClick={() => window.open(fileUrl, '_blank')}>تحميل الملف للمعاينة</Button>
              </div>
            )}
          </div>

          {/* Left Side: Rubric / Checklist */}
          <div className="border-r bg-muted/30 p-8 overflow-y-auto space-y-8">
            <div className="space-y-6">
              <h4 className="font-bold flex items-center gap-2 text-primary border-b border-primary/10 pb-3">
                <Info className="h-5 w-5" />
                دليل التحقق من الشاهد
              </h4>

              <div className="bg-background p-5 rounded-xl border shadow-sm space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0 border border-primary/20">
                    <standard.icon className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-bold text-sm leading-tight">{standard.title}</p>
                    <Badge variant="outline" className="mt-1 text-[10px] py-0 font-medium border-primary/20 text-primary">الوزن: {standard.weight}</Badge>
                  </div>
                </div>
                <p className="text-sm leading-relaxed text-muted-foreground border-t pt-3">{standard.description}</p>
              </div>

              <div className="space-y-4">
                <p className="text-sm font-bold flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  المعايير المطلوبة لهذا المؤشر:
                </p>
                <div className="space-y-3">
                  {standard.suggestedEvidence.map((evidence, idx) => (
                    <div key={idx} className="flex items-start gap-4 bg-background p-4 rounded-xl border shadow-sm text-sm group hover-elevate cursor-default transition-all">
                      <div className="mt-1">
                        <input type="checkbox" className="h-4 w-4 rounded border-input text-primary focus:ring-primary/20 transition-all" />
                      </div>
                      <span className="leading-relaxed text-muted-foreground group-hover:text-foreground transition-colors">{evidence}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-amber-500/5 border border-amber-500/20 p-5 rounded-xl text-amber-800 dark:text-amber-200 text-xs leading-relaxed shadow-sm">
              <p className="font-bold flex items-center gap-2 mb-2 text-amber-600 dark:text-amber-400">
                <Info className="h-4 w-4" />
                توجيه للمدير:
              </p>
              يرجى التحقق من محتوى الملف المرفق ومطابقته لأحد الأمثلة المقترحة أعلاه لضمان جودة التوثيق واعتماده بشكل صحيح.
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
