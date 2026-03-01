import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useLocation } from 'wouter';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Save, Eye, Globe, X, Undo2, Redo2, CheckCircle, AlertCircle, Loader2, Settings, PanelRightClose, PanelRightOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useSurveyStore } from '@/lib/survey-store';
import { QuestionBank } from '@/components/survey/QuestionBank';
import { QuestionCanvas } from '@/components/survey/QuestionCanvas';
import { SurveySettingsPanel } from '@/components/survey/SurveySettingsPanel';
import { SurveyPreview } from '@/components/survey/SurveyPreview';
import { useToast } from '@/hooks/use-toast';
import type { BuilderSurvey } from '@/lib/survey-types';

async function fetchSurvey(id: string): Promise<BuilderSurvey> {
    const res = await fetch(`/api/surveys/${id}`);
    if (!res.ok) throw new Error('Failed to fetch survey');
    return res.json();
}

async function saveSurvey(survey: BuilderSurvey): Promise<BuilderSurvey> {
    const isNew = !survey.id;
    const url = isNew ? '/api/surveys' : `/api/surveys/${survey.id}`;
    const method = isNew ? 'POST' : 'PATCH';

    const metaRes = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: survey.title, description: survey.description, settings: survey.settings }),
    });
    if (!metaRes.ok) throw new Error('Failed to save survey');
    const savedSurvey: BuilderSurvey = await metaRes.json();

    // Save questions
    const questionsRes = await fetch(`/api/surveys/${savedSurvey.id}/questions`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            questions: survey.questions.map(({ id, ...rest }) => ({
                ...rest,
                // Only include DB id if it's not a temp id
                ...(id.startsWith('temp_') ? {} : { id }),
            })),
        }),
    });
    if (!questionsRes.ok) throw new Error('Failed to save questions');

    return { ...savedSurvey, questions: survey.questions };
}

async function publishSurvey(id: string): Promise<BuilderSurvey> {
    const res = await fetch(`/api/surveys/${id}/publish`, { method: 'POST' });
    if (!res.ok) throw new Error('Failed to publish survey');
    return res.json();
}

const STATUS_CONFIG = {
    draft: { label: 'مسودة', color: 'bg-gray-100 text-gray-600' },
    published: { label: 'منشور', color: 'bg-green-100 text-green-700' },
    closed: { label: 'مغلق', color: 'bg-red-100 text-red-600' },
};

