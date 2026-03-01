import { Plus, X, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useSurveyStore } from '@/lib/survey-store';
import type { BuilderQuestion } from '@/lib/survey-types';
import { DndContext, closestCenter } from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { cn } from '@/lib/utils';

function SortableOption({
    id, value, index, onUpdate, onRemove, canRemove
}: { id: string; value: string; index: number; onUpdate: (v: string) => void; onRemove: () => void; canRemove: boolean }) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
    const style = { transform: CSS.Transform.toString(transform), transition };

    return (
        <div ref={setNodeRef} style={style} className={cn('flex items-center gap-2', isDragging && 'opacity-50')}>
            <div {...attributes} {...listeners} className="cursor-grab text-gray-300 hover:text-gray-400">
                <GripVertical className="w-4 h-4" />
            </div>
            <span className="text-xs text-gray-400 w-5 flex-shrink-0">{index + 1}.</span>
            <Input
                value={value}
                onChange={(e) => onUpdate(e.target.value)}
                className="flex-1 h-8 text-sm"
                placeholder={`خيار ${index + 1}`}
                dir="rtl"
            />
            {canRemove && (
                <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-400 hover:text-red-500 flex-shrink-0" onClick={onRemove}>
                    <X className="w-3.5 h-3.5" />
                </Button>
            )}
        </div>
    );
}

export function ChoiceEditor({ question }: { question: BuilderQuestion }) {
    const { updateQuestion } = useSurveyStore();
    const options = question.options ?? ['خيار 1', 'خيار 2'];

    const addOption = () => {
        updateQuestion(question.id, { options: [...options, `خيار ${options.length + 1}`] });
    };

    const removeOption = (idx: number) => {
        updateQuestion(question.id, { options: options.filter((_, i) => i !== idx) });
    };

    const updateOption = (idx: number, value: string) => {
        const next = options.map((o, i) => (i === idx ? value : o));
        updateQuestion(question.id, { options: next });
    };

    const handleDragEnd = ({ active, over }: any) => {
        if (over && active.id !== over.id) {
            const oldIndex = options.findIndex((_, i) => String(i) === active.id);
            const newIndex = options.findIndex((_, i) => String(i) === over.id);
            updateQuestion(question.id, { options: arrayMove(options, oldIndex, newIndex) });
        }
    };

    return (
        <div className="space-y-2">
            <p className="text-xs font-semibold text-gray-600">الخيارات</p>
            <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={options.map((_, i) => String(i))} strategy={verticalListSortingStrategy}>
                    <div className="space-y-2">
                        {options.map((opt, idx) => (
                            <SortableOption
                                key={idx}
                                id={String(idx)}
                                value={opt}
                                index={idx}
                                onUpdate={(v) => updateOption(idx, v)}
                                onRemove={() => removeOption(idx)}
                                canRemove={options.length > 2}
                            />
                        ))}
                    </div>
                </SortableContext>
            </DndContext>
            <Button variant="outline" size="sm" className="w-full h-8 text-xs border-dashed" onClick={addOption}>
                <Plus className="w-3.5 h-3.5 ml-1" />
                إضافة خيار
            </Button>
        </div>
    );
}
