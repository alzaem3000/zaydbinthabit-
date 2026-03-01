import { useState, useEffect } from 'react';
import { useParams, useLocation } from 'wouter';
import { useQuery, useMutation } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, CheckCircle2, AlertCircle, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import type { BuilderSurvey, BuilderQuestion, ConditionalRule } from '@/lib/survey-types';
import { cn } from '@/lib/utils';

// Conditional logic engine
function evaluateRule(rule: ConditionalRule, answers: Record<string, unknown>): boolean {
    const val = answers[rule.questionId];
    const strVal = Array.isArray(val) ? (val as string[]).join(',') : String(val ?? '');
    switch (rule.operator) {
        case 'equals': return strVal === rule.value;
        case 'not_equals': return strVal !== rule.value;
        case 'contains': return strVal.includes(rule.value);
        case 'is_empty': return !strVal;
        case 'is_not_empty': return !!strVal;
        case 'greater_than': return Number(strVal) > Number(rule.value);
        case 'less_than': return Number(strVal) < Number(rule.value);
        default: return true;
    }
}

function isVisible(q: BuilderQuestion, answers: Record<string, unknown>): boolean {
    if (!q.conditionalLogic?.length) return true;
    for (const rule of q.conditionalLogic) {
        if (evaluateRule(rule, answers)) return rule.action === 'show';
    }
    return true;
}

function validate(q: BuilderQuestion, answers: Record<string, unknown>): string | null {
    if (!q.required) return null;
    const val = answers[q.id];
    if (val === undefined || val === null || val === '' || (Array.isArray(val) && val.length === 0)) {
        return 'هذا السؤال مطلوب';
    }
    if (q.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(val))) {
        return 'يرجى إدخال بريد إلكتروني صحيح';
    }
    return null;
}

