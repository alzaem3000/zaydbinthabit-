import { useState } from 'react';
import { X, Monitor, Phone, Star } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useSurveyStore } from '@/lib/survey-store';
import type { BuilderQuestion, ConditionalRule } from '@/lib/survey-types';
import { cn } from '@/lib/utils';

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

function isQuestionVisible(question: BuilderQuestion, answers: Record<string, unknown>): boolean {
    if (!question.conditionalLogic || question.conditionalLogic.length === 0) return true;
    // Apply the first matching rule; default visible
    for (const rule of question.conditionalLogic) {
        if (evaluateRule(rule, answers)) {
            return rule.action === 'show';
        }
    }
    return true;
}

function PreviewQuestion({ question, answer, onAnswer }: {
    question: BuilderQuestion;
    answer: unknown;
    onAnswer: (val: unknown) => void;
}) {
    const [hoverRating, setHoverRating] = useState<number | null>(null);
    const maxRating = question.settings?.maxRating ?? 5;
    const minScale = question.settings?.minScale ?? 1;
    const maxScale = question.settings?.maxScale ?? 10;
    const opts = question.options ?? [];

    return (
        <div className="space-y-3">
            {question.type === 'short_text' && (
                <Input value={String(answer ?? '')} onChange={(e) => onAnswer(e.target.value)} placeholder={question.settings?.placeholder || 'اكتب إجابتك...'} dir="rtl" />
            )}
            {question.type === 'long_text' && (
                <Textarea value={String(answer ?? '')} onChange={(e) => onAnswer(e.target.value)} placeholder={question.settings?.placeholder || 'اكتب إجابتك...'} rows={4} dir="rtl" />
            )}
            {question.type === 'email' && (
                <Input type="email" value={String(answer ?? '')} onChange={(e) => onAnswer(e.target.value)} placeholder="example@email.com" />
            )}
            {question.type === 'number' && (
                <Input type="number" value={String(answer ?? '')} onChange={(e) => onAnswer(e.target.value)} placeholder={question.settings?.placeholder || '0'} min={question.settings?.minValue} max={question.settings?.maxValue} />
            )}
            {question.type === 'date' && (
                <Input type="date" value={String(answer ?? '')} onChange={(e) => onAnswer(e.target.value)} min={question.settings?.minDate} max={question.settings?.maxDate} />
            )}
            {question.type === 'multiple_choice' && (
                <div className="space-y-2">
                    {opts.map((opt) => (
                        <label key={opt} className={cn('flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all', answer === opt ? 'border-primary bg-primary/5' : 'border-gray-200 hover:border-gray-300')}>
                            <div className={cn('w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center', answer === opt ? 'border-primary' : 'border-gray-300')}>
                                {answer === opt && <div className="w-2 h-2 rounded-full bg-primary" />}
                            </div>
                            <input type="radio" className="sr-only" checked={answer === opt} onChange={() => onAnswer(opt)} />
                            <span className="text-sm" dir="rtl">{opt}</span>
                        </label>
                    ))}
                </div>
            )}
            {question.type === 'checkbox' && (
                <div className="space-y-2">
                    {opts.map((opt) => {
                        const selected = Array.isArray(answer) && (answer as string[]).includes(opt);
                        const toggle = () => {
                            const current = Array.isArray(answer) ? (answer as string[]) : [];
                            onAnswer(selected ? current.filter((v) => v !== opt) : [...current, opt]);
                        };
                        return (
                            <label key={opt} className={cn('flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all', selected ? 'border-primary bg-primary/5' : 'border-gray-200 hover:border-gray-300')}>
                                <div className={cn('w-4 h-4 rounded border-2 flex-shrink-0 flex items-center justify-center', selected ? 'border-primary bg-primary' : 'border-gray-300')}>
                                    {selected && <span className="text-white text-[10px] font-bold">✓</span>}
                                </div>
                                <input type="checkbox" className="sr-only" checked={selected} onChange={toggle} />
                                <span className="text-sm" dir="rtl">{opt}</span>
                            </label>
                        );
                    })}
                </div>
            )}
            {question.type === 'dropdown' && (
                <select
                    value={String(answer ?? '')}
                    onChange={(e) => onAnswer(e.target.value)}
                    className="w-full border-2 border-gray-200 rounded-xl p-2.5 text-sm focus:border-primary outline-none"
                    dir="rtl"
                >
                    <option value="">اختر...</option>
                    {opts.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
                </select>
            )}
            {question.type === 'rating' && (
                <div className="flex justify-center gap-2">
                    {Array.from({ length: maxRating }).map((_, i) => {
                        const filled = (hoverRating !== null ? hoverRating : Number(answer ?? 0)) > i;
                        return (
                            <Star
                                key={i}
                                className={cn('w-9 h-9 cursor-pointer transition-all', filled ? 'fill-amber-400 text-amber-400 scale-110' : 'text-gray-300 hover:scale-110')}
                                onMouseEnter={() => setHoverRating(i + 1)}
                                onMouseLeave={() => setHoverRating(null)}
                                onClick={() => onAnswer(i + 1)}
                            />
                        );
                    })}
                </div>
            )}
            {question.type === 'scale' && (
                <div className="space-y-2">
                    <div className="flex gap-1 flex-wrap justify-center">
                        {Array.from({ length: maxScale - minScale + 1 }).map((_, i) => {
                            const val = minScale + i;
                            const selected = answer === val;
                            return (
                                <button
                                    key={val}
                                    onClick={() => onAnswer(val)}
                                    className={cn('w-10 h-10 rounded-xl border-2 text-sm font-bold transition-all', selected ? 'border-primary bg-primary text-white' : 'border-gray-200 text-gray-600 hover:border-primary')}
                                >
                                    {val}
                                </button>
                            );
                        })}
                    </div>
                    <div className="flex justify-between text-xs text-gray-400">
                        <span>{question.settings?.minLabel}</span>
                        <span>{question.settings?.maxLabel}</span>
                    </div>
                </div>
            )}
        </div>
    );
}

interface SurveyPreviewProps {
    onClose: () => void;
}

export function SurveyPreview({ onClose }: SurveyPreviewProps) {
    const { survey } = useSurveyStore();
    const [isMobile, setIsMobile] = useState(false);
    const [answers, setAnswers] = useState<Record<string, unknown>>({});
    const themeColor = survey?.settings.themeColor ?? '#3B82F6';
    const questions = (survey?.questions ?? []).filter((q) => isQuestionVisible(q, answers));

    if (!survey) return null;

    return (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                onClick={(e) => e.stopPropagation()}
                className={cn('bg-gray-100 rounded-2xl shadow-2xl flex flex-col overflow-hidden transition-all duration-300', isMobile ? 'w-[390px] h-[780px]' : 'w-full max-w-2xl h-[85vh]')}
            >
                {/* Preview toolbar */}
                <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200">
                    <div className="flex items-center gap-2">
                        <Button variant={!isMobile ? 'default' : 'ghost'} size="sm" className="h-7 text-xs" onClick={() => setIsMobile(false)}>
                            <Monitor className="w-3.5 h-3.5 ml-1" /> سطح المكتب
                        </Button>
                        <Button variant={isMobile ? 'default' : 'ghost'} size="sm" className="h-7 text-xs" onClick={() => setIsMobile(true)}>
                            <Phone className="w-3.5 h-3.5 ml-1" /> جوال
                        </Button>
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
                        <X className="w-4 h-4" />
                    </Button>
                </div>

                {/* Survey content */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {/* Header */}
                    <div className="rounded-2xl p-6 text-white" style={{ background: `linear-gradient(135deg, ${themeColor}dd, ${themeColor}99)` }}>
                        <h1 className="text-xl font-bold mb-1" dir="rtl">{survey.title || 'استبيان بدون عنوان'}</h1>
                        {survey.description && <p className="text-sm opacity-90" dir="rtl">{survey.description}</p>}
                    </div>

                    {/* Questions */}
                    {questions.map((q, idx) => (
                        <div key={q.id} className="bg-white rounded-2xl p-5 shadow-sm">
                            <div className="flex items-start gap-2 mb-3">
                                <span className="text-sm font-bold text-gray-400 mt-0.5">{idx + 1}.</span>
                                <div>
                                    <p className="text-sm font-semibold text-gray-800" dir="rtl">
                                        {q.title || 'سؤال بدون عنوان'}
                                        {q.required && <span className="text-red-500 mr-1">*</span>}
                                    </p>
                                    {q.description && <p className="text-xs text-gray-500 mt-0.5" dir="rtl">{q.description}</p>}
                                </div>
                            </div>
                            <PreviewQuestion
                                question={q}
                                answer={answers[q.id]}
                                onAnswer={(v) => setAnswers((prev) => ({ ...prev, [q.id]: v }))}
                            />
                        </div>
                    ))}

                    {/* Submit */}
                    <button
                        className="w-full py-3 rounded-xl text-white font-bold text-sm shadow-lg transition-transform hover:scale-[1.02]"
                        style={{ backgroundColor: themeColor }}
                    >
                        إرسال الإجابات
                    </button>
                </div>
            </motion.div>
        </div>
    );
}
