import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Calendar, CheckCircle2, Plus, Clock, ArrowRight } from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { Link } from "wouter";

interface AcademicCycle {
  id: number;
  name: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  isLocked: boolean;
}

export default function CyclesSettings() {
  const { toast } = useToast();
  const { data: cycles = [], isLoading } = useQuery<AcademicCycle[]>({
    queryKey: ["/api/cycles"],
  });

  const activateMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("POST", `/api/cycles/${id}/activate`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cycles"] });
      toast({ title: "تم التفعيل", description: "تم تغيير العام الدراسي النشط بنجاح" });
    },
  });

  if (isLoading) return <div className="p-8 text-center">جاري التحميل...</div>;

  return (
    <div className="min-h-screen bg-background p-6" dir="rtl">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Calendar className="h-6 w-6 text-primary" />
              إدارة الأعوام الدراسية
            </h1>
            <p className="text-muted-foreground">تحكم في العام الدراسي النشط وعزل البيانات</p>
          </div>
          <Link href="/principal">
            <Button variant="outline" className="gap-2">
              <ArrowRight className="h-4 w-4" />
              العودة للوحة التحكم
            </Button>
          </Link>
        </div>

        <div className="grid gap-4">
          {cycles.map((cycle) => (
            <Card key={cycle.id} className={cycle.isActive ? "border-primary shadow-md" : ""}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-bold">{cycle.name}</h3>
                      {cycle.isActive && (
                        <Badge className="bg-primary/10 text-primary border-primary/20">نشط حالياً</Badge>
                      )}
                      {cycle.isLocked && (
                        <Badge variant="outline" className="text-muted-foreground">مؤرشف</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        من: {format(new Date(cycle.startDate), "d MMMM yyyy", { locale: ar })}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        إلى: {format(new Date(cycle.endDate), "d MMMM yyyy", { locale: ar })}
                      </span>
                    </div>
                  </div>
                  {!cycle.isActive && (
                    <Button 
                      onClick={() => activateMutation.mutate(cycle.id)}
                      disabled={activateMutation.isPending}
                    >
                      تفعيل هذا العام
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="bg-muted/50 border-dashed">
          <CardContent className="p-8 text-center space-y-4">
            <Plus className="h-12 w-12 mx-auto text-muted-foreground opacity-50" />
            <div>
              <h3 className="font-bold">بدء عام دراسي جديد</h3>
              <p className="text-sm text-muted-foreground">عند بدء عام جديد، سيتم عزل البيانات الحالية والبدء بسجل نظيف للمعلمين</p>
            </div>
            <Button variant="outline" disabled>قريباً: إضافة عام دراسي</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
