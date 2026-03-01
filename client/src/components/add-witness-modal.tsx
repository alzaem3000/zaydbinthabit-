import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState, useRef } from "react";
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
import { Save, Upload, X } from "lucide-react";
import type { Criteria } from "@shared/schema";
import imageCompression from "browser-image-compression";
import { useToast } from "@/hooks/use-toast";

const witnessFormSchema = z.object({
  title: z.string().min(3, "عنوان الشاهد يجب أن يكون 3 أحرف على الأقل"),
  description: z.string().optional(),
  criteriaId: z.string().optional(),
  fileType: z.string().optional(),
  fileName: z.string().optional(),
});

type WitnessFormValues = z.infer<typeof witnessFormSchema>;

interface AddWitnessModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: WitnessFormValues) => void;
  indicatorId: string;
  indicatorTitle?: string;
  criteria?: Criteria[];
  isLoading?: boolean;
}

export function AddWitnessModal({
  open,
  onOpenChange,
  onSubmit,
  indicatorTitle,
  criteria,
  isLoading
}: AddWitnessModalProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const form = useForm<WitnessFormValues>({
    resolver: zodResolver(witnessFormSchema),
    defaultValues: {
      title: "",
      description: "",
      criteriaId: "",
      fileType: "",
      fileName: "",
    },
  });

  const handleSubmit = async (data: WitnessFormValues) => {
    if (selectedFile) {
      if (selectedFile.size > 2 * 1024 * 1024) {
        alert("حجم الملف كبير جداً (الحد الأقصى 2 ميجابايت)");
        return;
      }

      setIsUploading(true);
      try {
        let fileToUpload = selectedFile;
        // Image compression
        if (fileToUpload.type.startsWith("image/")) {
          toast({
            title: "جاري المعالجة",
            description: "يتم الآن ضغط الصورة لتقليل حجمها...",
            duration: 3000,
          });
          const options = {
            maxSizeMB: 1,
            maxWidthOrHeight: 1920,
            useWebWorker: true,
          };
          fileToUpload = await imageCompression(fileToUpload, options);
        }

        const reader = new FileReader();
        const fileData = await new Promise<string>((resolve, reject) => {
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(fileToUpload);
        });

        const submitData = {
          ...data,
          fileName: fileToUpload.name,
          fileData,
        };

        await onSubmit(submitData as any);
        form.reset();
        setSelectedFile(null);
      } catch (error) {
        console.error("Error reading/compressing file:", error);
        toast({
          title: "حدث خطأ",
          description: "حدث خطأ أثناء معالجة الملف",
          variant: "destructive",
        });
      } finally {
        setIsUploading(false);
      }
    } else {
      onSubmit(data);
      form.reset();
    }
  };

  const handleClose = () => {
    form.reset();
    setSelectedFile(null);
    onOpenChange(false);
  };

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    if (file.type.includes('pdf')) {
      form.setValue('fileType', 'pdf');
    } else if (file.type.includes('image')) {
      form.setValue('fileType', 'image');
    } else if (file.type.includes('video')) {
      form.setValue('fileType', 'video');
    } else {
      form.setValue('fileType', 'document');
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto" data-testid="modal-add-witness">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-primary" data-testid="text-witness-modal-title">
            إضافة شاهد جديد
          </DialogTitle>
          {indicatorTitle && (
            <p className="text-sm text-muted-foreground mt-1">
              للمؤشر: {indicatorTitle}
            </p>
          )}
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-bold text-primary">عنوان الشاهد</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="أدخل عنوان الشاهد"
                      {...field}
                      data-testid="input-witness-title"
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
                  <FormLabel className="font-bold text-primary">الوصف (اختياري)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="أدخل وصف الشاهد"
                      {...field}
                      className="resize-none"
                      rows={3}
                      data-testid="input-witness-description"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {criteria && criteria.length > 0 && (
              <FormField
                control={form.control}
                name="criteriaId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-bold text-primary">المعيار المرتبط (اختياري)</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-criteria">
                          <SelectValue placeholder="اختر المعيار" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {criteria.map((c) => (
                          <SelectItem key={c.id} value={c.id} data-testid={`option-criteria-${c.id}`}>
                            {c.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="fileType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-bold text-primary">نوع الملف (اختياري)</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-file-type">
                        <SelectValue placeholder="اختر نوع الملف" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="pdf">ملف PDF</SelectItem>
                      <SelectItem value="image">صورة</SelectItem>
                      <SelectItem value="video">فيديو</SelectItem>
                      <SelectItem value="document">مستند</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div
              className="border-2 border-dashed border-border rounded-lg p-6 text-center bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer"
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              data-testid="drop-zone-file"
            >
              <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground mb-2">
                {selectedFile ? `الملف المختار: ${selectedFile.name}` : "اسحب الملف هنا أو انقر للاختيار"}
              </p>
              {selectedFile && (
                <button
                  type="button"
                  className="inline-flex items-center gap-1 text-xs text-destructive hover:text-destructive/80 mb-2"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedFile(null);
                  }}
                  data-testid="button-clear-file"
                >
                  <X className="h-3 w-3" />
                  إزالة الملف
                </button>
              )}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
                data-testid="button-upload-file"
              >
                <Upload className="h-4 w-4 ml-2" />
                اختر ملف
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files?.[0]) {
                    handleFileSelect(e.target.files[0]);
                  }
                }}
                data-testid="input-file-upload"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="submit"
                className="flex-1 gap-2"
                disabled={isLoading}
                data-testid="button-save-witness"
              >
                <Save className="h-4 w-4" />
                {isLoading ? "جاري الحفظ..." : "حفظ الشاهد"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                data-testid="button-cancel-witness"
              >
                إلغاء
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
