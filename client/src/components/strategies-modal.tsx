import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Save } from "lucide-react";
import type { StrategyWithSelection } from "@shared/schema";

interface StrategiesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  strategies: StrategyWithSelection[];
  onSubmit: (selectedIds: string[]) => void;
  isLoading?: boolean;
}

export function StrategiesModal({ 
  open, 
  onOpenChange, 
  strategies,
  onSubmit,
  isLoading 
}: StrategiesModalProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  useEffect(() => {
    const initialSelected = new Set(
      strategies.filter(s => s.isSelected).map(s => s.id)
    );
    setSelected(initialSelected);
  }, [strategies]);

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
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto" data-testid="modal-strategies">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-primary" data-testid="text-strategies-modal-title">
            اختيار الاستراتيجيات
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <p className="text-muted-foreground text-sm mb-4">
            اختر الاستراتيجيات المناسبة لتوثيق الأداء الوظيفي:
          </p>
          
          {strategies.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              لا توجد استراتيجيات متاحة
            </div>
          ) : (
            <div className="space-y-3">
              {strategies.map((strategy) => (
                <label 
                  key={strategy.id}
                  className="flex items-start gap-3 p-3 rounded-lg border border-border bg-card hover:bg-muted/50 cursor-pointer transition-colors"
                  data-testid={`strategy-item-${strategy.id}`}
                >
                  <Checkbox 
                    checked={selected.has(strategy.id)}
                    onCheckedChange={() => handleToggle(strategy.id)}
                    data-testid={`checkbox-strategy-${strategy.id}`}
                  />
                  <div className="flex-1">
                    <span className="font-medium text-foreground">
                      {strategy.name}
                    </span>
                    {strategy.description && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {strategy.description}
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
            disabled={isLoading}
            data-testid="button-save-strategies"
          >
            <Save className="h-4 w-4" />
            {isLoading ? "جاري الحفظ..." : "حفظ الاستراتيجيات"}
          </Button>
          <Button 
            variant="outline" 
            onClick={handleClose}
            data-testid="button-cancel-strategies"
          >
            إلغاء
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
