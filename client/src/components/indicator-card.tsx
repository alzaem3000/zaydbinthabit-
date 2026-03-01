import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import type { IndicatorWithCriteria } from "@shared/schema";
import { 
  Eye, 
  Plus, 
  Trash2,
  FileText,
  CheckCircle2
} from "lucide-react";

interface IndicatorCardProps {
  indicator: IndicatorWithCriteria;
  onAddWitness?: (indicatorId: string, criteriaId?: string) => void;
  onViewDetails?: (indicatorId: string) => void;
  onDelete?: (indicatorId: string) => void;
  onToggleCriteria?: (indicatorId: string, criteriaId: string, completed: boolean) => void;
}

export function IndicatorCard({ 
  indicator, 
  onAddWitness, 
  onViewDetails, 
  onDelete,
  onToggleCriteria 
}: IndicatorCardProps) {
  const getStatusBadge = () => {
    switch (indicator.status) {
      case "completed":
        return (
          <Badge className="bg-success text-success-foreground" data-testid={`badge-status-${indicator.id}`}>
            مكتمل
          </Badge>
        );
      case "in_progress":
        return (
          <Badge className="bg-primary text-primary-foreground" data-testid={`badge-status-${indicator.id}`}>
            قيد التنفيذ
          </Badge>
        );
      default:
        return (
          <Badge className="bg-warning text-warning-foreground" data-testid={`badge-status-${indicator.id}`}>
            غير مكتمل
          </Badge>
        );
    }
  };

  const completedCriteria = indicator.criteria?.filter(c => c.isCompleted).length || 0;
  const totalCriteria = indicator.criteria?.length || 0;

  return (
    <Card 
      className="p-5 border-2 border-border bg-secondary/30 hover:border-primary hover:shadow-md transition-all duration-300 hover:-translate-y-1"
      data-testid={`card-indicator-${indicator.id}`}
    >
      <div className="flex items-start justify-between gap-3 mb-4">
        <h3 className="font-bold text-primary text-lg leading-tight flex-1" data-testid={`text-indicator-title-${indicator.id}`}>
          {indicator.title}
        </h3>
        {getStatusBadge()}
      </div>
      
      <div className="text-center bg-card p-3 rounded-md border border-border mb-4" data-testid={`text-witness-count-${indicator.id}`}>
        <div className="flex items-center justify-center gap-2 text-muted-foreground">
          <FileText className="h-4 w-4" />
          <span>الشواهد المرفقة: <strong className="text-foreground">{indicator.witnessCount || 0}</strong></span>
        </div>
      </div>
      
      {indicator.criteria && indicator.criteria.length > 0 && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-muted-foreground">المعايير</span>
            <span className="text-xs text-muted-foreground">
              {completedCriteria} / {totalCriteria}
            </span>
          </div>
          <ul className="space-y-2">
            {indicator.criteria.map((criterion) => (
              <li 
                key={criterion.id} 
                className="flex items-center gap-3 py-2 px-3 bg-card rounded-md border border-border/50"
                data-testid={`criteria-item-${criterion.id}`}
              >
                <Checkbox 
                  checked={criterion.isCompleted || false}
                  onCheckedChange={(checked) => 
                    onToggleCriteria?.(indicator.id, criterion.id, checked as boolean)
                  }
                  data-testid={`checkbox-criteria-${criterion.id}`}
                />
                <span className={`flex-1 text-sm ${criterion.isCompleted ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                  {criterion.title}
                </span>
                {criterion.isCompleted && (
                  <CheckCircle2 className="h-4 w-4 text-success" />
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
      
      <div className="flex flex-wrap gap-2">
        <Button 
          size="sm" 
          onClick={() => onAddWitness?.(indicator.id)}
          className="flex-1 gap-1"
          data-testid={`button-add-witness-${indicator.id}`}
        >
          <Plus className="h-4 w-4" />
          إضافة شاهد
        </Button>
        <Button 
          size="sm" 
          variant="outline"
          onClick={() => onViewDetails?.(indicator.id)}
          className="gap-1"
          data-testid={`button-view-details-${indicator.id}`}
        >
          <Eye className="h-4 w-4" />
          عرض
        </Button>
        <Button 
          size="icon" 
          variant="ghost"
          onClick={() => onDelete?.(indicator.id)}
          className="text-destructive hover:text-destructive hover:bg-destructive/10"
          data-testid={`button-delete-indicator-${indicator.id}`}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </Card>
  );
}
