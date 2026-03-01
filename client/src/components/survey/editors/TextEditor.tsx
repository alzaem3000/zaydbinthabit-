import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useSurveyStore } from '@/lib/survey-store';
import type { BuilderQuestion } from '@/lib/survey-types';

export function TextEditor({ question }: { question: BuilderQuestion }) {
    const { updateQuestion } = useSurveyStore();
    const placeholder = question.settings?.placeholder ?? '';

    return (
        <div className="space-y-2">
            <Label className="text-xs font-semibold text-gray-600">نص التلميح (placeholder)</Label>
            <Input
                value={placeholder}
                onChange={(e) =>
                    updateQuestion(question.id, { settings: { ...question.settings, placeholder: e.target.value } })
                }
                placeholder="أدخل نص التلميح..."
                className="h-8 text-sm"
                dir="rtl"
            />
            <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                <p className="text-xs font-semibold text-gray-500 mb-1">معاينة</p>
                {question.type === 'long_text' ? (
                    <textarea
                        readOnly value="" placeholder={placeholder || 'اكتب إجابتك هنا...'}
                        className="w-full text-sm border border-gray-200 rounded-lg p-2 resize-none h-16 bg-white text-gray-400"
                        dir="rtl"
                    />
                ) : (
                    <input
                        readOnly value="" placeholder={placeholder || 'اكتب إجابتك هنا...'}
                        className="w-full text-sm border border-gray-200 rounded-lg px-3 h-8 bg-white text-gray-400"
                        dir="rtl"
                    />
                )}
            </div>
        </div>
    );
}
