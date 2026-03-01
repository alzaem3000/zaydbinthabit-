import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { useSurveyStore } from '@/lib/survey-store';
import type { BuilderQuestion, ConditionalRule } from '@/lib/survey-types';

const OPERATORS = [
    { value: 'equals', label: 'يساوي' },
    { value: 'not_equals', label: 'لا يساوي' },
    { value: 'contains', label: 'يحتوي على' },
    { value: 'is_empty', label: 'فارغ' },
    { value: 'is_not_empty', label: 'ليس فارغاً' },
    { value: 'greater_than', label: 'أكبر من' },
    { value: 'less_than', label: 'أصغر من' },
];

const ACTIONS = [
    { value: 'show', label: 'إظهار هذا السؤال' },
    { value: 'hide', label: 'إخفاء هذا السؤال' },
];

export function ConditionalLogicEditor({ question }: { question: BuilderQuestion }) {
    const { survey, updateQuestion } = useSurveyStore();
    const rules = question.conditionalLogic ?? [];
    const otherQuestions = (survey?.questions ?? []).filter((q) => q.id !== question.id);

    const addRule = () => {
        const newRule: ConditionalRule = {
            questionId: otherQuestions[0]?.id ?? '',
            operator: 'equals',
            value: '',
            action: 'show',
        };
        updateQuestion(question.id, { conditionalLogic: [...rules, newRule] });
    };

    const updateRule = (idx: number, patch: Partial<ConditionalRule>) => {
        const updated = rules.map((r, i) => (i === idx ? { ...r, ...patch } : r));
        updateQuestion(question.id, { conditionalLogic: updated });
    };

    const removeRule = (idx: number) => {
        updateQuestion(question.id, { conditionalLogic: rules.filter((_, i) => i !== idx) });
    };

    const needsValue = (op: string) => !['is_empty', 'is_not_empty'].includes(op);

    return (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-3">
            <p className="text-xs font-bold text-amber-700">المنطق الشرطي</p>
            {otherQuestions.length === 0 ? (
                <p className="text-xs text-gray-500">أضف أسئلة أخرى أولاً لتطبيق المنطق الشرطي.</p>
            ) : (
                <>
                    {rules.map((rule, idx) => (
                        <div key={idx} className="bg-white rounded-lg p-3 space-y-2 border border-amber-100">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-semibold text-gray-600">قاعدة {idx + 1}</span>
                                <Button variant="ghost" size="icon" className="h-6 w-6 text-gray-400" onClick={() => removeRule(idx)}>
                                    <X className="w-3 h-3" />
                                </Button>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                {/* Action */}
                                <div className="col-span-2">
                                    <Select value={rule.action} onValueChange={(v) => updateRule(idx, { action: v as any })}>
                                        <SelectTrigger className="h-8 text-xs">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {ACTIONS.map((a) => <SelectItem key={a.value} value={a.value} className="text-xs">{a.label}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                {/* IF question */}
                                <div className="space-y-1">
                                    <Label className="text-[10px] text-gray-500">إذا كان السؤال</Label>
                                    <Select value={rule.questionId} onValueChange={(v) => updateRule(idx, { questionId: v })}>
                                        <SelectTrigger className="h-8 text-xs">
                                            <SelectValue placeholder="اختر سؤالاً" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {otherQuestions.map((q, qi) => (
                                                <SelectItem key={q.id} value={q.id} className="text-xs">
                                                    {qi + 1}. {q.title || 'سؤال بدون عنوان'}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                {/* Operator */}
                                <div className="space-y-1">
                                    <Label className="text-[10px] text-gray-500">الشرط</Label>
                                    <Select value={rule.operator} onValueChange={(v) => updateRule(idx, { operator: v as any })}>
                                        <SelectTrigger className="h-8 text-xs">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {OPERATORS.map((o) => <SelectItem key={o.value} value={o.value} className="text-xs">{o.label}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                {/* Value */}
                                {needsValue(rule.operator) && (
                                    <div className="col-span-2 space-y-1">
                                        <Label className="text-[10px] text-gray-500">القيمة</Label>
                                        <Input
                                            value={rule.value}
                                            onChange={(e) => updateRule(idx, { value: e.target.value })}
                                            placeholder="القيمة..."
                                            className="h-8 text-xs"
                                            dir="rtl"
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                    <Button variant="outline" size="sm" className="w-full h-8 text-xs border-dashed border-amber-300 text-amber-700 hover:bg-amber-50" onClick={addRule}>
                        <Plus className="w-3.5 h-3.5 ml-1" />
                        إضافة قاعدة
                    </Button>
                </>
            )}
        </div>
    );
}
