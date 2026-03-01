import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { User as UserIcon } from "lucide-react";
import type { User } from "@shared/schema";

const educationalLevels = [
  { value: "معلم", label: "معلم" },
  { value: "معلم ممارس", label: "معلم ممارس" },
  { value: "معلم متقدم", label: "معلم متقدم" },
  { value: "معلم خبير", label: "معلم خبير" },
];

const editProfileSchema = z.object({
  firstName: z.string().min(1, "الاسم الأول مطلوب"),
  lastName: z.string().min(1, "الاسم الأخير مطلوب"),
  educationalLevel: z.string().min(1, "الرتبة التربوية مطلوبة"),
  schoolName: z.string().optional(),
  educationDepartment: z.string().optional(),
  subject: z.string().optional(),
  yearsOfService: z.number().int().min(0).optional(),
  contactEmail: z.string().email("بريد إلكتروني غير صحيح").optional().or(z.literal("")),
});

type EditProfileFormValues = z.infer<typeof editProfileSchema>;

interface EditProfileModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user?: User;
  onSubmit: (data: Partial<User>) => void;
  isLoading?: boolean;
}

export function EditProfileModal({
  open,
  onOpenChange,
  user,
  onSubmit,
  isLoading = false,
}: EditProfileModalProps) {
  const form = useForm<EditProfileFormValues>({
    resolver: zodResolver(editProfileSchema),
    defaultValues: {
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      educationalLevel: user?.educationalLevel || "معلم",
      schoolName: user?.schoolName || "",
      educationDepartment: user?.educationDepartment || "",
      subject: user?.subject || "",
      yearsOfService: user?.yearsOfService || 0,
      contactEmail: user?.contactEmail || "",
    },
  });

  useEffect(() => {
    if (open && user) {
      form.reset({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        educationalLevel: user.educationalLevel || "معلم",
        schoolName: user.schoolName || "",
        educationDepartment: user.educationDepartment || "",
        subject: user.subject || "",
        yearsOfService: user.yearsOfService || 0,
        contactEmail: user.contactEmail || "",
      });
    }
  }, [open, user, form]);

  const handleFormSubmit = (data: EditProfileFormValues) => {
    onSubmit({
      firstName: data.firstName,
      lastName: data.lastName,
      educationalLevel: data.educationalLevel,
      schoolName: data.schoolName,
      educationDepartment: data.educationDepartment,
      subject: data.subject,
      yearsOfService: data.yearsOfService,
      contactEmail: data.contactEmail,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl" data-testid="edit-profile-modal">
        <DialogHeader className="text-right">
          <div className="flex items-center gap-2 justify-end">
            <DialogTitle className="text-xl">تحرير بيانات المعلم/ة</DialogTitle>
            <UserIcon className="h-5 w-5 text-primary" />
          </div>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
            {/* Name Row */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>الاسم الأول *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="أدخل الاسم الأول"
                        {...field}
                        data-testid="input-first-name"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>الاسم الأخير *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="أدخل الاسم الأخير"
                        {...field}
                        data-testid="input-last-name"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            {/* Educational Level Row */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="educationalLevel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>الرتبة التربوية *</FormLabel>
                    <FormControl>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger data-testid="select-educational-level">
                          <SelectValue placeholder="اختر الرتبة التربوية" />
                        </SelectTrigger>
                        <SelectContent>
                          {educationalLevels.map((level) => (
                            <SelectItem key={level.value} value={level.value}>
                              {level.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="subject"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>المادة التعليمية</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="أدخل المادة التعليمية"
                        {...field}
                        data-testid="input-subject"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            {/* School and Department Row */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="schoolName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>المدرسة</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="أدخل اسم المدرسة"
                        {...field}
                        data-testid="input-school-name"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="educationDepartment"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>إدارة التعليم</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="أدخل إدارة التعليم"
                        {...field}
                        data-testid="input-education-department"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            {/* Years of Service and Contact Email Row */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="yearsOfService"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>سنوات الخدمة</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="أدخل سنوات الخدمة"
                        {...field}
                        onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : 0)}
                        data-testid="input-years-of-service"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="contactEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>وسيلة التواصل (البريد الإلكتروني)</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="أدخل البريد الإلكتروني"
                        {...field}
                        data-testid="input-contact-email"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            {/* Form Actions */}
            <div className="flex gap-3 pt-6 border-t justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                data-testid="button-cancel"
              >
                إلغاء
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
                className="gap-2"
                data-testid="button-save-profile"
              >
                {isLoading ? "جاري الحفظ..." : "حفظ البيانات"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
