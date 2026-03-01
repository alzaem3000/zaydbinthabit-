import { useDraggable } from '@dnd-kit/core';
import { motion } from 'framer-motion';
import {
    Type, AlignLeft, Mail, Hash, CircleDot, CheckSquare,
    ChevronDown, Star, Sliders, Calendar,
} from 'lucide-react';
import { QUESTION_TYPES, type QuestionTypeMeta } from '@/lib/survey-types';
import { cn } from '@/lib/utils';

const ICON_MAP: Record<string, React.ElementType> = {
    Type, AlignLeft, Mail, Hash, CircleDot, CheckSquare,
    ChevronDown, Star, Sliders, Calendar,
};

function DraggableTile({ meta }: { meta: QuestionTypeMeta }) {
    const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
        id: `palette-${meta.type}`,
        data: { type: meta.type, fromPalette: true },
    });

    const Icon = ICON_MAP[meta.icon] || Type;

    return (
        <motion.div
            ref={setNodeRef}
            {...listeners}
            {...attributes}
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.97 }}
            className={cn(
                'flex items-center gap-3 p-3 rounded-xl border-2 border-transparent',
                'bg-white cursor-grab active:cursor-grabbing select-none',
                'shadow-sm hover:shadow-md hover:border-primary/20 transition-all duration-200',
                isDragging && 'opacity-50 shadow-lg ring-2 ring-primary'
            )}
        >
            <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0', meta.color)}>
                <Icon className="w-4 h-4 text-white" />
            </div>
            <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-800 leading-none mb-0.5">{meta.label}</p>
                <p className="text-xs text-gray-500 truncate">{meta.description}</p>
            </div>
        </motion.div>
    );
}

const CATEGORIES = [
    { id: 'text', label: 'نصية' },
    { id: 'choice', label: 'اختيارية' },
    { id: 'scale', label: 'تقييم' },
    { id: 'other', label: 'أخرى' },
] as const;

export function QuestionBank() {
    return (
        <div className="flex flex-col h-full bg-gray-50/80 border-l border-gray-200">
            <div className="p-4 border-b border-gray-200 bg-white">
                <h3 className="font-bold text-gray-800 text-sm">أنواع الأسئلة</h3>
                <p className="text-xs text-gray-500 mt-0.5">اسحب وأفلت لإضافة سؤال</p>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-4">
                {CATEGORIES.map((cat) => {
                    const items = QUESTION_TYPES.filter((q) => q.category === cat.id);
                    return (
                        <div key={cat.id}>
                            <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-2 px-1">
                                {cat.label}
                            </p>
                            <div className="space-y-2">
                                {items.map((meta) => (
                                    <DraggableTile key={meta.type} meta={meta} />
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
