import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { motion } from 'framer-motion';
import {
    Plus, FileText, Globe, Lock, Trash2, BarChart3, Copy, ExternalLink, Users, Calendar, PenLine
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useSurveyStore } from '@/lib/survey-store';
import type { BuilderSurvey } from '@/lib/survey-types';
import { cn } from '@/lib/utils';

async function fetchSurveys(): Promise<BuilderSurvey[]> {
    const res = await fetch('/api/surveys');
    if (!res.ok) throw new Error('Failed');
    return res.json();
}

async function createSurvey(): Promise<BuilderSurvey> {
    const res = await fetch('/api/surveys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'استبيان بدون عنوان' }),
    });
    if (!res.ok) throw new Error('Failed');
    return res.json();
}

async function deleteSurvey(id: string): Promise<void> {
    await fetch(`/api/surveys/${id}`, { method: 'DELETE' });
}

const STATUS_CONFIG = {
    draft: { label: 'مسودة', icon: FileText, color: 'bg-gray-100 text-gray-600', dot: 'bg-gray-400' },
    published: { label: 'منشور', icon: Globe, color: 'bg-green-100 text-green-700', dot: 'bg-green-500' },
    closed: { label: 'مغلق', icon: Lock, color: 'bg-red-100 text-red-600', dot: 'bg-red-400' },
};

function SurveyCard({ survey, onEdit, onDelete }: { survey: BuilderSurvey; onEdit: () => void; onDelete: () => void }) {
    const { toast } = useToast();
    const status = (survey.status as keyof typeof STATUS_CONFIG) ?? 'draft';
    const cfg = STATUS_CONFIG[status];
    const Icon = cfg.icon;
    const themeColor = survey.settings?.themeColor ?? '#3B82F6';

    const handleCopyLink = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (survey.shareToken) {
            navigator.clipboard.writeText(`${window.location.origin}/s/${survey.shareToken}`);
            toast({ title: 'تم نسخ الرابط' });
        }
    };

    return (
        <motion.div
            whileHover={{ y: -4, shadow: '0 20px 50px rgba(0,0,0,0.1)' }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="group"
        >
            <Card className="overflow-hidden border-2 border-transparent hover:border-primary/20 transition-all duration-200 cursor-pointer shadow-sm hover:shadow-xl" onClick={onEdit}>
                {/* Colored top bar */}
                <div className="h-2" style={{ backgroundColor: themeColor }} />
                <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-2 mb-3">
                        <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-gray-800 text-base truncate" dir="rtl">{survey.title || 'بدون عنوان'}</h3>
                            {survey.description && (
                                <p className="text-xs text-gray-500 mt-0.5 line-clamp-2" dir="rtl">{survey.description}</p>
                            )}
                        </div>
                        <Badge className={cn('flex-shrink-0 gap-1', cfg.color)}>
                            <span className={cn('w-1.5 h-1.5 rounded-full', cfg.dot)} />
                            {cfg.label}
                        </Badge>
                    </div>

                    <div className="flex items-center gap-4 text-xs text-gray-500 mb-4">
                        <span className="flex items-center gap-1">
                            <FileText className="w-3.5 h-3.5" />
                            {survey.questions?.length ?? 0} سؤال
                        </span>
                        <span className="flex items-center gap-1">
                            <Users className="w-3.5 h-3.5" />
                            {survey.responseCount ?? 0} استجابة
                        </span>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                        <Button variant="outline" size="sm" className="h-7 text-xs flex-1" onClick={onEdit}>
                            <PenLine className="w-3 h-3 ml-1" />
                            تحرير
                        </Button>
                        {survey.status === 'published' && survey.shareToken && (
                            <Button variant="outline" size="sm" className="h-7 text-xs" onClick={handleCopyLink}>
                                <Copy className="w-3 h-3 ml-1" />
                                رابط
                            </Button>
                        )}
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-gray-400 hover:text-red-500 hover:bg-red-50"
                            onClick={(e) => { e.stopPropagation(); onDelete(); }}
                        >
                            <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    );
}

export default function SurveysDashboard() {
    const [, navigate] = useLocation();
    const { toast } = useToast();
    const qc = useQueryClient();
    const { resetBuilder } = useSurveyStore();

    const { data: surveys = [], isLoading } = useQuery({
        queryKey: ['/api/surveys'],
        queryFn: fetchSurveys,
    });

    const createMutation = useMutation({
        mutationFn: createSurvey,
        onSuccess: (s) => {
            qc.invalidateQueries({ queryKey: ['/api/surveys'] });
            resetBuilder();
            navigate(`/surveys/${s.id}/edit`);
        },
        onError: () => toast({ title: 'خطأ في إنشاء الاستبيان', variant: 'destructive' }),
    });

    const deleteMutation = useMutation({
        mutationFn: deleteSurvey,
        onSuccess: () => qc.invalidateQueries({ queryKey: ['/api/surveys'] }),
        onError: () => toast({ title: 'خطأ في الحذف', variant: 'destructive' }),
    });

    const stats = {
        total: surveys.length,
        published: surveys.filter((s) => s.status === 'published').length,
        responses: surveys.reduce((acc, s) => acc + (s.responseCount ?? 0), 0),
    };

    return (
        <div className="min-h-screen bg-gray-50" dir="rtl">
            {/* Page Header */}
            <div className="bg-white border-b border-gray-200">
                <div className="max-w-6xl mx-auto px-6 py-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">الاستبيانات</h1>
                            <p className="text-sm text-gray-500 mt-0.5">أنشئ وأدِر استبياناتك الاحترافية</p>
                        </div>
                        <Button
                            onClick={() => createMutation.mutate()}
                            disabled={createMutation.isPending}
                            className="shadow-lg shadow-primary/25"
                        >
                            <Plus className="w-4 h-4 ml-2" />
                            استبيان جديد
                        </Button>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-4 mt-6">
                        {[
                            { label: 'إجمالي الاستبيانات', value: stats.total, color: 'text-blue-600' },
                            { label: 'منشور', value: stats.published, color: 'text-green-600' },
                            { label: 'إجمالي الاستجابات', value: stats.responses, color: 'text-purple-600' },
                        ].map((stat) => (
                            <div key={stat.label} className="bg-gray-50 rounded-xl p-4 text-center">
                                <p className={cn('text-3xl font-bold', stat.color)}>{stat.value}</p>
                                <p className="text-xs text-gray-500 mt-0.5">{stat.label}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-6xl mx-auto px-6 py-8">
                {isLoading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                        {[1, 2, 3].map((i) => <div key={i} className="h-48 bg-white rounded-xl animate-pulse border border-gray-200" />)}
                    </div>
                ) : surveys.length === 0 ? (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-24">
                        <div className="w-20 h-20 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <FileText className="w-10 h-10 text-primary/50" />
                        </div>
                        <h2 className="text-xl font-bold text-gray-700 mb-2">لم تنشئ استبياناً بعد</h2>
                        <p className="text-sm text-gray-500 mb-6">ابدأ بإنشاء استبيانك الأول في ثوانٍ</p>
                        <Button onClick={() => createMutation.mutate()} className="shadow-lg shadow-primary/25">
                            <Plus className="w-4 h-4 ml-2" />
                            إنشاء استبيان
                        </Button>
                    </motion.div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                        {surveys.map((s) => (
                            <SurveyCard
                                key={s.id}
                                survey={s}
                                onEdit={() => navigate(`/surveys/${s.id}/edit`)}
                                onDelete={() => { if (confirm('هل أنت متأكد من حذف هذا الاستبيان؟')) deleteMutation.mutate(s.id!); }}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
