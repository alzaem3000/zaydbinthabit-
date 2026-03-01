import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { useLocation } from "wouter";
import { GraduationCap, Building2, Hash, BookOpen, User, School, Phone, ChevronLeft, ChevronRight, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const onboardingSchema = z.object({
  fullNameArabic: z.string().min(5, "الاسم الكامل يجب أن يكون 5 أحرف على الأقل"),
  jobNumber: z.string().regex(/^\d{4,}$/, "الرقم الوظيفي يجب أن يكون رقمياً (4 أرقام على الأقل)"),
  specialization: z.string().min(2, "التخصص مطلوب"),
  schoolName: z.string().min(3, "اسم المدرسة مطلوب"),
  educationDepartment: z.string().min(3, "إدارة التعليم مطلوبة"),
  educationalLevel: z.string().min(1, "الرتبة مطلوبة"),
  subject: z.string().min(2, "المادة مطلوبة"),
  mobileNumber: z.string().regex(/^05\d{8}$/, "رقم الجوال يجب أن يبدأ بـ 05 ويتكون من 10 أرقام"),
});

type OnboardingFormValues = z.infer<typeof onboardingSchema>;

const educationalLevels = [
  { value: "معلم", label: "معلم" },
  { value: "معلم ممارس", label: "معلم ممارس" },
  { value: "معلم متقدم", label: "معلم متقدم" },
  { value: "معلم خبير", label: "معلم خبير" },
];

export default function Onboarding() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [currentStep, setCurrentStep] = useState(1);

  const form = useForm<OnboardingFormValues>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      fullNameArabic: "",
      jobNumber: "",
      specialization: "",
      schoolName: "",
      educationDepartment: "",
      educationalLevel: "معلم",
      subject: "",
      mobileNumber: "",
    },
  });

  const onboardingMutation = useMutation({
    mutationFn: async (data: OnboardingFormValues) => {
      return apiRequest("POST", "/api/onboarding", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      toast({ title: "تم بنجاح", description: "تم حفظ البيانات الشخصية" });
      setLocation("/home");
    },
    onError: () => {
      toast({ title: "خطأ", description: "فشل في حفظ البيانات", variant: "destructive" });
    },
  });

  const nextStep = async () => {
    let fieldsToValidate: (keyof OnboardingFormValues)[] = [];
    if (currentStep === 1) fieldsToValidate = ["fullNameArabic", "jobNumber", "mobileNumber"];
    if (currentStep === 2) fieldsToValidate = ["specialization", "subject", "educationalLevel"];

    const isValid = await form.trigger(fieldsToValidate);
    if (isValid) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const prevStep = () => setCurrentStep((prev) => prev - 1);

  const handleSubmit = (data: OnboardingFormValues) => {
    onboardingMutation.mutate(data);
  };

  return (
    <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4" dir="rtl" data-testid="page-onboarding">
      <Card className="w-full max-w-2xl overflow-hidden flex flex-col md:flex-row shadow-xl ring-1 ring-black/5">
        {/* Progress Sidebar */}
        <div className="w-full md:w-64 bg-primary p-8 text-white flex flex-col justify-between" style={{ backgroundColor: "#006C35" }}>
          <div>
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-white/20 mb-6">
              <GraduationCap className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-xl font-bold mb-8">إكمال الملف الشخصي</h1>

            <div className="space-y-6">
              {[
                { step: 1, label: "البيانات الأساسية" },
                { step: 2, label: "التخصص والوظيفة" },
                { step: 3, label: "المكان والجهة" },
              ].map((item) => (
                <div key={item.step} className="flex items-center gap-3">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all border-2 ${currentStep >= item.step ? "bg-white text-primary border-white" : "border-white/30 text-white/30"
                    }`}>
                    {currentStep > item.step ? <CheckCircle2 className="h-4 w-4" /> : item.step}
                  </div>
                  <span className={`text-sm ${currentStep >= item.step ? "font-bold text-white" : "text-white/40"}`}>
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-12 pt-6 border-t border-white/10 hidden md:block">
            <p className="text-[10px] text-white/60">نظام توثيق مؤشرات الأداء الوظيفي</p>
          </div>
        </div>

        {/* Form Area */}
        <div className="flex-1 p-8 bg-background">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="h-full flex flex-col">
              <AnimatePresence mode="wait">
                {currentStep === 1 && (
                  <motion.div
                    key="step1"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-5 flex-1"
                  >
                    <div className="mb-6">
                      <h2 className="text-xl font-bold text-foreground">البيانات الشخصية</h2>
                      <p className="text-sm text-muted-foreground mt-1">ابدأ بإدخال معلوماتك الأساسية لتخصيص حسابك.</p>
                    </div>

                    <FormField
                      control={form.control}
                      name="fullNameArabic"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2 font-bold" style={{ color: "#006C35" }}>
                            <User className="h-4 w-4" />
                            الاسم الكامل
                          </FormLabel>
                          <FormControl>
                            <Input placeholder="الاسم الرباعي باللغة العربية" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="jobNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2 font-bold" style={{ color: "#006C35" }}>
                            <Hash className="h-4 w-4" />
                            الرقم الوظيفي
                          </FormLabel>
                          <FormControl>
                            <Input placeholder="أدخل الرقم الوظيفي" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="mobileNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2 font-bold" style={{ color: "#006C35" }}>
                            <Phone className="h-4 w-4" />
                            رقم الجوال
                          </FormLabel>
                          <FormControl>
                            <Input placeholder="05XXXXXXXX" dir="ltr" maxLength={10} {...field} />
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
                    className="space-y-5 flex-1"
                  >
                    <div className="mb-6">
                      <h2 className="text-xl font-bold text-foreground">التخصص والوظيفة</h2>
                      <p className="text-sm text-muted-foreground mt-1">المعلومات المهنية ضرورية لتصنيف مؤشرات الأداء.</p>
                    </div>

                    <FormField
                      control={form.control}
                      name="specialization"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2 font-bold" style={{ color: "#006C35" }}>
                            <BookOpen className="h-4 w-4" />
                            التخصص
                          </FormLabel>
                          <FormControl>
                            <Input placeholder="التخصص العلمي" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="subject"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2 font-bold" style={{ color: "#006C35" }}>
                            <BookOpen className="h-4 w-4" />
                            المادة الدراسية
                          </FormLabel>
                          <FormControl>
                            <Input placeholder="مادة أو مواد التدريس" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="educationalLevel"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2 font-bold" style={{ color: "#006C35" }}>
                            <GraduationCap className="h-4 w-4" />
                            الرتبة الوظيفية
                          </FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="اختر الرتبة" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {educationalLevels.map((level) => (
                                <SelectItem key={level.value} value={level.value}>
                                  {level.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </motion.div>
                )}

                {currentStep === 3 && (
                  <motion.div
                    key="step3"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-5 flex-1"
                  >
                    <div className="mb-6">
                      <h2 className="text-xl font-bold text-foreground">المكان والجهة</h2>
                      <p className="text-sm text-muted-foreground mt-1">الخطوة الأخيرة قبل الوصول إلى لوحة التحكم.</p>
                    </div>

                    <FormField
                      control={form.control}
                      name="schoolName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2 font-bold" style={{ color: "#006C35" }}>
                            <School className="h-4 w-4" />
                            اسم المدرسة
                          </FormLabel>
                          <FormControl>
                            <Input placeholder="أدخل اسم المدرسة" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="educationDepartment"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2 font-bold" style={{ color: "#006C35" }}>
                            <Building2 className="h-4 w-4" />
                            إدارة التعليم
                          </FormLabel>
                          <FormControl>
                            <Input placeholder="إدارة التعليم التابع لها" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex gap-4 pt-8 mt-auto border-t">
                {currentStep > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={prevStep}
                    className="flex-1 gap-2 border-primary text-primary hover:bg-primary/5"
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
                    style={{ backgroundColor: "#006C35" }}
                    disabled={onboardingMutation.isPending}
                  >
                    {onboardingMutation.isPending ? "جاري الحفظ..." : <><CheckCircle2 className="h-4 w-4" /> إنهاء التسجيل</>}
                  </Button>
                )}
              </div>
            </form>
          </Form>
        </div>
      </Card>
    </div>
  );
}
