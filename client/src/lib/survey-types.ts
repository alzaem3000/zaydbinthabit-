// ============================================================
// SURVEY BUILDER — Client-Side Types
// ============================================================

export type QuestionType =
    | 'short_text'
    | 'long_text'
    | 'multiple_choice'
    | 'checkbox'
    | 'dropdown'
    | 'rating'
    | 'scale'
    | 'date'
    | 'email'
    | 'number';

export interface QuestionSettings {
    maxRating?: number;
    minScale?: number;
    maxScale?: number;
    scaleStep?: number;
    minLabel?: string;
    maxLabel?: string;
    placeholder?: string;
    minDate?: string;
    maxDate?: string;
    minValue?: number;
    maxValue?: number;
}

export interface ConditionalRule {
    questionId: string;
    operator: 'equals' | 'not_equals' | 'contains' | 'is_empty' | 'is_not_empty' | 'greater_than' | 'less_than';
    value: string;
    action: 'show' | 'hide';
}

export interface BuilderQuestion {
    id: string; // UUID for saved, temp-ID for unsaved
    type: QuestionType;
    title: string;
    description?: string;
    required: boolean;
    order: number;
    options?: string[]; // for MC, checkbox, dropdown
    settings?: QuestionSettings;
    conditionalLogic?: ConditionalRule[];
}

export interface SurveySettings {
    themeColor?: string;
    collectEmail?: boolean;
    allowMultipleResponses?: boolean;
    responseLimit?: number;
    thankYouMessage?: string;
    showProgressBar?: boolean;
    oneQuestionPerPage?: boolean;
}

export interface BuilderSurvey {
    id?: string;
    title: string;
    description?: string;
    status: 'draft' | 'published' | 'closed';
    settings: SurveySettings;
    shareToken?: string;
    questions: BuilderQuestion[];
    responseCount?: number;
}

// Question type metadata for the question bank palette
export interface QuestionTypeMeta {
    type: QuestionType;
    label: string;
    description: string;
    icon: string;
    category: 'text' | 'choice' | 'scale' | 'other';
    color: string;
}

export const QUESTION_TYPES: QuestionTypeMeta[] = [
    {
        type: 'short_text',
        label: 'نص قصير',
        description: 'استجابة نصية قصيرة',
        icon: 'Type',
        category: 'text',
        color: 'bg-blue-500',
    },
    {
        type: 'long_text',
        label: 'نص طويل',
        description: 'استجابة نصية مطوّلة',
        icon: 'AlignLeft',
        category: 'text',
        color: 'bg-blue-400',
    },
    {
        type: 'email',
        label: 'بريد إلكتروني',
        description: 'عنوان بريد إلكتروني',
        icon: 'Mail',
        category: 'text',
        color: 'bg-indigo-500',
    },
    {
        type: 'number',
        label: 'رقم',
        description: 'إدخال رقمي',
        icon: 'Hash',
        category: 'text',
        color: 'bg-violet-500',
    },
    {
        type: 'multiple_choice',
        label: 'اختيار من متعدد',
        description: 'اختيار واحد من عدة خيارات',
        icon: 'CircleDot',
        category: 'choice',
        color: 'bg-emerald-500',
    },
    {
        type: 'checkbox',
        label: 'مربعات اختيار',
        description: 'اختيار عدة خيارات',
        icon: 'CheckSquare',
        category: 'choice',
        color: 'bg-teal-500',
    },
    {
        type: 'dropdown',
        label: 'قائمة منسدلة',
        description: 'اختيار من قائمة',
        icon: 'ChevronDown',
        category: 'choice',
        color: 'bg-cyan-500',
    },
    {
        type: 'rating',
        label: 'تقييم بالنجوم',
        description: 'تقييم من 1 إلى 5 نجوم',
        icon: 'Star',
        category: 'scale',
        color: 'bg-amber-500',
    },
    {
        type: 'scale',
        label: 'مقياس رقمي',
        description: 'مقياس من 1 إلى 10',
        icon: 'Sliders',
        category: 'scale',
        color: 'bg-orange-500',
    },
    {
        type: 'date',
        label: 'تاريخ',
        description: 'اختيار تاريخ',
        icon: 'Calendar',
        category: 'other',
        color: 'bg-rose-500',
    },
];

export const THEME_COLORS = [
    { name: 'أزرق', value: '#3B82F6', bg: 'bg-blue-500' },
    { name: 'بنفسجي', value: '#8B5CF6', bg: 'bg-violet-500' },
    { name: 'أخضر', value: '#10B981', bg: 'bg-emerald-500' },
    { name: 'برتقالي', value: '#F59E0B', bg: 'bg-amber-500' },
    { name: 'وردي', value: '#EC4899', bg: 'bg-pink-500' },
];

export function generateTempId(): string {
    return `temp_${Math.random().toString(36).slice(2)}_${Date.now()}`;
}

export function getDefaultQuestion(type: QuestionType, order: number): BuilderQuestion {
    const base: BuilderQuestion = {
        id: generateTempId(),
        type,
        title: '',
        required: false,
        order,
        settings: {},
    };

    switch (type) {
        case 'multiple_choice':
        case 'checkbox':
        case 'dropdown':
            return { ...base, options: ['خيار 1', 'خيار 2'], title: 'اختر الإجابة المناسبة' };
        case 'rating':
            return { ...base, settings: { maxRating: 5 }, title: 'قيّم تجربتك' };
        case 'scale':
            return { ...base, settings: { minScale: 1, maxScale: 10, minLabel: 'ضعيف', maxLabel: 'ممتاز' }, title: 'ما مدى رضاك' };
        case 'short_text':
            return { ...base, title: 'أدخل نصاً' };
        case 'long_text':
            return { ...base, title: 'شارك أفكارك' };
        case 'email':
            return { ...base, title: 'بريدك الإلكتروني' };
        case 'number':
            return { ...base, title: 'أدخل رقماً', settings: {} };
        case 'date':
            return { ...base, title: 'اختر تاريخاً' };
        default:
            return base;
    }
}
