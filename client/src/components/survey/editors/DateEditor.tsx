import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useSurveyStore } from '@/lib/survey-store';
import type { BuilderQuestion } from '@/lib/survey-types';

export function DateEditor({ question }: { question: BuilderQuestion }) {
    const { updateQuestion } = useSurveyStore();
    const settings = question.settings ?? {};

    const update = (patch: Partial<typeof settings>) =>
        updateQuestion(question.id, { settings: { ...settings, ...patch } });

    return (
        <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-gray-600">أقدم تاريخ مسموح</Label>
                    <Input type="date" value={settings.minDate ?? ''} onChange={(e) => update({ minDate: e.target.value })} className="h-8 text-sm" />
                </div>
                <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-gray-600">أحدث تاريخ مسموح</Label>
                    <Input type="date" value={settings.maxDate ?? ''} onChange={(e) => update({ maxDate: e.target.value })} className="h-8 text-sm" />
                </div>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-xs font-semibold text-gray-500 mb-1">معاينة</p>
                <Input type="date" readOnly className="h-8 text-sm bg-white" />
            </div>
        </div>
    );
}