function QuestionInput({ question, answer, onAnswer, error }: {
    question: BuilderQuestion; answer: unknown; onAnswer: (v: unknown) => void; error?: string | null;
}) {
    const [hoverStar, setHoverStar] = useState<number | null>(null);
    const maxRating = question.settings?.maxRating ?? 5;
    const minScale = question.settings?.minScale ?? 1;
    const maxScale = question.settings?.maxScale ?? 10;
    const opts = question.options ?? [];
    const themeColor = '#3B82F6'; // will be overridden per survey

    return (
        <div className="space-y-2">
            {['short_text', 'email'].includes(question.type) && (
                <Input
                    type={question.type === 'email' ? 'email' : 'text'}
                    value={String(answer ?? '')}
                    onChange={(e) => onAnswer(e.target.value)}
                    placeholder={question.settings?.placeholder || ''}
                    dir="rtl"
                    className={cn('text-base', error && 'border-red-400 focus-visible:ring-red-400')}
                />
            )}
            {question.type === 'long_text' && (
                <Textarea
                    value={String(answer ?? '')}
                    onChange={(e) => onAnswer(e.target.value)}
                    placeholder={question.settings?.placeholder || ''}
                    rows={4} dir="rtl"
                    className={cn('text-base resize-none', error && 'border-red-400')}
                />
            )}
            {question.type === 'number' && (
                <Input type="number" value={String(answer ?? '')} onChange={(e) => onAnswer(e.target.value)}
                    min={question.settings?.minValue} max={question.settings?.maxValue}
                    placeholder={question.settings?.placeholder || '0'}
                    className={cn('text-base', error && 'border-red-400')}
                />
            )}
            {question.type === 'date' && (
                <Input type="date" value={String(answer ?? '')} onChange={(e) => onAnswer(e.target.value)}
                    min={question.settings?.minDate} max={question.settings?.maxDate}
                    className={cn('text-base', error && 'border-red-400')}
                />
            )}
            {question.type === 'multiple_choice' && (
                <div className="space-y-2.5">
                    {opts.map((opt) => (
                        <label key={opt} className={cn('flex items-center gap-3 p-4 rounded-2xl border-2 cursor-pointer transition-all select-none',
                            answer === opt ? 'border-primary bg-primary/5' : 'border-gray-200 hover:border-gray-300 bg-white'
                        )}>
                            <div className={cn('w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all', answer === opt ? 'border-primary' : 'border-gray-300')}>
                                {answer === opt && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
                            </div>
                            <input type="radio" className="sr-only" checked={answer === opt} onChange={() => onAnswer(opt)} />
                            <span className="text-sm font-medium" dir="rtl">{opt}</span>
                        </label>
                    ))}
                </div>
            )}
            {question.type === 'checkbox' && (
                <div className="space-y-2.5">
                    {opts.map((opt) => {
                        const sel = Array.isArray(answer) && (answer as string[]).includes(opt);
                        const toggle = () => {
                            const cur = Array.isArray(answer) ? (answer as string[]) : [];
                            onAnswer(sel ? cur.filter((v) => v !== opt) : [...cur, opt]);
                        };
                        return (
                            <label key={opt} className={cn('flex items-center gap-3 p-4 rounded-2xl border-2 cursor-pointer transition-all select-none',
                                sel ? 'border-primary bg-primary/5' : 'border-gray-200 hover:border-gray-300 bg-white'
                            )}>
                                <div className={cn('w-5 h-5 rounded border-2 flex-shrink-0 flex items-center justify-center transition-all', sel ? 'border-primary bg-primary' : 'border-gray-300')}>
                                    {sel && <span className="text-white text-xs font-bold leading-none">✓</span>}
                                </div>
                                <input type="checkbox" className="sr-only" checked={sel} onChange={toggle} />
                                <span className="text-sm font-medium" dir="rtl">{opt}</span>
                            </label>
                        );
                    })}
                </div>
            )}
            {question.type === 'dropdown' && (
                <select value={String(answer ?? '')} onChange={(e) => onAnswer(e.target.value)}
                    className={cn('w-full border-2 rounded-2xl p-3 text-sm focus:border-primary outline-none bg-white transition-colors',
                        error ? 'border-red-400' : 'border-gray-200'
                    )} dir="rtl"
                >
                    <option value="">اختر...</option>
                    {opts.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
                </select>
            )}
            {question.type === 'rating' && (
                <div className="flex justify-center gap-2 py-2">
                    {Array.from({ length: maxRating }).map((_, i) => {
                        const filled = (hoverStar !== null ? hoverStar : Number(answer ?? 0)) > i;
                        return (
                            <Star key={i}
                                className={cn('w-10 h-10 cursor-pointer transition-all duration-100', filled ? 'fill-amber-400 text-amber-400 scale-110' : 'text-gray-300 hover:scale-110')}
                                onMouseEnter={() => setHoverStar(i + 1)}
                                onMouseLeave={() => setHoverStar(null)}
                                onClick={() => onAnswer(i + 1)}
                            />
                        );
                    })}
                </div>
            )}
            {question.type === 'scale' && (
                <div className="space-y-3">
                    <div className="flex gap-1.5 flex-wrap justify-center">
                        {Array.from({ length: maxScale - minScale + 1 }).map((_, i) => {
                            const v = minScale + i;
                            return (
                                <button key={v} onClick={() => onAnswer(v)}
                                    className={cn('w-11 h-11 rounded-xl font-bold text-sm border-2 transition-all',
                                        answer === v ? 'border-primary bg-primary text-white shadow-lg' : 'border-gray-200 text-gray-600 hover:border-primary bg-white'
                                    )}
                                >
                                    {v}
                                </button>
                            );
                        })}
                    </div>
                    <div className="flex justify-between text-xs text-gray-400 px-1">
                        <span>{question.settings?.minLabel}</span>
                        <span>{question.settings?.maxLabel}</span>
                    </div>
                </div>
            )}
            {error && (
                <p className="flex items-center gap-1 text-xs text-red-500">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {error}
                </p>
            )}
        </div>
    );
}

export default function SurveyResponsePage() {
    const params = useParams<{ token: string }>();
    const [, navigate] = useLocation();
    const [answers, setAnswers] = useState<Record<string, unknown>>({});
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [currentPage, setCurrentPage] = useState(0);
    const [submitted, setSubmitted] = useState(false);

    const { data: survey, isLoading, isError } = useQuery<BuilderSurvey>({
        queryKey: ['/api/s', params.token],
        queryFn: async () => {
            const res = await fetch(`/api/s/${params.token}`);
            if (!res.ok) throw new Error('Survey not found');
            return res.json();
        },
    });

    const submitMutation = useMutation({
        mutationFn: async () => {
            const res = await fetch(`/api/s/${params.token}/respond`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ answers }),
            });
            if (!res.ok) throw new Error('Submit failed');
            return res.json();
        },
        onSuccess: () => {
            setSubmitted(true);
        },
    });

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
                <div className="text-center">
                    <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto mb-3" />
                    <p className="text-gray-500 text-sm">جاري تحميل الاستبيان...</p>
                </div>
            </div>
        );
    }

    if (isError || !survey) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
                <div className="text-center">
                    <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
                    <h2 className="text-lg font-bold text-gray-700">الاستبيان غير موجود</h2>
                    <p className="text-gray-500 text-sm mt-1">هذا الرابط غير صالح أو انتهت صلاحيته</p>
                </div>
            </div>
        );
    }

    const themeColor = survey.settings?.themeColor ?? '#3B82F6';
    const visibleQuestions = (survey.questions ?? []).filter((q) => isVisible(q as BuilderQuestion, answers)) as BuilderQuestion[];
    const onePerPage = survey.settings?.oneQuestionPerPage;
    const showProgress = survey.settings?.showProgressBar ?? true;
    const displayedQuestions = onePerPage ? [visibleQuestions[currentPage]].filter(Boolean) : visibleQuestions;
    const total = visibleQuestions.length;
    const progress = total > 0 ? Math.round(((onePerPage ? currentPage : total) / total) * 100) : 0;

    if (submitted) {
        const msg = survey.settings?.thankYouMessage || 'شكراً لك على ملء الاستبيان!';
        return (
            <div className="min-h-screen flex items-center justify-center p-4" style={{ background: `linear-gradient(135deg, ${themeColor}22, ${themeColor}08)` }}>
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-3xl p-10 shadow-2xl text-center max-w-md w-full">
                    <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-5" style={{ backgroundColor: `${themeColor}22` }}>
                        <CheckCircle2 className="w-10 h-10" style={{ color: themeColor }} />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-2" dir="rtl">{msg}</h2>
                    <p className="text-gray-500 text-sm" dir="rtl">تم تسجيل إجابتك بنجاح</p>
                </motion.div>
            </div>
        );
    }

    const handleSubmit = () => {
        // Validate all visible questions
        const newErrors: Record<string, string> = {};
        for (const q of visibleQuestions) {
            const err = validate(q, answers);
            if (err) newErrors[q.id] = err;
        }
        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }
        submitMutation.mutate();
    };

    const handleNext = () => {
        if (onePerPage) {
            const currentQ = visibleQuestions[currentPage];
            const err = validate(currentQ, answers);
            if (err) {
                setErrors({ [currentQ.id]: err });
                return;
            }
            setErrors({});
            setCurrentPage((p) => p + 1);
        }
    };

    return (
        <div className="min-h-screen py-8 px-4" style={{ background: `linear-gradient(135deg, ${themeColor}18, ${themeColor}06)` }} dir="rtl">
            <div className="max-w-xl mx-auto space-y-4">
                {/* Survey Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-3xl p-7 text-white shadow-xl"
                    style={{ background: `linear-gradient(135deg, ${themeColor}, ${themeColor}bb)` }}
                >
                    <h1 className="text-xl font-bold mb-1">{survey.title}</h1>
                    {survey.description && <p className="text-sm opacity-85">{survey.description}</p>}
                    <p className="text-xs opacity-70 mt-2">{total} سؤال</p>
                </motion.div>

                {/* Progress Bar */}
                {showProgress && (
                    <div className="bg-white rounded-xl px-4 py-3 shadow-sm">
                        <div className="flex items-center justify-between text-xs text-gray-500 mb-1.5">
                            <span>التقدم</span>
                            <span>{progress}%</span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                            <motion.div
                                className="h-full rounded-full"
                                style={{ backgroundColor: themeColor }}
                                initial={{ width: 0 }}
                                animate={{ width: `${progress}%` }}
                                transition={{ duration: 0.4 }}
                            />
                        </div>
                    </div>
                )}

                {/* Questions */}
                <AnimatePresence mode="wait">
                    {displayedQuestions.map((q, idx) => (
                        <motion.div key={q.id}
                            initial={{ opacity: 0, x: 30 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -30 }}
                            transition={{ duration: 0.3 }}
                            className="bg-white rounded-3xl p-6 shadow-sm"
                        >
                            <div className="mb-4">
                                <div className="flex items-start gap-2">
                                    <span className="text-sm font-bold mt-0.5" style={{ color: themeColor }}>
                                        {onePerPage ? currentPage + 1 : (survey.questions ?? []).indexOf(q) + 1}.
                                    </span>
                                    <div>
                                        <p className="text-base font-semibold text-gray-800">
                                            {q.title}
                                            {q.required && <span className="text-red-500 mr-1">*</span>}
                                        </p>
                                        {q.description && <p className="text-sm text-gray-500 mt-0.5">{q.description}</p>}
                                    </div>
                                </div>
                            </div>
                            <QuestionInput
                                question={q}
                                answer={answers[q.id]}
                                onAnswer={(v) => {
                                    setAnswers((prev) => ({ ...prev, [q.id]: v }));
                                    setErrors((prev) => { const n = { ...prev }; delete n[q.id]; return n; });
                                }}
                                error={errors[q.id]}
                            />
                        </motion.div>
                    ))}
                </AnimatePresence>

                {/* Navigation */}
                <div className="flex items-center gap-3">
                    {onePerPage && currentPage > 0 && (
                        <Button variant="outline" className="flex-1" onClick={() => setCurrentPage((p) => p - 1)}>
                            <ChevronRight className="w-4 h-4 ml-1" />
                            السابق
                        </Button>
                    )}
                    {onePerPage && currentPage < total - 1 ? (
                        <Button className="flex-1 shadow-lg" style={{ backgroundColor: themeColor, borderColor: themeColor }} onClick={handleNext}>
                            التالي
                            <ChevronLeft className="w-4 h-4 mr-1" />
                        </Button>
                    ) : (
                        <Button
                            className="flex-1 py-6 text-base font-bold shadow-xl transition-transform hover:scale-[1.02]"
                            style={{ backgroundColor: themeColor }}
                            onClick={handleSubmit}
                            disabled={submitMutation.isPending}
                        >
                            {submitMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin ml-2" /> : null}
                            إرسال الإجابات
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
}
