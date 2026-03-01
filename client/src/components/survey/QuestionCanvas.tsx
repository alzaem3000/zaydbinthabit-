import { useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
    DndContext, DragOverlay, closestCenter, PointerSensor, useSensor, useSensors, type DragEndEvent, type DragStartEvent,
} from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { useSurveyStore } from '@/lib/survey-store';
import { QuestionCard } from './QuestionCard';
import { ClipboardList, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import type { BuilderQuestion, QuestionType } from '@/lib/survey-types';

export function QuestionCanvas() {
    const { survey, addQuestion, reorderQuestions } = useSurveyStore();
    const [draggedId, setDraggedId] = useState<string | null>(null);
    const questions = survey?.questions ?? [];

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
    );

    const handleDragStart = (event: DragStartEvent) => {
        const id = String(event.active.id);
        // Only track canvas reorder drags (not palette drags)
        if (!id.startsWith('palette-')) {
            setDraggedId(id);
        }
    };

    const handleDragEnd = (event: DragEndEvent) => {
        setDraggedId(null);
        const { active, over } = event;
        if (!over) return;

        // Palette drop — add new question
        const activeId = String(active.id);
        if (activeId.startsWith('palette-')) {
            const type = active.data.current?.type as QuestionType;
            if (type) addQuestion(type);
            return;
        }

        // Canvas reorder
        if (activeId !== String(over.id)) {
            const oldIdx = questions.findIndex((q) => q.id === activeId);
            const newIdx = questions.findIndex((q) => q.id === String(over.id));
            if (oldIdx !== -1 && newIdx !== -1) {
                reorderQuestions(arrayMove(questions, oldIdx, newIdx));
            }
        }
    };

    const draggedQuestion = useMemo(
        () => questions.find((q) => q.id === draggedId),
        [draggedId, questions]
    );

    return (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
            <div className="flex-1 overflow-y-auto">
                <div className="max-w-2xl mx-auto py-6 px-4 space-y-3">
                    {questions.length === 0 ? (
                        <EmptyCanvas onAdd={() => addQuestion('short_text')} />
                    ) : (
                        <SortableContext items={questions.map((q) => q.id)} strategy={verticalListSortingStrategy}>
                            <AnimatePresence mode="popLayout">
                                {questions.map((q, idx) => (
                                    <QuestionCard key={q.id} question={q} index={idx} />
                                ))}
                            </AnimatePresence>
                        </SortableContext>
                    )}

                    {/* Drop Zone at bottom */}
                    {questions.length > 0 && (
                        <div className="flex justify-center pt-2">
                            <Button
                                variant="outline"
                                size="sm"
                                className="text-xs border-dashed h-9 px-6 text-gray-500 hover:border-primary/50 hover:text-primary"
                                onClick={() => addQuestion('short_text')}
                            >
                                <Plus className="w-3.5 h-3.5 ml-1" />
                                إضافة سؤال جديد
                            </Button>
                        </div>
                    )}
                </div>
            </div>

            <DragOverlay>
                {draggedQuestion && (
                    <div className="bg-white rounded-xl border-2 border-primary shadow-2xl p-4 opacity-90 max-w-md">
                        <p className="text-sm font-medium text-gray-800 truncate">{draggedQuestion.title || 'سؤال بدون عنوان'}</p>
                    </div>
                )}
            </DragOverlay>
        </DndContext>
    );
}

function EmptyCanvas({ onAdd }: { onAdd: () => void }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-24 text-center"
        >
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center mb-4">
                <ClipboardList className="w-10 h-10 text-primary/50" />
            </div>
            <h3 className="text-lg font-bold text-gray-700 mb-1">ابدأ في بناء استبيانك</h3>
            <p className="text-sm text-gray-500 mb-6 max-w-xs">
                اسحب أنواع الأسئلة من القائمة اليسرى أو انقر على الزر أدناه
            </p>
            <Button onClick={onAdd} className="shadow-lg shadow-primary/25">
                <Plus className="w-4 h-4 ml-2" />
                إضافة أول سؤال
            </Button>
        </motion.div>
    );
}
