import { useParams, useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { ArrowRight, Users, TrendingUp, BarChart2, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import type { BuilderSurvey } from '@/lib/survey-types';

interface Analytics {
    totalResponses: number;
    completionRate: number;
    questionBreakdown: Record<string, {
        type: string;
        title: string;
        answers: unknown[];
        counts?: Record<string, number>;
    }>;
}

const COLORS = ['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EC4899', '#06B6D4', '#EF4444', '#84CC16'];

export default function SurveyAnalyticsPage() {
    const params = useParams<{ id: string }>();
    const [, navigate] = useLocation();

    const { data: survey } = useQuery<BuilderSurvey>({
        queryKey: ['/api/surveys', params.id],
        queryFn: async () => {
            const res = await fetch(`/api/surveys/${params.id}`);
            if (!res.ok) throw new Error('Not found');
            return res.json();
        },
    });

    const { data: analytics, isLoading } = useQuery<Analytics>({
        queryKey: ['/api/surveys', params.id, 'analytics'],
        queryFn: async () => {
            const res = await fetch(`/api/surveys/${params.id}/analytics`);
            if (!res.ok) throw new Error('Not found');
            return res.json();
        },
    });

    const themeColor = survey?.settings?.themeColor ?? '#3B82F6';

    return (
        <div className="min-h-screen bg-gray-50" dir="rtl">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
                <div className="max-w-5xl mx-auto px-6 py-4 flex items-center gap-3">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate('/surveys')}>
                        <ArrowRight className="w-4 h-4" />
                    </Button>
                    <div>
                        <h1 className="font-bold text-gray-800">{survey?.title || 'تحليل الاستبيان'}</h1>
                        <p className="text-xs text-gray-500">استعراض الاستجابات والنتائج</p>
                    </div>
                </div>
            </div>

            <div className="max-w-5xl mx-auto px-6 py-8 space-y-6">
                {isLoading ? (
                    <div className="flex justify-center py-20">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    </div>
                ) : !analytics ? null : (
                    <>
                        {/* Summary Stats */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                            {[
                                { label: 'إجمالي الاستجابات', value: analytics.totalResponses, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
                                { label: 'معدل الاكتمال', value: `${analytics.completionRate}%`, icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-50' },
                                { label: 'عدد الأسئلة', value: Object.keys(analytics.questionBreakdown).length, icon: BarChart2, color: 'text-purple-600', bg: 'bg-purple-50' },
                            ].map((stat) => (
                                <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                                    <Card className="border-0 shadow-sm">
                                        <CardContent className="p-5">
                                            <div className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center mb-3`}>
                                                <stat.icon className={`w-5 h-5 ${stat.color}`} />
                                            </div>
                                            <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                                            <p className="text-xs text-gray-500 mt-0.5">{stat.label}</p>
                                        </CardContent>
                                    </Card>
                                </motion.div>
                            ))}
                        </div>

                        {/* No responses */}
                        {analytics.totalResponses === 0 && (
                            <div className="bg-white rounded-2xl p-12 text-center shadow-sm">
                                <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                <p className="text-gray-500">لا توجد استجابات بعد</p>
                                <p className="text-xs text-gray-400 mt-1">شارك رابط الاستبيان لبدء تلقي الإجابات</p>
                            </div>
                        )}

                        {/* Per-question breakdown */}
                        {Object.entries(analytics.questionBreakdown).map(([qId, qData], idx) => {
                            const hasChart = qData.counts && Object.keys(qData.counts).length > 0;
                            const chartData = hasChart
                                ? Object.entries(qData.counts!).map(([name, count]) => ({ name, count }))
                                : [];
                            const textAnswers = !hasChart ? qData.answers as string[] : [];

                            return (
                                <motion.div key={qId} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}>
                                    <Card className="border-0 shadow-sm overflow-hidden">
                                        <div className="h-1" style={{ backgroundColor: themeColor }} />
                                        <CardHeader className="pb-2">
                                            <div className="flex items-start gap-2">
                                                <span className="text-sm font-bold text-gray-400 mt-0.5">{idx + 1}.</span>
                                                <div>
                                                    <CardTitle className="text-sm font-semibold text-gray-800">{qData.title}</CardTitle>
                                                    <p className="text-xs text-gray-400 mt-0.5">{qData.answers.length} إجابة</p>
                                                </div>
                                            </div>
                                        </CardHeader>
                                        <CardContent>
                                            {hasChart ? (
                                                <ResponsiveContainer width="100%" height={200}>
                                                    <BarChart data={chartData} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                                                        <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                                                        <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                                                        <Tooltip />
                                                        <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                                                            {chartData.map((_, i) => (
                                                                <Cell key={i} fill={COLORS[i % COLORS.length]} />
                                                            ))}
                                                        </Bar>
                                                    </BarChart>
                                                </ResponsiveContainer>
                                            ) : textAnswers.length > 0 ? (
                                                <div className="space-y-2 max-h-48 overflow-y-auto">
                                                    {textAnswers.map((ans, i) => (
                                                        <div key={i} className="text-sm text-gray-700 bg-gray-50 rounded-lg px-3 py-2" dir="rtl">
                                                            {String(ans)}
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <p className="text-sm text-gray-400 text-center py-4">لا توجد إجابات على هذا السؤال</p>
                                            )}
                                        </CardContent>
                                    </Card>
                                </motion.div>
                            );
                        })}
                    </>
                )}
            </div>
        </div>
    );
}
