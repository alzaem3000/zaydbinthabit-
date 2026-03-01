import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { useSurveyStore } from '@/lib/survey-store';
import type { BuilderQuestion } from '@/lib/survey-types';
import { cn } from '@/lib/utils';

export function ScaleEditor({ question }: { question: BuilderQuestion }) {
    const { updateQuestion } = useSurveyStore();
    const settings = question.settings ?? {};
    const min = settings.minScale ?? 1;
    const max = settings.maxScale ?? 10;
    const minLabel = settings.minLabel ?? '';
    const maxLabel = settings.maxLabel ?? '';

    const update = (patch: Partial<typeof settings>) => {
        updateQuestion(question.id, { settings: { ...settings, ...patch } });
    };

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-gray-600">القيمة الدنيا</Label>
                    <Input
                        type="number" value={min} min={0} max={max - 1}
                        onChange={(e) => update({ minScale: Number(e.target.value) })}
                        className="h-8 text-sm"
                    />
                </div>
                <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-gray-600">القيمة العليا</Label>
                    <Input
                        type="number" value={max} min={min + 1} max={20}
                        onChange={(e) => update({ maxScale: Number(e.target.value) })}
                        className="h-8 text-sm"
                    />
                </div>
                <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-gray-600">تسمية الحد الأدنى</Label>
                    <Input value={minLabel} onChange={(e) => update({ minLabel: e.target.value })} placeholder="ضعيف" className="h-8 text-sm" dir="rtl" />
                </div>
                <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-gray-600">تسمية الحد الأعلى</Label>
                    <Input value={maxLabel} onChange={(e) => update({ maxLabel: e.target.value })} placeholder="ممتاز" className="h-8 text-sm" dir="rtl" />
                </div>
            </div>

            {/* Preview */}
            <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-xs text-gray-500 mb-3 text-center">معاينة</p>
                <div className="flex gap-1 justify-center flex-wrap">
                    {Array.from({ length: max - min + 1 }).map((_, i) => (
                        <button
                            key={i}
                            className={cn(
                                'w-9 h-9 rounded-lg text-xs font-bold border-2 transition-all',
                                i === 4 ? 'border-primary bg-primary text-white' : 'border-gray-200 text-gray-600 hover:border-primary'
                            )}
                        >
                            {min + i}
                        </button>
                    ))}
                </div>
                <div className="flex justify-between mt-2">
                    <span className="text-xs text-gray-400">{minLabel}</span>
                    <span className="text-xs text-gray-400">{maxLabel}</span>
                </div>
            </div>
        </div>
    );
}
