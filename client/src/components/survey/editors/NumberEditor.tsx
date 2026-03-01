import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useSurveyStore } from '@/lib/survey-store';
import type { BuilderQuestion } from '@/lib/survey-types';

export function NumberEditor({ question }: { question: BuilderQuestion }) {
    const { updateQuestion } = useSurveyStore();
    const settings = question.settings ?? {};

    const update = (patch: Partial<typeof settings>) =>
        updateQuestion(question.id, { settings: { ...settings, ...patch } });

    return (
        <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-gray-600">الحد الأدنى</Label>
                    <Input
                        type="number"
                        value={settings.minValue ?? ''}
                        onChange={(e) => update({ minValue: e.target.value ? Number(e.target.value) : undefined })}
                        placeholder="غير محدد"
                        className="h-8 text-sm"
                    />
                </div>
                <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-gray-600">الحد الأعلى</Label>
                    <Input
                        type="number"
                        value={settings.maxValue ?? ''}
                        onChange={(e) => update({ maxValue: e.target.value ? Number(e.target.value) : undefined })}
                        placeholder="غير محدد"
                        className="h-8 text-sm"
                    />
                </div>
            </div>
            <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-gray-600">نص التلميح</Label>
                <Input
                    value={settings.placeholder ?? ''}
                    onChange={(e) => update({ placeholder: e.target.value })}
                    placeholder="أدخل رقماً..."
                    className="h-8 text-sm"
                    dir="rtl"
                />
            </div>
        </div>
    );
}
