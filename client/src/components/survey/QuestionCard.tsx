import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    GripVertical, Trash2, Copy, ChevronDown, ChevronUp, AlertCircle,
    Type, AlignLeft, Mail, Hash, CircleDot, CheckSquare, Star, Sliders, Calendar,
} from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useSurveyStore } from '@/lib/survey-store';
import type { BuilderQuestion, QuestionType } from '@/lib/survey-types';
import { cn } from '@/lib/utils';

// Sub-editors
import { ChoiceEditor } from './editors/ChoiceEditor';
import { RatingEditor } from './editors/RatingEditor';
import { ScaleEditor } from './editors/ScaleEditor';
import { TextEditor } from './editors/TextEditor';
import { DateEditor } from './editors/DateEditor';
import { NumberEditor } from './editors/NumberEditor';
import { ConditionalLogicEditor } from './editors/ConditionalLogicEditor';

const TYPE_ICONS: Record<QuestionType, React.ElementType> = {
    short_text: Type, long_text: AlignLeft, email: Mail, number: Hash,
    multiple_choice: CircleDot, checkbox: CheckSquare, dropdown: ChevronDown,
    rating: Star, scale: Sliders, date: Calendar,
};

const TYPE_LABELS: Record<QuestionType, string> = {
    short_text: 'نص قصير', long_text: 'نص طويل', email: 'بريد إلكتروني', number: 'رقم',
    multiple_choice: 'اختيار من متعدد', checkbox: 'مربعات اختيار', dropdown: 'قائمة منسدلة',
    rating: 'تقييم', scale: 'مقياس', date: 'تاريخ',
};

const TYPE_COLORS: Record<QuestionType, string> = {
    short_text: 'bg-blue-500', long_text: 'bg-blue-400', email: 'bg-indigo-500',
    number: 'bg-violet-500', multiple_choice: 'bg-emerald-500', checkbox: 'bg-teal-500',
    dropdown: 'bg-cyan-500', rating: 'bg-amber-500', scale: 'bg-orange-500', date: 'bg-rose-500',
};

function QuestionSubEditor({ question }: { question: BuilderQuestion }) {
    const type = question.type;
    if (['multiple_choice', 'checkbox', 'dropdown'].includes(type)) {
        return <ChoiceEditor question={question} />;
    }
    if (type === 'rating') return <RatingEditor question={question} />;
    if (type === 'scale') return <ScaleEditor question={question} />;
    if (type === 'date') return <DateEditor question={question} />;
    if (type === 'number') return <NumberEditor question={question} />;
    return <TextEditor question={question} />;
}

interface QuestionCardProps {
    question: BuilderQuestion;
    index: number;
}

export function QuestionCard({ question, index }: QuestionCardProps) {
    const [showLogic, setShowLogic] = useState(false);
    const { activeQuestionId, setActiveQuestion, updateQuestion, removeQuestion, duplicateQuestion } = useSurveyStore();
    const isActive = activeQuestionId === question.id;

    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: question.id,
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    const Icon = TYPE_ICONS[question.type] || Type;
    const hasLogic = (question.conditionalLogic?.length ?? 0) > 0;

    return (
        <motion.div
            ref={setNodeRef}
            style={style}
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: isDragging ? 0.5 : 1, y: 0 }}
            exit={{ opacity: 0, x: -30, height: 0 }}
            className={cn(
                'group rounded-2xl border-2 bg-white transition-all duration-200 overflow-hidden',
                isActive ? 'border-primary shadow-lg shadow-primary/10' : 'border-gray-200 hover:border-gray-300 shadow-sm',
                isDragging && 'shadow-2xl scale-105 border-primary'
            )}
        >
            {/* Card Header */}
            <div
                className="flex items-center gap-3 p-4 cursor-pointer"
                onClick={() => setActiveQuestion(isActive ? null : question.id)}
            >
                {/* Drag handle */}
                <div
                    {...attributes}
                    {...listeners}
                    className="cursor-grab active:cursor-grabbing text-gray-300 hover:text-gray-500 flex-shrink-0 touch-none"
                    onClick={(e) => e.stopPropagation()}
                >
                    <GripVertical className="w-5 h-5" />
                </div>

                {/* Question number */}
                <span className="text-xs font-bold text-gray-400 w-5 flex-shrink-0">{index + 1}</span>

                {/* Type icon */}
                <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0', TYPE_COLORS[question.type])}>
                    <Icon className="w-3.5 h-3.5 text-white" />
                </div>

                {/* Title */}
                <div className="flex-1 min-w-0">
                    <p className={cn('text-sm font-medium truncate', question.title ? 'text-gray-800' : 'text-gray-400 italic')}>
                        {question.title || 'سؤال بدون عنوان'}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-gray-400">{TYPE_LABELS[question.type]}</span>
                        {question.required && <Badge variant="destructive" className="text-[10px] h-4 px-1">مطلوب</Badge>}
                        {hasLogic && <Badge variant="outline" className="text-[10px] h-4 px-1 border-amber-400 text-amber-600">منطق شرطي</Badge>}
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => duplicateQuestion(question.id)}>
                        <Copy className="w-3.5 h-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => removeQuestion(question.id)}>
                        <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                </div>

                {/* Expand arrow */}
                <div className="text-gray-400">
                    {isActive ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </div>
            </div>

            {/* Expanded Editor */}
            <AnimatePresence>
                {isActive && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: 'easeInOut' }}
                        className="overflow-hidden border-t border-gray-100"
                    >
                        <div className="p-4 space-y-4">
                            {/* Question Title */}
                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold text-gray-600">عنوان السؤال</Label>
                                <Input
                                    value={question.title}
                                    onChange={(e) => updateQuestion(question.id, { title: e.target.value })}
                                    placeholder="اكتب سؤالك هنا..."
                                    className="text-sm"
                                    dir="rtl"
                                />
                            </div>

                            {/* Description */}
                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold text-gray-600">وصف (اختياري)</Label>
                                <Textarea
                                    value={question.description || ''}
                                    onChange={(e) => updateQuestion(question.id, { description: e.target.value })}
                                    placeholder="أضف تعليمات أو توضيح إضافي..."
                                    rows={2}
                                    className="text-sm resize-none"
                                    dir="rtl"
                                />
                            </div>

                            {/* Type-specific editor */}
                            <QuestionSubEditor question={question} />

                            {/* Footer Options */}
                            <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                                <div className="flex items-center gap-2">
                                    <Switch
                                        id={`required-${question.id}`}
                                        checked={question.required}
                                        onCheckedChange={(v) => updateQuestion(question.id, { required: v })}
                                    />
                                    <Label htmlFor={`required-${question.id}`} className="text-xs text-gray-600 cursor-pointer">
                                        مطلوب
                                    </Label>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className={cn('text-xs h-7', hasLogic ? 'text-amber-600 bg-amber-50' : 'text-gray-500')}
                                    onClick={() => setShowLogic(!showLogic)}
                                >
                                    <AlertCircle className="w-3.5 h-3.5 mr-1" />
                                    المنطق الشرطي
                                </Button>
                            </div>

                            {/* Conditional Logic */}
                            <AnimatePresence>
                                {showLogic && (
                                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                        <ConditionalLogicEditor question={question} />
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
