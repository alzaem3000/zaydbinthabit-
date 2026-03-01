import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { BuilderQuestion, BuilderSurvey, SurveySettings, QuestionType } from './survey-types';
import { getDefaultQuestion } from './survey-types';

// ============================================================
// SURVEY BUILDER STORE (Zustand)
// ============================================================

type SaveStatus = 'saved' | 'saving' | 'unsaved' | 'error';

interface SurveyStore {
    // Current survey being edited
    survey: BuilderSurvey | null;
    // Save status indicator
    saveStatus: SaveStatus;
    // Active (selected) question ID
    activeQuestionId: string | null;
    // Undo/redo stacks
    undoStack: BuilderQuestion[][];
    redoStack: BuilderQuestion[][];

    // Actions
    setSurvey: (survey: BuilderSurvey) => void;
    resetBuilder: () => void;
    updateSurveyMeta: (data: Partial<Pick<BuilderSurvey, 'title' | 'description' | 'settings'>>) => void;
    addQuestion: (type: QuestionType) => void;
    updateQuestion: (id: string, data: Partial<BuilderQuestion>) => void;
    removeQuestion: (id: string) => void;
    reorderQuestions: (questions: BuilderQuestion[]) => void;
    setActiveQuestion: (id: string | null) => void;
    setSaveStatus: (status: SaveStatus) => void;
    undo: () => void;
    redo: () => void;
    duplicateQuestion: (id: string) => void;
}

const MAX_UNDO = 20;

export const useSurveyStore = create<SurveyStore>()(
    persist(
        (set, get) => ({
            survey: null,
            saveStatus: 'saved',
            activeQuestionId: null,
            undoStack: [],
            redoStack: [],

            setSurvey: (survey) => {
                set({ survey, undoStack: [], redoStack: [], activeQuestionId: null });
            },

            resetBuilder: () => {
                set({
                    survey: null,
                    activeQuestionId: null,
                    saveStatus: 'saved',
                    undoStack: [],
                    redoStack: [],
                });
            },

            updateSurveyMeta: (data) => {
                const { survey } = get();
                if (!survey) return;
                set({
                    survey: {
                        ...survey,
                        ...data,
                        settings: data.settings !== undefined ? { ...survey.settings, ...data.settings } : survey.settings,
                    },
                    saveStatus: 'unsaved',
                });
            },

            addQuestion: (type) => {
                const { survey } = get();
                if (!survey) return;
                const snapshot = [...survey.questions];
                const newQuestion = getDefaultQuestion(type, survey.questions.length);
                const updatedQuestions = [...survey.questions, newQuestion];
                set({
                    survey: { ...survey, questions: updatedQuestions },
                    activeQuestionId: newQuestion.id,
                    saveStatus: 'unsaved',
                    undoStack: [...get().undoStack.slice(-MAX_UNDO + 1), snapshot],
                    redoStack: [],
                });
            },

            updateQuestion: (id, data) => {
                const { survey } = get();
                if (!survey) return;
                const updatedQuestions = survey.questions.map((q) =>
                    q.id === id ? { ...q, ...data } : q
                );
                set({
                    survey: { ...survey, questions: updatedQuestions },
                    saveStatus: 'unsaved',
                });
            },

            removeQuestion: (id) => {
                const { survey } = get();
                if (!survey) return;
                const snapshot = [...survey.questions];
                const updatedQuestions = survey.questions
                    .filter((q) => q.id !== id)
                    .map((q, i) => ({ ...q, order: i }));
                set({
                    survey: { ...survey, questions: updatedQuestions },
                    activeQuestionId: null,
                    saveStatus: 'unsaved',
                    undoStack: [...get().undoStack.slice(-MAX_UNDO + 1), snapshot],
                    redoStack: [],
                });
            },

            reorderQuestions: (questions) => {
                const { survey } = get();
                if (!survey) return;
                const reindexed = questions.map((q, i) => ({ ...q, order: i }));
                set({
                    survey: { ...survey, questions: reindexed },
                    saveStatus: 'unsaved',
                });
            },

            setActiveQuestion: (id) => {
                set({ activeQuestionId: id });
            },

            setSaveStatus: (status) => {
                set({ saveStatus: status });
            },

            duplicateQuestion: (id) => {
                const { survey } = get();
                if (!survey) return;
                const q = survey.questions.find((q) => q.id === id);
                if (!q) return;
                const snapshot = [...survey.questions];
                const copy = {
                    ...q,
                    id: `temp_${Math.random().toString(36).slice(2)}_${Date.now()}`,
                    title: `${q.title} (نسخة)`,
                    order: survey.questions.length,
                };
                set({
                    survey: { ...survey, questions: [...survey.questions, copy] },
                    activeQuestionId: copy.id,
                    saveStatus: 'unsaved',
                    undoStack: [...get().undoStack.slice(-MAX_UNDO + 1), snapshot],
                    redoStack: [],
                });
            },

            undo: () => {
                const { survey, undoStack, redoStack } = get();
                if (!survey || undoStack.length === 0) return;
                const prev = undoStack[undoStack.length - 1];
                set({
                    survey: { ...survey, questions: prev },
                    undoStack: undoStack.slice(0, -1),
                    redoStack: [survey.questions, ...redoStack.slice(0, MAX_UNDO - 1)],
                    saveStatus: 'unsaved',
                });
            },

            redo: () => {
                const { survey, undoStack, redoStack } = get();
                if (!survey || redoStack.length === 0) return;
                const next = redoStack[0];
                set({
                    survey: { ...survey, questions: next },
                    undoStack: [...undoStack.slice(-MAX_UNDO + 1), survey.questions],
                    redoStack: redoStack.slice(1),
                    saveStatus: 'unsaved',
                });
            },
        }),
        {
            name: 'survey-builder-draft',
            partialize: (state) => ({ survey: state.survey }),
        }
    )
);
