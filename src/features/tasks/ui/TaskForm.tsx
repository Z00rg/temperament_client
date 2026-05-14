'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Button } from '@/shared/ui/Button';

// ─── Типы ────────────────────────────────────────────────────────────────────

interface CharacteristicOption {
    id: string;
    name: string;
}

interface Characteristic {
    id: string;
    name: string;
    color: 'blue' | 'yellow' | 'green' | 'red' | 'purple' | 'pink';
    options: CharacteristicOption[];
}

/**
 * Конфигурация категории задания.
 * Один запрос GET /api/task-categories возвращает CategoryConfig[].
 * Содержит всё необходимое для рендера формы: характеристики и варианты ответа.
 *
 * TODO: заменить MOCK_CATEGORY_CONFIGS на хук:
 *   const { data: categoryConfigs = [] } = useQuery({
 *     queryKey: ['task-categories'],
 *     queryFn: (): Promise<CategoryConfig[]> => fetch('/api/task-categories').then(r => r.json()),
 *   });
 */
interface CategoryConfig {
    id: string;
    name: string;
    characteristics: Characteristic[];
    answerOptions: Array<{ id: number; text: string }>;
}

/** Совпадает с MarkupItemIn из generated.ts → SubmitRequest.answer_markup */
interface MarkupItem {
    start: number;
    end: number;
    category_slug: string; // id характеристики | 'undue'
}

interface Question {
    id: string;
    number: number;
    question: string;
    answer: string;
    /** true → id попадёт в selected_question_ids при сабмите */
    correct: boolean;
}

/**
 * Итоговые данные формы.
 * Поля зеркалят SubmitRequest + TaskStudentSchema —
 * именно эту структуру ожидает бэк при создании/редактировании задания.
 */
interface TaskFormData {
    id?: string;
    taskCategory: string;
    complexity: string;
    taskText: string;
    /** Полная структура характеристик категории (отдаётся студенту как TaskStudentSchema.characteristics) */
    characteristics: Characteristic[];
    /** Правильные значения: charId → optionId (эталон, аналог student_characteristics) */
    correctCharacteristics: Record<string, string>;
    /** Совпадает с answer_markup / MarkupItemIn[] */
    textMarkup: MarkupItem[];
    /** Варианты ответа категории (отдаётся студенту как TaskStudentSchema.answerOptions) */
    answerOptions: Array<{ id: number; text: string }>;
    /** Правильный ответ: id из answerOptions (аналог selected_answer_id) */
    correctAnswerId: number | null;
    questions: Question[];
}

// ─── Мок-данные ──────────────────────────────────────────────────────────────
// TODO: удалить MOCK_CATEGORY_CONFIGS и получать данные через useQuery:
//   const { data: categoryConfigs = [] } = useQuery({
//     queryKey: ['task-categories'],
//     queryFn: (): Promise<CategoryConfig[]> => fetch('/api/task-categories').then(r => r.json()),
//   });

const MOCK_CATEGORY_CONFIGS: CategoryConfig[] = [
    {
        id: 'temperament',
        name: 'Определение темперамента',
        characteristics: [
            {
                id: 'char_strength',
                name: 'Сила нервной системы',
                color: 'blue',
                options: [
                    { id: 'opt_strong', name: 'Сила'    },
                    { id: 'opt_weak',   name: 'Слабость' },
                ],
            },
            {
                id: 'char_balance',
                name: 'Уравновешенность',
                color: 'yellow',
                options: [
                    { id: 'opt_balanced',   name: 'Уравновешенность'   },
                    { id: 'opt_unbalanced', name: 'Неуравновешенность' },
                ],
            },
            {
                id: 'char_mobility',
                name: 'Подвижность',
                color: 'green',
                options: [
                    { id: 'opt_mobile', name: 'Подвижность' },
                    { id: 'opt_inert',  name: 'Инертность'  },
                ],
            },
        ],
        answerOptions: [
            { id: 1, text: 'Флегматик'  },
            { id: 2, text: 'Сангвиник'  },
            { id: 3, text: 'Холерик'    },
            { id: 4, text: 'Меланхолик' },
        ],
    },
    {
        id: 'economic',
        name: 'Экономические задачи',
        // TODO: уточнить итоговый список характеристик и вариантов ответа у аналитиков/заказчика
        characteristics: [
            {
                id: 'char_profit',
                name: 'Прибыльность',
                color: 'blue',
                options: [
                    { id: 'opt_profitable',     name: 'Прибыльный' },
                    { id: 'opt_non_profitable',  name: 'Убыточный'  },
                ],
            },
            {
                id: 'char_risk',
                name: 'Уровень риска',
                color: 'yellow',
                options: [
                    { id: 'opt_low_risk',  name: 'Низкий риск'  },
                    { id: 'opt_high_risk', name: 'Высокий риск' },
                ],
            },
            {
                id: 'char_liquidity',
                name: 'Ликвидность',
                color: 'green',
                options: [
                    { id: 'opt_liquid',   name: 'Ликвидный'   },
                    { id: 'opt_illiquid', name: 'Неликвидный' },
                ],
            },
        ],
        answerOptions: [
            { id: 1, text: 'Вариант A' },
            { id: 2, text: 'Вариант B' },
            { id: 3, text: 'Вариант C' },
            { id: 4, text: 'Вариант D' },
        ],
    },
];

