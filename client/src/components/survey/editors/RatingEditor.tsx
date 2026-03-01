import { Star } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { useSurveyStore } from '@/lib/survey-store';
import type { BuilderQuestion } from '@/lib/survey-types';
import { cn } from '@/lib/utils';

export function RatingEditor({ question }: { question: BuilderQuestion }) {
    const { updateQuestion } = useSurveyStore();
    const maxRating = question.settings?.maxRating ?? 5;

    return (
        <div className="space-y-4">
            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <Label className="text-xs font-semibold text-gray-600">عدد النجوم</Label>
                    <span className="text-sm font-bold text-primary">{maxRating}</span>
                </div>
                <Slider
                    min={3}
                    max={10}
                    step={1}
                    value={[maxRating]}
                    onValueChange={([v]) => updateQuestion(question.id, { settings: { ...question.settings, maxRating: v } })}
                    className="w-full"
                />
            </div>

            {/* Preview */}
            <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-xs text-gray-500 mb-2 text-center">معاينة</p>
                <div className="flex justify-center gap-1">
                    {Array.from({ length: maxRating }).map((_, i) => (
                        <Star
                            key={i}
                            className={cn('w-7 h-7 transition-colors', i < 3 ? 'fill-amber-400 text-amber-400' : 'text-gray-300')}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}
