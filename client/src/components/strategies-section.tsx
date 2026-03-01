import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Strategy } from "@shared/schema";
import { Target, X } from "lucide-react";

interface StrategiesSectionProps {
  strategies: Strategy[];
  onSelectStrategies?: () => void;
  onRemoveStrategy?: (id: string) => void;
}

export function StrategiesSection({ 
  strategies, 
  onSelectStrategies,
  onRemoveStrategy 
}: StrategiesSectionProps) {
  return (
    <Card className="p-6 shadow-sm" data-testid="section-strategies">
      <div className="flex items-center justify-between gap-4 pb-4 mb-6 border-b-2 border-border">
        <h2 className="text-xl font-bold text-primary" data-testid="text-strategies-title">
          الاستراتيجيات المختارة
        </h2>
      </div>
      
      {strategies.length === 0 ? (
        <div className="text-center py-8 px-4 bg-muted/50 rounded-lg" data-testid="text-no-strategies">
          <Target className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
          <p className="text-muted-foreground mb-4">
            لم يتم اختيار استراتيجيات بعد
          </p>
          <Button onClick={onSelectStrategies} data-testid="button-select-strategies">
            <Target className="h-4 w-4 ml-2" />
            اختيار استراتيجيات
          </Button>
        </div>
      ) : (
        <>
          <div className="flex flex-wrap gap-2 mb-4">
            {strategies.map((strategy) => (
              <Badge 
                key={strategy.id}
                variant="secondary"
                className="py-2 px-3 text-sm gap-2"
                data-testid={`badge-strategy-${strategy.id}`}
              >
                {strategy.name}
                {onRemoveStrategy && (
                  <button 
                    onClick={() => onRemoveStrategy(strategy.id)}
                    className="hover:text-destructive transition-colors"
                    data-testid={`button-remove-strategy-${strategy.id}`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </Badge>
            ))}
          </div>
          <div className="text-center">
            <Button 
              variant="outline" 
              onClick={onSelectStrategies}
              data-testid="button-edit-strategies"
            >
              <Target className="h-4 w-4 ml-2" />
              تعديل الاستراتيجيات
            </Button>
          </div>
        </>
      )}
    </Card>
  );
}