// ─── Вспомогательные константы ───────────────────────────────────────────────

const COMPLEXITIES = [
    { id: 'А+Б-', name: 'А+Б-' },
    { id: 'А+Б+', name: 'А+Б+' },
    { id: 'А-Б-', name: 'А-Б-' },
    { id: 'А-Б+', name: 'А-Б+' },
];

const COLOR_HIGHLIGHT: Record<string, string> = {
    blue:   'bg-blue-200 hover:bg-blue-300',
    yellow: 'bg-yellow-200 hover:bg-yellow-300',
    green:  'bg-green-200 hover:bg-green-300',
    undue:  'bg-gray-200 hover:bg-gray-300',
};

const COLOR_BUTTON: Record<string, string> = {
    blue: 'bg-blue-500 hover:bg-blue-600',
    yellow: 'bg-yellow-500 hover:bg-yellow-600',
    green: 'bg-green-500 hover:bg-green-600',
    red: 'bg-red-500 hover:bg-red-600',
    purple: 'bg-purple-500 hover:bg-purple-600',
    pink: 'bg-pink-500 hover:bg-pink-600',
};

// ─── Хелпер ──────────────────────────────────────────────────────────────────

/** Строит начальный словарь correctCharacteristics из списка характеристик */
function buildInitialCorrectChars(chars: Characteristic[]): Record<string, string> {
    return Object.fromEntries(chars.map(c => [c.id, c.options[0].id]));
}

// ─── Компонент ────────────────────────────────────────────────────────────────

interface TaskFormProps {
    taskId?: string;
    closeModal: () => void;
    onSave?: (data: TaskFormData) => void;
}

