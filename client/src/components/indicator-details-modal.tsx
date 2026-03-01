import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { IndicatorWithCriteria, Witness } from "@shared/schema";
import { 
  CheckCircle2, 
  FileText, 
  Image, 
  Video, 
  File,
  Download,
  Plus
} from "lucide-react";

interface IndicatorDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  indicator: IndicatorWithCriteria | null;
  witnesses?: Witness[];
  onAddWitness?: (indicatorId: string) => void;
}

export function IndicatorDetailsModal({ 
  open, 
  onOpenChange, 
  indicator,
  witnesses = [],
  onAddWitness
}: IndicatorDetailsModalProps) {
  if (!indicator) return null;

  const getStatusBadge = () => {
    switch (indicator.status) {
      case "completed":
        return <Badge className="bg-success text-success-foreground">مكتمل</Badge>;
      case "in_progress":
        return <Badge className="bg-primary text-primary-foreground">قيد التنفيذ</Badge>;
      default:
        return <Badge className="bg-warning text-warning-foreground">غير مكتمل</Badge>;
    }
  };

  const getFileIcon = (fileType?: string | null) => {
    switch (fileType) {
      case "pdf":
        return <FileText className="h-5 w-5 text-destructive" />;
      case "image":
        return <Image className="h-5 w-5 text-success" />;
      case "video":
        return <Video className="h-5 w-5 text-primary" />;
      default:
        return <File className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const completedCriteria = indicator.criteria?.filter(c => c.isCompleted).length || 0;
  const totalCriteria = indicator.criteria?.length || 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" data-testid="modal-indicator-details">
        <DialogHeader>
          <div className="flex items-start justify-between gap-4">
            <DialogTitle className="text-xl font-bold text-primary" data-testid="text-indicator-details-title">
              {indicator.title}
            </DialogTitle>
            {getStatusBadge()}
          </div>
        </DialogHeader>

        {indicator.description && (
          <p className="text-muted-foreground" data-testid="text-indicator-description">
            {indicator.description}
          </p>
        )}

        <Separator />

        <div className="space-y-6">
          {indicator.criteria && indicator.criteria.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-foreground">المعايير</h3>
                <span className="text-sm text-muted-foreground">
                  {completedCriteria} / {totalCriteria} مكتمل
                </span>
              </div>
              <div className="space-y-2">
                {indicator.criteria.map((criterion) => (
                  <div 
                    key={criterion.id}
                    className="flex items-center gap-3 p-3 bg-muted/50 rounded-md"
                    data-testid={`detail-criteria-${criterion.id}`}
                  >
                    {criterion.isCompleted ? (
                      <CheckCircle2 className="h-5 w-5 text-success flex-shrink-0" />
                    ) : (
                      <div className="h-5 w-5 rounded-full border-2 border-muted-foreground flex-shrink-0" />
                    )}
                    <span className={criterion.isCompleted ? "text-muted-foreground line-through" : ""}>
                      {criterion.title}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-foreground">الشواهد المرفقة</h3>
              <Button 
                size="sm" 
                onClick={() => onAddWitness?.(indicator.id)}
                className="gap-1"
                data-testid="button-add-witness-details"
              >
                <Plus className="h-4 w-4" />
                إضافة شاهد
              </Button>
            </div>
            
            {witnesses.length === 0 ? (
              <Card className="p-6 text-center bg-muted/30" data-testid="text-no-witnesses">
                <FileText className="h-10 w-10 mx-auto mb-2 text-muted-foreground" />
                <p className="text-muted-foreground">لا توجد شواهد مرفقة</p>
              </Card>
            ) : (
              <div className="space-y-3">
                {witnesses.map((witness) => (
                  <Card 
                    key={witness.id}
                    className="p-4 hover-elevate"
                    data-testid={`witness-card-${witness.id}`}
                  >
                    <div className="flex items-start gap-3">
                      {getFileIcon(witness.fileType)}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-foreground truncate">
                          {witness.title}
                        </h4>
                        {witness.description && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {witness.description}
                          </p>
                        )}
                        {witness.fileUrl && witness.fileType === "image" && (
                          <div className="mt-2 mb-2">
                            <img 
                              src={witness.fileUrl} 
                              alt={witness.title} 
                              className="max-w-full h-auto rounded-md shadow-sm border border-border"
                            />
                          </div>
                        )}
                        {witness.fileName && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {witness.fileName}
                          </p>
                        )}
                      </div>
                      {witness.fileUrl && (
                        <Button 
                          size="icon" 
                          variant="ghost"
                          data-testid={`button-download-${witness.id}`}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t border-border">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            data-testid="button-close-details"
          >
            إغلاق
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
