import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { RefreshCw } from "lucide-react";
import type { Indicator } from "@shared/schema";

interface ReEvaluateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  indicators: Indicator[];
  onSubmit: (selectedIds: string[]) => void;
  isLoading?: boolean;
}

export function ReEvaluateModal({ 
  open, 
  onOpenChange, 
  indicators,
  onSubmit,
  isLoading 
}: ReEvaluateModalProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  useEffect(() => {
    setSelected(new Set());
  }, [open]);

  const handleToggle = (id: string) => {
    const newSelected = new Set(selected);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelected(newSelected);
  };

  const handleSubmit = () => {
    onSubmit(Array.from(selected));
  };

  const handleClose = () => {
    setSelected(new Set());
    onOpenChange(false);
  };

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-success text-success-foreground">مكتمل</Badge>;
      case "in_progress":
        return <Badge className="bg-primary text-primary-foreground">قيد التنفيذ</Badge>;
      default:
        return <Badge className="bg-warning text-warning-foreground">غير مكتمل</Badge>;
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto" data-testid="modal-re-evaluate">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-primary" data-testid="text-re-evaluate-title">
            إعادة تحقيق المؤشرات
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <p className="text-muted-foreground text-sm mb-4">
            اختر المؤشرات التي تريد إعادة تحقيقها:
          </p>
          
          {indicators.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              لا توجد مؤشرات متاحة
            </div>
          ) : (
            <div className="space-y-3">
              {indicators.map((indicator) => (
                <label 
                  key={indicator.id}
                  className="flex items-start gap-3 p-3 rounded-lg border border-border bg-card hover:bg-muted/50 cursor-pointer transition-colors"
                  data-testid={`re-evaluate-item-${indicator.id}`}
                >
                  <Checkbox 
                    checked={selected.has(indicator.id)}
                    onCheckedChange={() => handleToggle(indicator.id)}
                    data-testid={`checkbox-re-evaluate-${indicator.id}`}
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium text-foreground">
                        {indicator.title}
                      </span>
                      {getStatusBadge(indicator.status)}
                    </div>
                    {indicator.description && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {indicator.description}
                      </p>
                    )}
                  </div>
                </label>
              ))}
            </div>
          )}
        </div>

        <div className="flex gap-3 pt-4 border-t border-border">
          <Button 
            onClick={handleSubmit} 
            className="flex-1 gap-2"
            disabled={isLoading || selected.size === 0}
            data-testid="button-confirm-re-evaluate"
          >
            <RefreshCw className="h-4 w-4" />
            {isLoading ? "جاري التحديث..." : `إعادة تحقيق (${selected.size})`}
          </Button>
          <Button 
            variant="outline" 
            onClick={handleClose}
            data-testid="button-cancel-re-evaluate"
          >
            إلغاء
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
