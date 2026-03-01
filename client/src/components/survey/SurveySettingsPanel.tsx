import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useSurveyStore } from '@/lib/survey-store';
import { THEME_COLORS } from '@/lib/survey-types';
import { cn } from '@/lib/utils';

export function SurveySettingsPanel() {
    const { survey, updateSurveyMeta } = useSurveyStore();
    if (!survey) return null;

    const settings = survey.settings;

    const updateSettings = (patch: Partial<typeof settings>) => {
        updateSurveyMeta({ settings: { ...settings, ...patch } });
    };

    return (
        <div className="flex flex-col h-full bg-gray-50/80 border-r border-gray-200">
            <div className="p-4 border-b border-gray-200 bg-white">
                <h3 className="font-bold text-gray-800 text-sm">إعدادات الاستبيان</h3>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-5">

                {/* Title & Description */}
                <Section title="المحتوى">
                    <div className="space-y-1.5">
                        <Label className="text-xs text-gray-600">عنوان الاستبيان</Label>
                        <Input
                            value={survey.title}
                            onChange={(e) => updateSurveyMeta({ title: e.target.value })}
                            placeholder="عنوان الاستبيان"
                            className="text-sm"
                            dir="rtl"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <Label className="text-xs text-gray-600">الوصف</Label>
                        <Textarea
                            value={survey.description ?? ''}
                            onChange={(e) => updateSurveyMeta({ description: e.target.value })}
                            placeholder="وصف مختصر للاستبيان..."
                            rows={3}
                            className="text-sm resize-none"
                            dir="rtl"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <Label className="text-xs text-gray-600">رسالة الشكر</Label>
                        <Textarea
                            value={settings.thankYouMessage ?? ''}
                            onChange={(e) => updateSettings({ thankYouMessage: e.target.value })}
                            placeholder="شكراً لك على ملء الاستبيان!"
                            rows={2}
                            className="text-sm resize-none"
                            dir="rtl"
                        />
                    </div>
                </Section>

                {/* Theme Color */}
                <Section title="اللون الرئيسي">
                    <div className="flex items-center gap-2 flex-wrap">
                        {THEME_COLORS.map((c) => (
                            <button
                                key={c.value}
                                onClick={() => updateSettings({ themeColor: c.value })}
                                title={c.name}
                                className={cn(
                                    'w-8 h-8 rounded-full transition-all',
                                    c.bg,
                                    settings.themeColor === c.value
                                        ? 'ring-2 ring-offset-2 ring-gray-800 scale-110'
                                        : 'hover:scale-110'
                                )}
                            />
                        ))}
                    </div>
                </Section>

                {/* Behavior */}
                <Section title="الإعدادات">
                    <ToggleRow
                        label="شريط التقدم"
                        description="إظهار نسبة الإكمال أثناء الإجابة"
                        checked={settings.showProgressBar ?? true}
                        onChange={(v) => updateSettings({ showProgressBar: v })}
                    />
                    <ToggleRow
                        label="سؤال واحد في الصفحة"
                        description="عرض الأسئلة واحداً تلو الآخر"
                        checked={settings.oneQuestionPerPage ?? false}
                        onChange={(v) => updateSettings({ oneQuestionPerPage: v })}
                    />
                    <ToggleRow
                        label="جمع البريد الإلكتروني"
                        description="طلب بريد إلكتروني من المستجيب"
                        checked={settings.collectEmail ?? false}
                        onChange={(v) => updateSettings({ collectEmail: v })}
                    />
                    <ToggleRow
                        label="السماح بإجابات متعددة"
                        description="نفس المستخدم يستطيع الإجابة مرات عدة"
                        checked={settings.allowMultipleResponses ?? true}
                        onChange={(v) => updateSettings({ allowMultipleResponses: v })}
                    />
                </Section>
            </div>
        </div>
    );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div className="space-y-3">
            <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">{title}</p>
            <div className="space-y-3 bg-white rounded-xl p-3 border border-gray-200">
                {children}
            </div>
        </div>
    );
}

function ToggleRow({ label, description, checked, onChange }: {
    label: string; description: string; checked: boolean; onChange: (v: boolean) => void;
}) {
    return (
        <div className="flex items-start gap-3">
            <Switch checked={checked} onCheckedChange={onChange} className="mt-0.5 flex-shrink-0" />
            <div>
                <p className="text-xs font-semibold text-gray-700">{label}</p>
                <p className="text-[11px] text-gray-500">{description}</p>
            </div>
        </div>
    );
}
