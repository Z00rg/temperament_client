'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Button } from '@/shared/ui/Button';
import {
    useCreateTaskMutationQuery, useEditTaskMutationQuery,
    useTaskCategoriesQuery,
    useTaskInfoQuery,
} from '@/entities/bank-tasks';
import {
    CategoryConfigSchema,
    CharacteristicSchema, MarkupItemSchema,
    TaskFormCreate,
} from '@/shared/api/generated';

// ─── Типы ─────────────────────────────────────────────────────────────────────

// Используем типы из generated.ts напрямую — не дублируем локально.
// CategoryConfigSchema.characteristics → CharacteristicSchema[] где color: string.
// COLOR_HIGHLIGHT / COLOR_BUTTON / COLOR_BADGE индексируются string — всё корректно.

/**
 * Тело POST /api/tasks/ и PUT /api/tasks/{id}/update/.
 * Совпадает с TaskFormCreate из generated.ts — реэкспортируем под удобным именем.
 */
export type CreateTaskPayload = TaskFormCreate;

// ─── Внутренний стейт вопросов ────────────────────────────────────────────────

/**
 * Черновик вопроса в UI.
 * localId — только для React key и операций в списке, на сервер не уходит.
 * serverId заполняется при загрузке существующего задания.
 */
interface QuestionDraft {
    localId: string;
    serverId?: string;
    number: number;
    question: string;
    answer: string;
    correct: boolean;
}

// ─── Вспомогательные константы ───────────────────────────────────────────────

const COMPLEXITIES = [
    { id: '1', name: 'А+Б-' },
    { id: '2', name: 'А+Б+' },
    { id: '3', name: 'А-Б-' },
    { id: '4', name: 'А-Б+' },
];

// Словарь сложностей для отправки на бек цифрой
const complexityMap: Record<string, number> = {
    'А+Б-': 1,
    'А+Б+': 2,
    'А-Б-': 3,
    'А-Б+': 4
};

const COLOR_HIGHLIGHT: Record<string, string> = {
    blue:   'bg-blue-200 hover:bg-blue-300',
    yellow: 'bg-yellow-200 hover:bg-yellow-300',
    green:  'bg-green-200 hover:bg-green-300',
    red:    'bg-red-200 hover:bg-red-300',
    purple: 'bg-purple-200 hover:bg-purple-300',
    pink:   'bg-pink-200 hover:bg-pink-300',
    undue:  'bg-gray-200 hover:bg-gray-300',
};

const COLOR_BUTTON: Record<string, string> = {
    blue:   'bg-blue-500 hover:bg-blue-600',
    yellow: 'bg-yellow-500 hover:bg-yellow-600',
    green:  'bg-green-500 hover:bg-green-600',
    red:    'bg-red-500 hover:bg-red-600',
    purple: 'bg-purple-500 hover:bg-purple-600',
    pink:   'bg-pink-500 hover:bg-pink-600',
};

const COLOR_BADGE: Record<string, string> = {
    blue:   'bg-blue-100 text-blue-700',
    yellow: 'bg-yellow-100 text-yellow-700',
    green:  'bg-green-100 text-green-700',
    red:    'bg-red-100 text-red-700',
    purple: 'bg-purple-100 text-purple-700',
    pink:   'bg-pink-100 text-pink-700',
};

// ─── Хелперы ─────────────────────────────────────────────────────────────────

function buildInitialCorrectChars(chars: CharacteristicSchema[]): Record<string, string> {
    return Object.fromEntries(chars.map(c => [c.id, c.options[0].id]));
}

// ─── Компонент ────────────────────────────────────────────────────────────────

interface TaskFormProps {
    taskId?: number;
    closeModal: () => void;
    onSave?: (payload: CreateTaskPayload) => void;
}

