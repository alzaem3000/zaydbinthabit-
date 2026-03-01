import { useLocation } from "wouter";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { ShieldCheck, User, Crown } from "lucide-react";

const loginSchema = z.object({
  nationalId: z.string().min(10, "رقم الهوية يجب أن يكون 10 أرقام"),
  mobileNumber: z.string().min(10, "رقم الجوال يجب أن يبدأ بـ 05 ويتكون من 10 أرقام"),
});

const registerSchema = loginSchema.extend({
  fullNameArabic: z.string().min(5, "يرجى إدخال الاسم الرباعي"),
});

const passwordSchema = z.object({
  password: z.string().min(1, "الرقم السري مطلوب"),
});

type RoleTab = "teacher" | "admin" | "creator";

export default function AuthPage() {
  const [, setLocation] = useLocation();
  const { loginMutation, registerMutation, adminLoginMutation, creatorLoginMutation, user } = useAuth();
  const { toast } = useToast();
  const [activeRole, setActiveRole] = useState<RoleTab>("teacher");
  const [teacherTab, setTeacherTab] = useState<"login" | "register">("login");

  if (user) {
    setLocation("/home");
  }

  const loginForm = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { nationalId: "", mobileNumber: "" },
  });

  const registerForm = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: { nationalId: "", mobileNumber: "", fullNameArabic: "" },
  });

  const adminForm = useForm({
    resolver: zodResolver(passwordSchema),
    defaultValues: { password: "" },
  });

  const creatorForm = useForm({
    resolver: zodResolver(passwordSchema),
    defaultValues: { password: "" },
  });

  const onLoginSubmit = (data: z.infer<typeof loginSchema>) => {
    loginMutation.mutate(data, {
      onError: (err: any) => {
        toast({
          title: "فشل الدخول",
          description: err.message || "تأكد من رقم الهوية ورقم الجوال",
          variant: "destructive"
        });
      }
    });
  };

  const onRegisterSubmit = (data: z.infer<typeof registerSchema>) => {
    registerMutation.mutate(data, {
      onError: (err: any) => {
        toast({
          title: "فشل التسجيل",
          description: err.message || "قد يكون الحساب مسجلاً مسبقاً",
          variant: "destructive"
        });
      }
    });
  };

  const onAdminSubmit = (data: z.infer<typeof passwordSchema>) => {
    adminLoginMutation.mutate(data, {
      onError: (err: any) => {
        toast({
          title: "فشل الدخول",
          description: err.message || "الرقم السري غير صحيح",
          variant: "destructive"
        });
      }
    });
  };

  const onCreatorSubmit = (data: z.infer<typeof passwordSchema>) => {
    creatorLoginMutation.mutate(data, {
      onError: (err: any) => {
        toast({
          title: "فشل الدخول",
          description: err.message || "الرقم السري غير صحيح",
          variant: "destructive"
        });
      }
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-4">
      <Card className="w-full max-w-lg shadow-2xl border-0 overflow-hidden">
        <CardHeader className="text-center space-y-2 pb-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
          <CardTitle className="text-2xl font-bold font-cairo">منصة زيد بن ثابت</CardTitle>
          <CardDescription className="text-blue-100 text-base">بوابة الدخول إلى النظام</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          {/* Role Selector */}
          <div className="flex gap-2 mb-6 justify-center" dir="rtl">
            <button
              onClick={() => setActiveRole("teacher")}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${activeRole === "teacher"
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-200 scale-105"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
            >
              <User className="w-4 h-4" />
              معلم
            </button>
            <button
              onClick={() => setActiveRole("admin")}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${activeRole === "admin"
                  ? "bg-emerald-600 text-white shadow-lg shadow-emerald-200 scale-105"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
            >
              <ShieldCheck className="w-4 h-4" />
              مدير المدرسة
            </button>
            <button
              onClick={() => setActiveRole("creator")}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${activeRole === "creator"
                  ? "bg-purple-600 text-white shadow-lg shadow-purple-200 scale-105"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
            >
              <Crown className="w-4 h-4" />
              منشئ الموقع
            </button>
          </div>

          {/* Teacher Section */}
          {activeRole === "teacher" && (
            <div>
              <Tabs value={teacherTab} onValueChange={(v) => setTeacherTab(v as "login" | "register")} className="w-full" dir="rtl">
                <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger value="login" className="font-cairo text-base">تسجيل الدخول</TabsTrigger>
                  <TabsTrigger value="register" className="font-cairo text-base">حساب جديد</TabsTrigger>
                </TabsList>

                <TabsContent value="login">
                  <Form {...loginForm}>
                    <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                      <FormField
                        control={loginForm.control}
                        name="nationalId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>رقم الهوية</FormLabel>
                            <FormControl>
                              <Input placeholder="10xxxxxxx" {...field} className="text-left h-11" dir="ltr" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={loginForm.control}
                        name="mobileNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>رقم الجوال</FormLabel>
                            <FormControl>
                              <Input placeholder="05xxxxxxxx" {...field} className="text-left h-11" dir="ltr" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button type="submit" className="w-full mt-6 h-12 text-lg bg-blue-600 hover:bg-blue-700" disabled={loginMutation.isPending}>
                        {loginMutation.isPending ? "جاري الدخول..." : "دخول"}
                      </Button>
                    </form>
                  </Form>
                </TabsContent>

                <TabsContent value="register">
                  <Form {...registerForm}>
                    <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4">
                      <FormField
                        control={registerForm.control}
                        name="fullNameArabic"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>الاسم الرباعي</FormLabel>
                            <FormControl>
                              <Input placeholder="الاسم كاملاً باللغة العربية" {...field} className="h-11" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={registerForm.control}
                        name="nationalId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>رقم الهوية</FormLabel>
                            <FormControl>
                              <Input placeholder="10xxxxxxx" {...field} className="text-left h-11" dir="ltr" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={registerForm.control}
                        name="mobileNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>رقم الجوال</FormLabel>
                            <FormControl>
                              <Input placeholder="05xxxxxxxx" {...field} className="text-left h-11" dir="ltr" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button type="submit" className="w-full mt-6 h-12 text-lg bg-blue-600 hover:bg-blue-700" disabled={registerMutation.isPending}>
                        {registerMutation.isPending ? "جاري التسجيل..." : "إنشاء حساب"}
                      </Button>
                    </form>
                  </Form>
                </TabsContent>
              </Tabs>
            </div>
          )}

          {/* Admin/Principal Section */}
          {activeRole === "admin" && (
            <div dir="rtl">
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-100 mb-3">
                  <ShieldCheck className="w-8 h-8 text-emerald-600" />
                </div>
                <h3 className="text-lg font-bold font-cairo text-gray-800">دخول مدير المدرسة</h3>
                <p className="text-sm text-gray-500 mt-1">أدخل الرقم السري للوصول إلى لوحة التحكم</p>
              </div>
              <Form {...adminForm}>
                <form onSubmit={adminForm.handleSubmit(onAdminSubmit)} className="space-y-4">
                  <FormField
                    control={adminForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>الرقم السري</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="••••••••" {...field} className="text-left h-11" dir="ltr" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full mt-6 h-12 text-lg bg-emerald-600 hover:bg-emerald-700" disabled={adminLoginMutation.isPending}>
                    {adminLoginMutation.isPending ? "جاري الدخول..." : "دخول كمدير"}
                  </Button>
                </form>
              </Form>
            </div>
          )}

          {/* Creator Section */}
          {activeRole === "creator" && (
            <div dir="rtl">
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-purple-100 mb-3">
                  <Crown className="w-8 h-8 text-purple-600" />
                </div>
                <h3 className="text-lg font-bold font-cairo text-gray-800">دخول منشئ الموقع</h3>
                <p className="text-sm text-gray-500 mt-1">وصول كامل لإدارة الموقع والإعدادات</p>
              </div>
              <Form {...creatorForm}>
                <form onSubmit={creatorForm.handleSubmit(onCreatorSubmit)} className="space-y-4">
                  <FormField
                    control={creatorForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>الرقم السري</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="••••••••" {...field} className="text-left h-11" dir="ltr" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full mt-6 h-12 text-lg bg-purple-600 hover:bg-purple-700" disabled={creatorLoginMutation.isPending}>
                    {creatorLoginMutation.isPending ? "جاري الدخول..." : "دخول كمنشئ"}
                  </Button>
                </form>
              </Form>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