export function TaskForm({ taskId, closeModal, onSave }: TaskFormProps) {
    // TODO: заменить на данные из useQuery (см. MOCK_CATEGORY_CONFIGS выше)
    const categoryConfigs = MOCK_CATEGORY_CONFIGS;

    // ── базовые поля ──
    const [categoryId,  setCategoryId]  = useState('');
    const [complexity,  setComplexity]  = useState('');
    const [taskText,    setTaskText]    = useState('');
    const [isTextMode,  setIsTextMode]  = useState(true);

    // ── конфигурация выбранной категории (характеристики + варианты ответа) ──
    const selectedCategory = categoryConfigs.find(c => c.id === categoryId) ?? null;
    const characteristics  = selectedCategory?.characteristics ?? [];
    const answerOptions    = selectedCategory?.answerOptions    ?? [];

    // ── разметка текста ──
    const [textMarkup, setTextMarkup] = useState<MarkupItem[]>([]);

    // ── правильные значения характеристик (charId → optionId) ──
    const [correctCharacteristics, setCorrectCharacteristics] = useState<Record<string, string>>({});

    // ── правильный итоговый ответ ──
    const [correctAnswerId, setCorrectAnswerId] = useState<number | null>(null);

    // ── вопросы ──
    const [questions,        setQuestions]        = useState<Question[]>([]);
    const [showQuestionForm, setShowQuestionForm] = useState(false);
    const [newQuestion,      setNewQuestion]      = useState({ question: '', answer: '' });

    const textRef = useRef<HTMLDivElement>(null);

    // ── при смене категории сбрасываем зависимые стейты ──
    useEffect(() => {
        if (!selectedCategory) {
            setCorrectCharacteristics({});
            setCorrectAnswerId(null);
            setTextMarkup([]);
            return;
        }
        // Пересчитываем правильные значения под новый набор характеристик
        setCorrectCharacteristics(buildInitialCorrectChars(selectedCategory.characteristics));
        setCorrectAnswerId(null);
        // Старые category_slug в разметке больше не валидны для новой категории
        setTextMarkup([]);
    }, [categoryId]); // eslint-disable-line react-hooks/exhaustive-deps
    //   ^ намеренно categoryId, а не selectedCategory (объект пересоздаётся каждый рендер)

    // ── загрузка при редактировании ──
    useEffect(() => {
        if (!taskId) return;
        // TODO: загрузить задание и заполнить все стейты:
        //   const data: TaskFormData = await fetch(`/api/tasks/${taskId}`).then(r => r.json());
        //   setCategoryId(data.taskCategory);
        //   setComplexity(data.complexity);
        //   setTaskText(data.taskText);
        //   setTextMarkup(data.textMarkup);
        //   setCorrectCharacteristics(data.correctCharacteristics);
        //   setCorrectAnswerId(data.correctAnswerId);
        //   setQuestions(data.questions);
        //   setIsTextMode(false);
    }, [taskId]);

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

            // Цвет берём из характеристик текущей категории; 'undue' → серый
            const char     = characteristics.find(c => c.id === mark.category_slug);
            const colorKey = char ? char.color : 'undue';

            const origIdx = textMarkup.findIndex(
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
                id:       Date.now().toString(),
                number:   prev.length + 1,
                question: newQuestion.question,
                answer:   newQuestion.answer,
                correct:  false,
            },
        ]);
        setNewQuestion({ question: '', answer: '' });
        setShowQuestionForm(false);
    };

    const toggleCorrect = (id: string) => {
        const q = questions.find(q => q.id === id);
        if (!q) return;
        if (!q.correct && questions.filter(q => q.correct).length >= 3) {
            alert('Максимум 3 корректных вопроса');
            return;
        }
        setQuestions(qs => qs.map(q => q.id === id ? { ...q, correct: !q.correct } : q));
    };

    const deleteQuestion = (id: string) => {
        if (!confirm('Удалить вопрос?')) return;
        setQuestions(qs =>
            qs.filter(q => q.id !== id).map((q, i) => ({ ...q, number: i + 1 }))
        );
    };

    // ── сохранение ──
    const handleSave = () => {
        if (!categoryId || !complexity || !taskText || !correctAnswerId) {
            alert('Заполните все обязательные поля');
            return;
        }
        if (needsQuestions && questions.filter(q => q.correct).length !== 3) {
            alert('Выберите ровно 3 корректных вопроса');
            return;
        }

        const data: TaskFormData = {
            id: taskId,
            taskCategory: categoryId,
            complexity,
            taskText,
            characteristics,
            correctCharacteristics,
            textMarkup,
            answerOptions,
            correctAnswerId,
            questions,
        };

        onSave?.(data);
        closeModal();
    };

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

                        {/* Тип задания */}
                        {/* TODO: список категорий — из useQuery(['task-categories']) вместо categoryConfigs */}
                        <div>
                            <label className="block text-sm font-medium mb-2 text-slate-700">
                                Тип задания <span className="text-red-500">*</span>
                            </label>
                            <select
                                value={categoryId}
                                onChange={e => setCategoryId(e.target.value)}
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="">Выберите тип</option>
                                {categoryConfigs.map(c => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>
                        </div>

                        {/* Сложность */}
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

                    {/* Превью конфигурации выбранной категории */}
                    {selectedCategory && (
                        <div className="mt-4 p-3 bg-slate-50 border border-slate-200 rounded-lg">
                            <p className="text-xs text-slate-400 mb-2 font-medium uppercase tracking-wide">
                                Конфигурация категории
                            </p>
                            <div className="flex flex-wrap gap-2">
                                {selectedCategory.characteristics.map(char => (
                                    <span
                                        key={char.id}
                                        className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium
                                            ${char.color === 'blue'   ? 'bg-blue-100 text-blue-700'     : ''}
                                            ${char.color === 'yellow' ? 'bg-yellow-100 text-yellow-700' : ''}
                                            ${char.color === 'green'  ? 'bg-green-100 text-green-700'   : ''}
                                        `}
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

                            {/* Левая колонка — текст + правильный ответ */}
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

                                {/* Кнопки переключения режима */}
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

                                {/* Правильный ответ — варианты из текущей категории */}
                                <div className="mt-6">
                                    <label className="block text-sm font-medium mb-2 text-slate-700">
                                        Правильный ответ <span className="text-red-500">*</span>
                                    </label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {answerOptions.map(opt => (
                                            <button
                                                key={opt.id}
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

                            {/* Правая колонка — панель выделения характеристик */}
                            {showHighlightPanel && (
                                <div>
                                    <label className="block text-sm font-medium mb-2 text-slate-700">
                                        Выделение характеристик
                                    </label>

                                    <div className="space-y-4 bg-slate-50 p-4 rounded-lg border border-slate-200">
                                        <p className="text-sm text-slate-500">
                                            Выделите фрагменты текста слева, затем нажмите нужную кнопку:
                                        </p>

                                        {/* Характеристики текущей категории */}
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

                                        {/* Лишние данные */}
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
                                            key={q.id}
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
                                                    onChange={() => toggleCorrect(q.id)}
                                                    className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                                                />
                                            </div>
                                            <div className="col-span-1 text-right">
                                                <button
                                                    type="button"
                                                    onClick={() => deleteQuestion(q.id)}
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

                                {/* Счётчик корректных */}
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
                                        <button
                                            type="button"
                                            onClick={addQuestion}
                                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                                        >
                                            Сохранить
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setShowQuestionForm(false);
                                                setNewQuestion({ question: '', answer: '' });
                                            }}
                                            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg transition-colors"
                                        >
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