export function TaskForm({ taskId, closeModal, onSave }: TaskFormProps) {
    // ── запросы через TanStack Query ──
    const categoriesQuery = useTaskCategoriesQuery();
    const taskInfoQuery   = useTaskInfoQuery(taskId!); // enabled только при наличии taskId (см. хук)

    // мутации редактирования/создания заданий
    const useCreateTaskMutation  = useCreateTaskMutationQuery({closeModal});
    const useEditTaskMutation = useEditTaskMutationQuery({closeModal});

    const categoryConfigs: CategoryConfigSchema[] = categoriesQuery.data?.data ?? [];
    const taskInfo = taskInfoQuery.data?.data;

    const isLoading = categoriesQuery.isLoading || (!!taskId && taskInfoQuery.isLoading);

    // ── базовые поля формы ──
    const [categoryId,  setCategoryId]  = useState('');
    const [complexity,  setComplexity]  = useState('');
    const [taskText,    setTaskText]    = useState('');
    const [isTextMode,  setIsTextMode]  = useState(true);
    const [textMarkup,  setTextMarkup]  = useState<MarkupItemSchema[]>([]);
    const [correctCharacteristics, setCorrectCharacteristics] = useState<Record<string, string>>({});
    const [correctAnswerId, setCorrectAnswerId] = useState<number | null>(null);
    const [questions,        setQuestions]        = useState<QuestionDraft[]>([]);
    const [showQuestionForm, setShowQuestionForm] = useState(false);
    const [newQuestion,      setNewQuestion]      = useState({ question: '', answer: '' });

    const textRef = useRef<HTMLDivElement>(null);

    // ── заполнение формы данными с сервера (режим редактирования) ──
    // Используем ref чтобы заполнить форму ровно один раз — когда данные впервые пришли.
    const taskInfoApplied = useRef(false);
    useEffect(() => {
        if (!taskInfo || taskInfoApplied.current) return;
        taskInfoApplied.current = true;

        setCategoryId(taskInfo.taskCategory);
        setComplexity(taskInfo.complexity);
        setTaskText(taskInfo.taskText);
        setTextMarkup(taskInfo.textMarkup);
        setCorrectCharacteristics(taskInfo.correctCharacteristics);
        setCorrectAnswerId(taskInfo.correctAnswerId);
        setQuestions(
            taskInfo.questions.map((q, i) => ({
                localId:  q.id,
                serverId: q.id,
                number:   i + 1,
                question: q.question,
                answer:   q.answer,
                correct:  q.correct,
            }))
        );
        setIsTextMode(false);
    }, [taskInfo]);

    // ── конфигурация выбранной категории ──
    const selectedCategory: CategoryConfigSchema | null = categoryConfigs.find(c => c.id === categoryId) ?? null;
    const characteristics: CharacteristicSchema[] = selectedCategory?.characteristics ?? [];
    const answerOptions = selectedCategory?.answerOptions ?? [];

    // ── сброс зависимых стейтов при явной смене категории пользователем ──
    // Срабатывает на каждое изменение categoryId, но при первом применении
    // данных с сервера мы уже проставляем correctCharacteristics атомарно в useEffect выше,
    // поэтому здесь отслеживаем только пользовательские изменения через отдельный ref.
    const userChangedCategory = useRef(false);
    const handleCategoryChange = (id: string) => {
        userChangedCategory.current = true;
        setCategoryId(id);
    };

    useEffect(() => {
        if (!userChangedCategory.current) return;
        userChangedCategory.current = false;

        if (!selectedCategory) {
            setCorrectCharacteristics({});
            setCorrectAnswerId(null);
            setTextMarkup([]);
            return;
        }
        setCorrectCharacteristics(buildInitialCorrectChars(selectedCategory.characteristics));
        setCorrectAnswerId(null);
        setTextMarkup([]);
    }, [categoryId]); // eslint-disable-line react-hooks/exhaustive-deps

    // ── производные флаги ──
    const needsQuestions     = complexity === 'А-Б-' || complexity === 'А-Б+';
    const showTextSection    = !!(categoryId && complexity);
    const showHighlightPanel = !isTextMode && !!taskText;

    // ── позиция выделенного текста ──
    const getTextPosition = useCallback(
        (selectedText: string): { start: number; end: number } | null => {
            const trimmed = selectedText.trim();
            if (!trimmed) return null;

            let startIdx = 0;
            const matches: number[] = [];
            while (true) {
                const idx = taskText.indexOf(trimmed, startIdx);
                if (idx === -1) break;
                matches.push(idx);
                startIdx = idx + 1;
            }
            if (!matches.length) return null;

            for (const matchStart of matches) {
                const matchEnd = matchStart + trimmed.length;
                const overlaps = textMarkup.some(
                    m =>
                        (matchStart >= m.start && matchStart < m.end) ||
                        (matchEnd   >  m.start && matchEnd   <= m.end) ||
                        (matchStart <= m.start && matchEnd   >= m.end)
                );
                if (!overlaps) return { start: matchStart, end: matchEnd };
            }
            return null;
        },
        [taskText, textMarkup]
    );

    // ── выделение фрагмента ──
    const handleHighlight = useCallback(
        (categorySlug: string) => {
            const sel = window.getSelection();
            if (!sel || sel.rangeCount === 0 || !sel.toString().trim()) {
                alert('Выделите фрагмент текста');
                return;
            }
            const pos = getTextPosition(sel.toString());
            if (!pos) {
                alert('Не удалось определить позицию или фрагмент уже выделен');
                return;
            }
            setTextMarkup(prev => [
                ...prev,
                { start: pos.start, end: pos.end, category_slug: categorySlug },
            ]);
            sel.removeAllRanges();
        },
        [getTextPosition]
    );

    // ── рендер текста с выделениями ──
    const renderTextWithHighlights = useMemo(() => {
        if (!textMarkup.length) return <span>{taskText}</span>;

        const sorted = [...textMarkup].sort((a, b) => a.start - b.start);
        const nodes: React.ReactNode[] = [];
        let last = 0;

        sorted.forEach((mark, si) => {
            if (mark.start > last)
                nodes.push(<span key={`t-${last}`}>{taskText.slice(last, mark.start)}</span>);

            const char     = characteristics.find(c => c.id === mark.category_slug);
            const colorKey = char ? char.color : 'undue';
            const origIdx  = textMarkup.findIndex(
                m => m.start === mark.start && m.end === mark.end && m.category_slug === mark.category_slug
            );

            nodes.push(
                <mark
                    key={`m-${si}`}
                    className={`${COLOR_HIGHLIGHT[colorKey]} px-1 py-0.5 rounded group relative cursor-pointer transition-colors`}
                >
                    {taskText.slice(mark.start, mark.end)}
                    <button
                        type="button"
                        className="hidden group-hover:inline-block absolute -top-1 -right-1 bg-red-500 hover:bg-red-600 text-white rounded-full w-5 h-5 text-xs leading-none transition-colors"
                        onClick={e => {
                            e.preventDefault();
                            e.stopPropagation();
                            setTextMarkup(prev => prev.filter((_, i) => i !== origIdx));
                        }}
                    >
                        ×
                    </button>
                </mark>
            );
            last = mark.end;
        });

        if (last < taskText.length)
            nodes.push(<span key={`t-${last}`}>{taskText.slice(last)}</span>);

        return <>{nodes}</>;
    }, [taskText, textMarkup, characteristics]);

    // ── вопросы ──
    const addQuestion = () => {
        if (!newQuestion.question || !newQuestion.answer) { alert('Заполните вопрос и ответ'); return; }
        if (questions.length >= 9)                        { alert('Максимум 9 вопросов');      return; }

        setQuestions(prev => [
            ...prev,
            {
                localId:  Date.now().toString(),
                number:   prev.length + 1,
                question: newQuestion.question,
                answer:   newQuestion.answer,
                correct:  false,
            },
        ]);
        setNewQuestion({ question: '', answer: '' });
        setShowQuestionForm(false);
    };

    const toggleCorrect = (localId: string) => {
        const q = questions.find(q => q.localId === localId);
        if (!q) return;
        if (!q.correct && questions.filter(q => q.correct).length >= 3) {
            alert('Максимум 3 корректных вопроса');
            return;
        }
        setQuestions(qs => qs.map(q => q.localId === localId ? { ...q, correct: !q.correct } : q));
    };

    const deleteQuestion = (localId: string) => {
        if (!confirm('Удалить вопрос?')) return;
        setQuestions(qs =>
            qs.filter(q => q.localId !== localId).map((q, i) => ({ ...q, number: i + 1 }))
        );
    };

    // ── сборка payload и сохранение ──
    const handleSave = () => {
        if (!categoryId || !complexity || !taskText || !correctAnswerId) {
            alert('Заполните все обязательные поля');
            return;
        }
        if (needsQuestions && questions.filter(q => q.correct).length !== 3) {
            alert('Выберите ровно 3 корректных вопроса');
            return;
        }

        const payload: CreateTaskPayload = {
            taskCategory: categoryId,
            complexity,
            taskText,
            correctCharacteristics,
            textMarkup,
            correctAnswerId,
            // Стрипаем localId/serverId/number — на сервер уходят только данные
            questions: questions.map(({ question, answer, correct }) => ({ question, answer, correct })),
        };

        onSave?.(payload);

        if (!taskId) {
            useCreateTaskMutation.mutate(payload);
        } else {
            useEditTaskMutation.mutate({id: taskId, data: payload});
        }
    };

    // ── состояние загрузки ──
    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-24">
                <div className="flex flex-col items-center gap-3 text-slate-500">
                    <svg className="w-8 h-8 animate-spin text-blue-500" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                    <span className="text-sm">
                        {!!taskId && taskInfoQuery.isLoading ? 'Загрузка задания...' : 'Загрузка конфигурации...'}
                    </span>
                </div>
            </div>
        );
    }

    // ─────────────────────────────────────────────────────────────────────────
    return (
        <div>
            {/* Закрыть */}
            <button
                onClick={closeModal}
                className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors z-10"
                aria-label="Закрыть"
            >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>

            <h2 className="text-2xl font-bold mb-6 text-slate-800">
                {taskId ? 'Редактирование задания' : 'Создание задания'}
            </h2>

            <div className="space-y-6">

                {/* ── Секция 1: Тип и сложность ── */}
                <div className="bg-white border border-slate-200 rounded-xl p-6">
                    <h3 className="text-lg font-semibold mb-4 text-slate-800">Основная информация</h3>
                    <div className="grid grid-cols-2 gap-4">

                        <div>
                            <label className="block text-sm font-medium mb-2 text-slate-700">
                                Тип задания <span className="text-red-500">*</span>
                            </label>
                            <select
                                value={categoryId}
                                onChange={e => handleCategoryChange(e.target.value)}
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="">Выберите тип</option>
                                {categoryConfigs.map(c => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2 text-slate-700">
                                Сложность <span className="text-red-500">*</span>
                            </label>
                            <select
                                value={complexity}
                                onChange={e => setComplexity(e.target.value)}
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="">Выберите сложность</option>
                                {COMPLEXITIES.map(c => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Превью конфигурации категории */}
                    {selectedCategory && (
                        <div className="mt-4 p-3 bg-slate-50 border border-slate-200 rounded-lg">
                            <p className="text-xs text-slate-400 mb-2 font-medium uppercase tracking-wide">
                                Конфигурация категории
                            </p>
                            <div className="flex flex-wrap gap-2">
                                {selectedCategory.characteristics.map(char => (
                                    <span
                                        key={char.id}
                                        className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${COLOR_BADGE[char.color] ?? 'bg-slate-100 text-slate-700'}`}
                                    >
                                        {char.name}
                                    </span>
                                ))}
                                <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-slate-200 text-slate-600">
                                    {selectedCategory.answerOptions.length} вариантов ответа
                                </span>
                            </div>
                        </div>
                    )}
                </div>

                {/* ── Секция 2: Текст и выделения ── */}
                {showTextSection && (
                    <div className="bg-white border border-slate-200 rounded-xl p-6">
                        <h3 className="text-lg font-semibold mb-4 text-slate-800">Текст и ответ</h3>

                        <div className="grid grid-cols-2 gap-6">

                            {/* Левая колонка */}
                            <div>
                                <label className="block text-sm font-medium mb-2 text-slate-700">
                                    Текст задания <span className="text-red-500">*</span>
                                </label>

                                {isTextMode ? (
                                    <textarea
                                        value={taskText}
                                        onChange={e => setTaskText(e.target.value)}
                                        className="w-full h-80 px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                                        placeholder="Введите текст задания..."
                                    />
                                ) : (
                                    <div
                                        ref={textRef}
                                        className="w-full h-80 px-4 py-3 border border-slate-300 rounded-lg overflow-y-auto bg-slate-50 select-text cursor-text leading-relaxed"
                                    >
                                        {renderTextWithHighlights}
                                    </div>
                                )}

                                <div className="flex gap-3 mt-3">
                                    {!isTextMode ? (
                                        <>
                                            <button
                                                type="button"
                                                onClick={() => { setIsTextMode(true); setTextMarkup([]); }}
                                                className="flex items-center gap-2 px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                </svg>
                                                Редактировать
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setTextMarkup([])}
                                                className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                                Очистить выделения
                                            </button>
                                        </>
                                    ) : taskText && (
                                        <button
                                            type="button"
                                            onClick={() => setIsTextMode(false)}
                                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                                      d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                                            </svg>
                                            Покрасить текст
                                        </button>
                                    )}
                                </div>

                                <div className="mt-6">
                                    <label className="block text-sm font-medium mb-2 text-slate-700">
                                        Правильный ответ <span className="text-red-500">*</span>
                                    </label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {answerOptions.map(opt => (
                                            <button
                                                type="button"
                                                onClick={() => setCorrectAnswerId(opt.id)}
                                                className={`px-4 py-2 rounded-lg font-medium border-2 transition-all text-sm
                                                    ${correctAnswerId === opt.id
                                                    ? 'bg-blue-600 border-blue-600 text-white shadow-md scale-[1.02]'
                                                    : 'border-blue-300 text-blue-700 hover:border-blue-500 hover:bg-blue-50'
                                                }`}
                                            >
                                                {opt.text}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Правая колонка — панель выделения */}
                            {showHighlightPanel && (
                                <div>
                                    <label className="block text-sm font-medium mb-2 text-slate-700">
                                        Выделение характеристик
                                    </label>

                                    <div className="space-y-4 bg-slate-50 p-4 rounded-lg border border-slate-200">
                                        <p className="text-sm text-slate-500">
                                            Выделите фрагменты текста слева, затем нажмите нужную кнопку:
                                        </p>

                                        {characteristics.map(char => (
                                            <div key={char.id} className="flex items-center gap-3">
                                                <select
                                                    value={correctCharacteristics[char.id] ?? char.options[0].id}
                                                    onChange={e =>
                                                        setCorrectCharacteristics(prev => ({
                                                            ...prev,
                                                            [char.id]: e.target.value,
                                                        }))
                                                    }
                                                    className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm"
                                                >
                                                    {char.options.map(opt => (
                                                        <option key={opt.id} value={opt.id}>{opt.name}</option>
                                                    ))}
                                                </select>

                                                <button
                                                    type="button"
                                                    onClick={() => handleHighlight(char.id)}
                                                    className={`${COLOR_BUTTON[char.color]} text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap`}
                                                >
                                                    Выделить
                                                </button>
                                            </div>
                                        ))}

                                        <div className="border-t border-slate-300 pt-4">
                                            <div className="flex items-center gap-3">
                                                <div className="flex-1 px-3 py-2 bg-slate-100 border border-slate-300 rounded-lg text-sm text-slate-700">
                                                    Лишние данные
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => handleHighlight('undue')}
                                                    className="bg-slate-500 hover:bg-slate-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap"
                                                >
                                                    Выделить
                                                </button>
                                            </div>
                                            <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                                <p className="text-xs text-blue-800">
                                                    <strong>Внимание!</strong> Лишние данные — только в заданиях{' '}
                                                    <strong>А+Б+</strong> и <strong>А-Б+</strong>.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* ── Секция 3: Вопросы (А-Б- и А-Б+) ── */}
                {needsQuestions && showTextSection && (
                    <div className="bg-white border border-slate-200 rounded-xl p-6">
                        <h3 className="text-lg font-semibold mb-1 text-slate-800">
                            Данные, которые необходимо запросить
                        </h3>
                        <p className="text-sm text-slate-500 mb-4">
                            Отметьте ровно 3 корректных — они попадут в{' '}
                            <code className="bg-slate-100 px-1 rounded text-xs">selected_question_ids</code>.
                        </p>

                        {questions.length > 0 && (
                            <div className="mb-4 rounded-lg border border-slate-200 overflow-hidden">
                                <div className="grid grid-cols-12 gap-2 px-4 py-2 bg-slate-50 border-b border-slate-200 text-sm font-medium text-slate-600">
                                    <div className="col-span-1">№</div>
                                    <div className="col-span-4">Вопрос</div>
                                    <div className="col-span-5">Ответ</div>
                                    <div className="col-span-1 text-center">✓</div>
                                    <div className="col-span-1" />
                                </div>

                                <div className="max-h-64 overflow-y-auto divide-y divide-slate-100">
                                    {questions.map(q => (
                                        <div
                                            key={q.localId}
                                            className={`grid grid-cols-12 gap-2 px-4 py-3 transition-colors items-center
                                                ${q.correct ? 'bg-green-50' : 'hover:bg-slate-50'}`}
                                        >
                                            <div className="col-span-1 font-semibold text-slate-700">{q.number}</div>
                                            <div className="col-span-4 text-sm text-slate-700">{q.question}</div>
                                            <div className="col-span-5 text-sm text-slate-500">{q.answer}</div>
                                            <div className="col-span-1 text-center">
                                                <input
                                                    type="checkbox"
                                                    checked={q.correct}
                                                    onChange={() => toggleCorrect(q.localId)}
                                                    className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                                                />
                                            </div>
                                            <div className="col-span-1 text-right">
                                                <button
                                                    type="button"
                                                    onClick={() => deleteQuestion(q.localId)}
                                                    className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                                >
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="px-4 py-2 bg-slate-50 border-t border-slate-200 text-xs text-slate-500 flex items-center gap-1">
                                    <span className={`font-semibold ${questions.filter(q => q.correct).length === 3 ? 'text-green-600' : 'text-slate-700'}`}>
                                        {questions.filter(q => q.correct).length}
                                    </span>
                                    <span>/ 3 корректных выбрано</span>
                                </div>
                            </div>
                        )}

                        {questions.length < 9 && (
                            !showQuestionForm ? (
                                <button
                                    type="button"
                                    onClick={() => setShowQuestionForm(true)}
                                    className="flex items-center gap-2 px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                    </svg>
                                    Новый вопрос
                                </button>
                            ) : (
                                <div className="space-y-3 p-4 bg-slate-50 rounded-lg border border-slate-200">
                                    <input
                                        type="text"
                                        value={newQuestion.question}
                                        onChange={e => setNewQuestion(p => ({ ...p, question: e.target.value }))}
                                        placeholder="Введите вопрос"
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                    <input
                                        type="text"
                                        value={newQuestion.answer}
                                        onChange={e => setNewQuestion(p => ({ ...p, answer: e.target.value }))}
                                        placeholder="Введите ответ"
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                    <div className="flex gap-2">
                                        <button type="button" onClick={addQuestion}
                                                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
                                            Сохранить
                                        </button>
                                        <button type="button"
                                                onClick={() => { setShowQuestionForm(false); setNewQuestion({ question: '', answer: '' }); }}
                                                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg transition-colors">
                                            Отменить
                                        </button>
                                    </div>
                                </div>
                            )
                        )}
                    </div>
                )}
            </div>

            {/* ── Кнопки ── */}
            <div className="bg-white border-t border-slate-200 pt-6 mt-6 -mx-6 px-6">
                <div className="flex justify-end gap-3">
                    <Button
                        onClick={closeModal}
                        className="px-6 py-3 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg font-medium transition-colors"
                    >
                        Отменить
                    </Button>
                    <Button
                        onClick={handleSave}
                        className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors shadow-sm"
                    >
                        {taskId ? 'Сохранить изменения' : 'Создать задание'}
                    </Button>
                </div>
            </div>
        </div>
    );
}