export default function SurveyBuilderPage() {
    const params = useParams<{ id?: string }>();
    const [, navigate] = useLocation();
    const { toast } = useToast();
    const qc = useQueryClient();
    const saveTimerRef = useRef<NodeJS.Timeout | null>(null);

    const { survey, setSurvey, setSaveStatus, saveStatus, undo, redo, undoStack, redoStack, updateSurveyMeta } = useSurveyStore();

    const [showPreview, setShowPreview] = useState(false);
    const [showSettings, setShowSettings] = useState(true);

    // Load existing survey
    const { data: fetchedSurvey } = useQuery({
        queryKey: ['/api/surveys', params.id],
        queryFn: () => fetchSurvey(params.id!),
        enabled: !!params.id && params.id !== 'new',
    });

    useEffect(() => {
        if (fetchedSurvey) {
            setSurvey(fetchedSurvey as BuilderSurvey);
        } else if (!params.id || params.id === 'new') {
            if (!survey) {
                setSurvey({
                    title: 'استبيان بدون عنوان',
                    description: '',
                    status: 'draft',
                    settings: { themeColor: '#3B82F6', showProgressBar: true },
                    questions: [],
                });
            }
        }
    }, [fetchedSurvey, params.id]);

    const saveMutation = useMutation({
        mutationFn: saveSurvey,
        onMutate: () => setSaveStatus('saving'),
        onSuccess: (saved) => {
            setSaveStatus('saved');
            setSurvey(saved);
            qc.invalidateQueries({ queryKey: ['/api/surveys'] });
            if (!params.id || params.id === 'new') {
                navigate(`/surveys/${saved.id}/edit`, { replace: true });
            }
        },
        onError: () => {
            setSaveStatus('error');
            toast({ title: 'خطأ في الحفظ', variant: 'destructive' });
        },
    });

    const publishMutation = useMutation({
        mutationFn: async () => {
            if (!survey?.id) {
                const saved = await saveSurvey(survey!);
                return publishSurvey(saved.id!);
            }
            await saveSurvey(survey!);
            return publishSurvey(survey!.id!);
        },
        onSuccess: (published) => {
            setSurvey({ ...survey!, ...published });
            setSaveStatus('saved');
            qc.invalidateQueries({ queryKey: ['/api/surveys'] });
            toast({ title: 'تم نشر الاستبيان ✓', description: 'رابط المشاركة جاهز' });
        },
        onError: () => toast({ title: 'خطأ في النشر', variant: 'destructive' }),
    });

    // Auto-save with 1.5s debounce when content changes
    useEffect(() => {
        if (saveStatus === 'unsaved' && survey) {
            if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
            saveTimerRef.current = setTimeout(() => {
                saveMutation.mutate(survey);
            }, 1500);
        }
        return () => { if (saveTimerRef.current) clearTimeout(saveTimerRef.current); };
    }, [saveStatus, survey]);

    const handleCopyLink = () => {
        if (survey?.shareToken) {
            const url = `${window.location.origin}/s/${survey.shareToken}`;
            navigator.clipboard.writeText(url);
            toast({ title: 'تم نسخ الرابط' });
        }
    };

    if (!survey) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    const status = survey.status as keyof typeof STATUS_CONFIG;

    return (
        <div className="h-screen flex flex-col bg-gray-50" dir="rtl">
            {/* Header */}
            <header className="flex items-center gap-3 px-4 py-2.5 bg-white border-b border-gray-200 shadow-sm z-20 flex-shrink-0">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate('/surveys')}>
                    <ArrowRight className="w-4 h-4" />
                </Button>

                {/* Inline title editor */}
                <Input
                    value={survey.title}
                    onChange={(e) => updateSurveyMeta({ title: e.target.value })}
                    className="flex-1 max-w-sm border-0 shadow-none text-sm font-semibold focus-visible:ring-0 focus-visible:ring-offset-0 p-0 h-auto"
                    dir="rtl"
                />

                <Badge className={STATUS_CONFIG[status]?.color}>{STATUS_CONFIG[status]?.label}</Badge>

                {/* Save status */}
                <div className="flex items-center gap-1 text-xs">
                    {saveStatus === 'saving' && <><Loader2 className="w-3 h-3 animate-spin text-gray-400" /><span className="text-gray-400">يحفظ...</span></>}
                    {saveStatus === 'saved' && <><CheckCircle className="w-3 h-3 text-green-500" /><span className="text-gray-400">محفوظ</span></>}
                    {saveStatus === 'unsaved' && <><AlertCircle className="w-3 h-3 text-amber-500" /><span className="text-amber-600">غير محفوظ</span></>}
                    {saveStatus === 'error' && <><X className="w-3 h-3 text-red-500" /><span className="text-red-500">خطأ</span></>}
                </div>

                <div className="flex items-center gap-1 mr-auto">
                    {/* Undo / Redo */}
                    <Button variant="ghost" size="icon" className="h-8 w-8" disabled={undoStack.length === 0} onClick={undo} title="تراجع">
                        <Undo2 className="w-3.5 h-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" disabled={redoStack.length === 0} onClick={redo} title="إعادة">
                        <Redo2 className="w-3.5 h-3.5" />
                    </Button>

                    <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={() => setShowSettings(!showSettings)}>
                        <Settings className="w-3.5 h-3.5 ml-1" />
                        {showSettings ? 'إخفاء الإعدادات' : 'الإعدادات'}
                    </Button>

                    <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => setShowPreview(true)}>
                        <Eye className="w-3.5 h-3.5 ml-1" />
                        معاينة
                    </Button>

                    {survey.status === 'published' && survey.shareToken ? (
                        <Button size="sm" className="h-8 text-xs" onClick={handleCopyLink}>
                            <Globe className="w-3.5 h-3.5 ml-1" />
                            نسخ الرابط
                        </Button>
                    ) : (
                        <Button
                            size="sm"
                            className="h-8 text-xs bg-green-600 hover:bg-green-700"
                            onClick={() => publishMutation.mutate()}
                            disabled={publishMutation.isPending}
                        >
                            {publishMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin ml-1" /> : <Globe className="w-3.5 h-3.5 ml-1" />}
                            نشر
                        </Button>
                    )}
                </div>
            </header>

            {/* 3-column body */}
            <div className="flex flex-1 overflow-hidden">
                {/* Left: Question Bank */}
                <div className="w-64 flex-shrink-0">
                    <QuestionBank />
                </div>

                {/* Center: Canvas */}
                <div className="flex-1 overflow-hidden">
                    <QuestionCanvas />
                </div>

                {/* Right: Settings */}
                <AnimatePresence>
                    {showSettings && (
                        <motion.div
                            initial={{ width: 0, opacity: 0 }}
                            animate={{ width: 280, opacity: 1 }}
                            exit={{ width: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="flex-shrink-0 overflow-hidden"
                        >
                            <SurveySettingsPanel />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Preview Modal */}
            <AnimatePresence>
                {showPreview && <SurveyPreview onClose={() => setShowPreview(false)} />}
            </AnimatePresence>
        </div>
    );
}
