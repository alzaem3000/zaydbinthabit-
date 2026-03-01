import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2, Save, ChevronLeft, ChevronRight, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const indicatorFormSchema = z.object({
  title: z.string().min(3, "عنوان المؤشر يجب أن يكون 3 أحرف على الأقل"),
  description: z.string().optional(),
  type: z.enum(["goal", "competency"]),
  weight: z.number().min(0).max(100),
  domain: z.string().optional(),
  targetOutput: z.string().optional(),
});

type IndicatorFormValues = z.infer<typeof indicatorFormSchema>;

interface AddIndicatorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: IndicatorFormValues & { criteria: string[] }) => void;
  isLoading?: boolean;
  defaultType?: "goal" | "competency";
}

export function AddIndicatorModal({
  open,
  onOpenChange,
  onSubmit,
  isLoading,
  defaultType = "goal",
}: AddIndicatorModalProps) {
  const [criteriaList, setCriteriaList] = useState<string[]>([""]);
  const [currentStep, setCurrentStep] = useState(1);

  const form = useForm<IndicatorFormValues>({
    resolver: zodResolver(indicatorFormSchema),
    defaultValues: {
      title: "",
      description: "",
      type: defaultType,
      weight: 0,
      domain: "",
      targetOutput: "",
    },
  });

  const watchType = form.watch("type");

  const handleAddCriteria = () => {
    setCriteriaList([...criteriaList, ""]);
  };

  const handleRemoveCriteria = (index: number) => {
    const newList = criteriaList.filter((_, i) => i !== index);
    setCriteriaList(newList.length > 0 ? newList : [""]);
  };

  const handleCriteriaChange = (index: number, value: string) => {
    const newList = [...criteriaList];
    newList[index] = value;
    setCriteriaList(newList);
  };

  const nextStep = async () => {
    let fieldsToValidate: (keyof IndicatorFormValues)[] = [];
    if (currentStep === 1) fieldsToValidate = ["type", "title"];
    if (currentStep === 2) fieldsToValidate = ["weight"];

    const isValid = await form.trigger(fieldsToValidate);
    if (isValid) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const prevStep = () => setCurrentStep((prev) => prev - 1);

  const handleSubmit = (data: IndicatorFormValues) => {
    const validCriteria = criteriaList.filter(c => c.trim() !== "");
    onSubmit({ ...data, criteria: validCriteria });
    form.reset({ title: "", description: "", type: defaultType, weight: 0, domain: "", targetOutput: "" });
    setCriteriaList([""]);
    setCurrentStep(1);
  };

  const handleClose = () => {
    form.reset({ title: "", description: "", type: defaultType, weight: 0, domain: "", targetOutput: "" });
    setCriteriaList([""]);
    setCurrentStep(1);
    onOpenChange(false);
  };

  const stepLabels = ["البيانات الأساسية", "التفاصيل والوزن", "المعايير والشواهد"];

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-hidden flex flex-col p-0" data-testid="modal-add-indicator">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle className="text-xl font-bold text-primary flex items-center justify-between" data-testid="text-modal-title">
            <span>{watchType === "goal" ? "إضافة هدف جديد" : "إضافة جدارة جديدة"}</span>
            <span className="text-sm font-normal text-muted-foreground">خطوة {currentStep} من 3</span>
          </DialogTitle>
          <div className="flex gap-2 mt-4">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${s <= currentStep ? "bg-primary" : "bg-muted"
                  }`}
              />
            ))}
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-6 pt-2">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
              <AnimatePresence mode="wait">
                {currentStep === 1 && (
                  <motion.div
                    key="step1"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-4"
                  >
                    <FormField
                      control={form.control}
                      name="type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="font-bold">نوع المؤشر</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-indicator-type">
                                <SelectValue placeholder="اختر النوع" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="goal">هدف أداء وظيفي</SelectItem>
                              <SelectItem value="competency">جدارة مهنية</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="font-bold">العنوان</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="مثلاً: التخطيط للدروس، استخدام التقنية..."
                              {...field}
                              data-testid="input-indicator-title"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="font-bold text-sm">وصف مختصر (اختياري)</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="وصف إضافي للمؤشر"
                              {...field}
                              className="resize-none h-24"
                              data-testid="input-indicator-description"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </motion.div>
                )}

                {currentStep === 2 && (
                  <motion.div
                    key="step2"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-4"
                  >
                    <FormField
                      control={form.control}
                      name="weight"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="font-bold">الوزن النسبي (%)</FormLabel>
                          <FormControl>
                            <div className="space-y-3">
                              <Input
                                type="number"
                                min={0}
                                max={100}
                                value={field.value}
                                onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                data-testid="input-indicator-weight"
                              />
                              <div className="flex justify-between text-[10px] text-muted-foreground px-1">
                                <span>0%</span>
                                <span>50%</span>
                                <span>100%</span>
                              </div>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {watchType === "competency" && (
                      <FormField
                        control={form.control}
                        name="domain"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="font-bold">المجال المهني</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value || ""}>
                              <FormControl>
                                <SelectTrigger data-testid="select-domain">
                                  <SelectValue placeholder="اختر المجال" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="values">القيم والمسؤوليات المهنية</SelectItem>
                                <SelectItem value="knowledge">المعرفة المهنية</SelectItem>
                                <SelectItem value="practice">الممارسة المهنية</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}

                    {watchType === "goal" && (
                      <FormField
                        control={form.control}
                        name="targetOutput"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="font-bold">المخرج المستهدف</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="ما هي النتيجة المتوقعة؟"
                                {...field}
                                data-testid="input-target-output"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                  </motion.div>
                )}

                {currentStep === 3 && (
                  <motion.div
                    key="step3"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-4"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <FormLabel className="font-bold">قائمة المعايير</FormLabel>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleAddCriteria}
                        className="h-7 text-[10px] gap-1"
                      >
                        <Plus className="h-3 w-3" />
                        إضافة
                      </Button>
                    </div>

                    <div className="space-y-3 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
                      {criteriaList.map((criterion, index) => (
                        <div key={index} className="flex gap-2 items-start group">
                          <div className="mt-2.5 w-5 h-5 rounded-full bg-muted flex items-center justify-center text-[10px] shrink-0 font-bold">
                            {index + 1}
                          </div>
                          <FormControl className="flex-1">
                            <Input
                              value={criterion}
                              onChange={(e) => handleCriteriaChange(index, e.target.value)}
                              placeholder="مثال: تحليل نتائج الطلاب بشكل فصلي"
                              className="bg-muted/30 focus-visible:ring-primary/30"
                              data-testid={`input-criteria-${index}`}
                            />
                          </FormControl>
                          {criteriaList.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => handleRemoveCriteria(index)}
                              className="h-10 w-10 text-destructive opacity-40 group-hover:opacity-100 transition-opacity"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex gap-3 pt-4 border-t sticky bottom-0 bg-background">
                {currentStep > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={prevStep}
                    className="flex-1 gap-2"
                  >
                    <ChevronRight className="h-4 w-4" />
                    السابق
                  </Button>
                )}

                {currentStep < 3 ? (
                  <Button
                    type="button"
                    onClick={nextStep}
                    className="flex-1 gap-2"
                    style={{ backgroundColor: "#006C35" }}
                  >
                    التالي
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    className="flex-1 gap-2"
                    disabled={isLoading}
                    style={{ backgroundColor: "#006C35" }}
                    data-testid="button-save-indicator"
                  >
                    {isLoading ? "جاري الحفظ..." : <><Check className="h-4 w-4" /> حفظ وإغلاق</>}
                  </Button>
                )}
              </div>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
