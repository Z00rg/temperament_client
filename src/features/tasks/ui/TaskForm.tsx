'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Button } from '@/shared/ui/Button';

// Типы
interface Question {
    id: string;
    number: number;
    question: string;
    answer: string;
    correct: boolean;
}

interface TextMarkup {
    start: number;
    end: number;
    type: 'strong' | 'balance' | 'mobility' | 'undue';
}

interface TaskFormData {
    id?: string;
    taskCategory: string;
    complexity: string;
    taskText: string;
    answer: number;
    textMarkup: TextMarkup[];
    characteristics: {
        blue: string;
        yellow: string;
        green: string;
    };
    questions: Question[];
}

interface TaskFormProps {
    taskId?: string;
    closeModal: () => void;
    onSave?: (data: TaskFormData) => void;
}

const CATEGORIES = [
    { id: 'temperament', name: 'Определение темперамента' },
    { id: 'economic', name: 'Экономические задачи' },
];

const COMPLEXITIES = [
    { id: 'А+Б-', name: 'А+Б-' },
    { id: 'А+Б+', name: 'А+Б+' },
    { id: 'А-Б-', name: 'А-Б-' },
    { id: 'А-Б+', name: 'А-Б+' },
];

const ANSWERS = [
    { id: 1, name: 'Флегматик' },
    { id: 2, name: 'Сангвиник' },
    { id: 3, name: 'Холерик' },
    { id: 4, name: 'Меланхолик' },
];

const CHAR_OPTIONS = {
    blue: [
        { id: 'strong', name: 'Сила' },
        { id: 'weak', name: 'Слабость' },
    ],
    yellow: [
        { id: 'balanced', name: 'Уравновешенность' },
        { id: 'unbalanced', name: 'Неуравновешенность' },
    ],
    green: [
        { id: 'mobile', name: 'Подвижность' },
        { id: 'inert', name: 'Инертность' },
    ],
};

export function TaskForm({ taskId, closeModal, onSave }: TaskFormProps) {
    const [category, setCategory] = useState('');
    const [complexity, setComplexity] = useState('');
    const [taskText, setTaskText] = useState('');
    const [isTextMode, setIsTextMode] = useState(true);
    const [textMarkup, setTextMarkup] = useState<TextMarkup[]>([]);
    const [answer, setAnswer] = useState<number | null>(null);
    const [characteristics, setCharacteristics] = useState({
        blue: 'strong',
        yellow: 'balanced',
        green: 'mobile',
    });
    const [questions, setQuestions] = useState<Question[]>([]);
    const [showQuestionForm, setShowQuestionForm] = useState(false);
    const [newQuestion, setNewQuestion] = useState({ question: '', answer: '' });

    const textRef = useRef<HTMLDivElement>(null);

    // Загрузка данных при редактировании
    useEffect(() => {
        if (taskId) {
            // TODO: Fetch task data
            // const data = await fetch(`/api/tasks/${taskId}`);
            // setCategory(data.taskCategory);
            // setComplexity(data.complexity);
            // setTaskText(data.taskText);
            // setTextMarkup(data.textMarkup);
            // setAnswer(data.answer);
            // setCharacteristics(data.characteristics);
            // setQuestions(data.questions);
            // setIsTextMode(false);
        }
    }, [taskId]);

    const needsQuestions = complexity === 'А-Б-' || complexity === 'А-Б+';
    const showTextSection = category && complexity;
    const showHighlightSection = !isTextMode && taskText;

    // Получение позиции выделенного текста
    const getTextPosition = useCallback(
        (selectedText: string): { start: number; end: number } | null => {
            const trimmedSelection = selectedText.trim();
            if (!trimmedSelection) return null;

            let startIndex = 0;
            const allMatches: number[] = [];

            while (true) {
                const index = taskText.indexOf(trimmedSelection, startIndex);
                if (index === -1) break;
                allMatches.push(index);
                startIndex = index + 1;
            }

            if (allMatches.length === 0) return null;

            if (allMatches.length === 1) {
                return {
                    start: allMatches[0],
                    end: allMatches[0] + trimmedSelection.length,
                };
            }

            for (const matchStart of allMatches) {
                const matchEnd = matchStart + trimmedSelection.length;
                const hasOverlap = textMarkup.some(
                    (mark) =>
                        (matchStart >= mark.start && matchStart < mark.end) ||
                        (matchEnd > mark.start && matchEnd <= mark.end) ||
                        (matchStart <= mark.start && matchEnd >= mark.end)
                );

                if (!hasOverlap) {
                    return { start: matchStart, end: matchEnd };
                }
            }

            return null;
        },
        [taskText, textMarkup]
    );

    // Выделение текста
    const handleHighlight = useCallback(
        (type: 'strong' | 'balance' | 'mobility' | 'undue') => {
            const selection = window.getSelection();
            if (!selection || selection.rangeCount === 0 || !selection.toString().trim()) {
                alert('Выделите фрагмент текста');
                return;
            }

            const selectedText = selection.toString();
            const position = getTextPosition(selectedText);

            if (!position) {
                alert('Не удалось определить позицию выделенного текста или фрагмент уже выделен');
                return;
            }

            const { start, end } = position;
            const newMarkup: TextMarkup = { start, end, type };

            setTextMarkup((prev) => [...prev, newMarkup]);
            selection.removeAllRanges();
        },
        [getTextPosition]
    );

    // Рендеринг текста с выделениями
    const renderTextWithHighlights = useMemo(() => {
        if (!textMarkup.length) {
            return <span>{taskText}</span>;
        }

        const sortedMarkup = [...textMarkup].sort((a, b) => a.start - b.start);
        const elements: React.ReactNode[] = [];
        let lastIndex = 0;

        sortedMarkup.forEach((mark, sortedIndex) => {
            if (mark.start > lastIndex) {
                elements.push(
                    <span key={`text-${lastIndex}`}>
            {taskText.slice(lastIndex, mark.start)}
          </span>
                );
            }

            const colorClasses: Record<string, string> = {
                strong: 'bg-blue-200 hover:bg-blue-300',
                balance: 'bg-yellow-200 hover:bg-yellow-300',
                mobility: 'bg-green-200 hover:bg-green-300',
                undue: 'bg-gray-200 hover:bg-gray-300',
            };

            const highlightClass = colorClasses[mark.type];
            const highlightedPart = taskText.slice(mark.start, mark.end);

            // Находим оригинальный индекс в несортированном массиве
            const originalIndex = textMarkup.findIndex(
                m => m.start === mark.start && m.end === mark.end && m.type === mark.type
            );

            elements.push(
                <mark
                    key={`mark-${sortedIndex}`}
                    className={`${highlightClass} px-1 py-0.5 rounded group relative cursor-pointer transition-colors`}
                >
                    {highlightedPart}
                    <button
                        className="hidden group-hover:inline-block absolute -top-1 -right-1 bg-red-500 hover:bg-red-600 text-white rounded-full w-5 h-5 text-xs leading-none transition-colors"
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setTextMarkup((prev) => prev.filter((_, i) => i !== originalIndex));
                        }}
                        type="button"
                    >
                        ×
                    </button>
                </mark>
            );

            lastIndex = mark.end;
        });

        if (lastIndex < taskText.length) {
            elements.push(
                <span key={`text-${lastIndex}`}>
          {taskText.slice(lastIndex)}
        </span>
            );
        }

        return <>{elements}</>;
    }, [taskText, textMarkup]);

    const clearHighlights = () => {
        setTextMarkup([]);
    };

    const addQuestion = () => {
        if (!newQuestion.question || !newQuestion.answer) {
            alert('Заполните вопрос и ответ');
            return;
        }
        if (questions.length >= 9) {
            alert('Максимум 9 вопросов');
            return;
        }

        const question: Question = {
            id: Date.now().toString(),
            number: questions.length + 1,
            question: newQuestion.question,
            answer: newQuestion.answer,
            correct: false,
        };

        setQuestions([...questions, question]);
        setNewQuestion({ question: '', answer: '' });
        setShowQuestionForm(false);
    };

    const toggleCorrect = (id: string) => {
        const correctCount = questions.filter(q => q.correct).length;
        const question = questions.find(q => q.id === id);

        if (!question?.correct && correctCount >= 3) {
            alert('Максимум 3 корректных вопроса');
            return;
        }

        setQuestions(questions.map(q =>
            q.id === id ? { ...q, correct: !q.correct } : q
        ));
    };

    const deleteQuestion = (id: string) => {
        if (confirm('Удалить вопрос?')) {
            setQuestions(questions.filter(q => q.id !== id)
                .map((q, i) => ({ ...q, number: i + 1 })));
        }
    };

    const handleSave = () => {
        // Валидация
        if (!category || !complexity || !taskText || !answer) {
            alert('Заполните все обязательные поля');
            return;
        }

        if (needsQuestions && questions.filter(q => q.correct).length !== 3) {
            alert('Выберите 3 корректных вопроса');
            return;
        }

        const data: TaskFormData = {
            id: taskId,
            taskCategory: category,
            complexity,
            taskText,
            answer,
            textMarkup,
            characteristics,
            questions,
        };

        onSave?.(data);
        closeModal();
    };

    return (
        <div >
            {/* Крестик закрытия */}
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
                {/* Секция 1: Тип и сложность */}
                <div className="bg-white border border-slate-200 rounded-xl p-6">
                    <h3 className="text-lg font-semibold mb-4 text-slate-800">Основная информация</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-2 text-slate-700">
                                Тип задания <span className="text-red-500">*</span>
                            </label>
                            <select
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="">Выберите тип</option>
                                {CATEGORIES.map(c => (
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
                                onChange={(e) => setComplexity(e.target.value)}
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="">Выберите сложность</option>
                                {COMPLEXITIES.map(c => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Секция 2: Текст задания */}
                {showTextSection && (
                    <div className="bg-white border border-slate-200 rounded-xl p-6">
                        <h3 className="text-lg font-semibold mb-4 text-slate-800">Текст и ответ</h3>

                        <div className="grid grid-cols-2 gap-6">
                            {/* Левая часть - текст */}
                            <div>
                                <label className="block text-sm font-medium mb-2 text-slate-700">
                                    Текст задания <span className="text-red-500">*</span>
                                </label>

                                {isTextMode ? (
                                    <textarea
                                        value={taskText}
                                        onChange={(e) => setTaskText(e.target.value)}
                                        className="w-full h-80 px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                                        placeholder="Введите текст задания..."
                                    />
                                ) : (
                                    <div
                                        ref={textRef}
                                        className="w-full h-80 px-4 py-3 border border-slate-300 rounded-lg overflow-y-auto bg-slate-50 select-text cursor-text"
                                    >
                                        {renderTextWithHighlights}
                                    </div>
                                )}

                                <div className="flex gap-3 mt-3">
                                    {!isTextMode ? (
                                        <>
                                            <button
                                                onClick={() => { setIsTextMode(true); clearHighlights(); }}
                                                className="flex items-center gap-2 px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                </svg>
                                                Редактировать
                                            </button>
                                            <button
                                                onClick={clearHighlights}
                                                className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                                Очистить выделения
                                            </button>
                                        </>
                                    ) : taskText && (
                                        <button
                                            onClick={() => {
                                                setIsTextMode(false);
                                            }}
                                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                                            </svg>
                                            Покрасить текст
                                        </button>
                                    )}
                                </div>

                                <div className="mt-6">
                                    <label className="block text-sm font-medium mb-2 text-slate-700">
                                        Ответ <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        value={answer || ''}
                                        onChange={(e) => setAnswer(Number(e.target.value))}
                                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    >
                                        <option value="">Выберите ответ</option>
                                        {ANSWERS.map(a => (
                                            <option key={a.id} value={a.id}>{a.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Правая часть - выделение */}
                            {showHighlightSection && (
                                <div>
                                    <label className="block text-sm font-medium mb-2 text-slate-700">
                                        Выделение характеристик
                                    </label>
                                    <div className="space-y-4 bg-slate-50 p-4 rounded-lg border border-slate-200">
                                        <p className="text-sm text-slate-600 mb-3">
                                            Выделите фрагменты текста слева по характеристикам:
                                        </p>

                                        {/* Синий - Сила */}
                                        <div className="flex items-center gap-3">
                                            <select
                                                value={characteristics.blue}
                                                onChange={(e) => setCharacteristics({
                                                    ...characteristics,
                                                    blue: e.target.value
                                                })}
                                                className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm"
                                            >
                                                {CHAR_OPTIONS.blue.map(opt => (
                                                    <option key={opt.id} value={opt.id}>{opt.name}</option>
                                                ))}
                                            </select>
                                            <button
                                                onClick={() => handleHighlight('strong')}
                                                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors whitespace-nowrap"
                                            >
                                                Выделить
                                            </button>
                                        </div>

                                        {/* Желтый - Уравновешенность */}
                                        <div className="flex items-center gap-3">
                                            <select
                                                value={characteristics.yellow}
                                                onChange={(e) => setCharacteristics({
                                                    ...characteristics,
                                                    yellow: e.target.value
                                                })}
                                                className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm"
                                            >
                                                {CHAR_OPTIONS.yellow.map(opt => (
                                                    <option key={opt.id} value={opt.id}>{opt.name}</option>
                                                ))}
                                            </select>
                                            <button
                                                onClick={() => handleHighlight('balance')}
                                                className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg text-sm font-medium transition-colors whitespace-nowrap"
                                            >
                                                Выделить
                                            </button>
                                        </div>

                                        {/* Зеленый - Подвижность */}
                                        <div className="flex items-center gap-3">
                                            <select
                                                value={characteristics.green}
                                                onChange={(e) => setCharacteristics({
                                                    ...characteristics,
                                                    green: e.target.value
                                                })}
                                                className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm"
                                            >
                                                {CHAR_OPTIONS.green.map(opt => (
                                                    <option key={opt.id} value={opt.id}>{opt.name}</option>
                                                ))}
                                            </select>
                                            <button
                                                onClick={() => handleHighlight('mobility')}
                                                className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-medium transition-colors whitespace-nowrap"
                                            >
                                                Выделить
                                            </button>
                                        </div>

                                        <div className="border-t border-slate-300 pt-4 mt-4">
                                            {/* Серый - Лишние данные */}
                                            <div className="flex items-center gap-3">
                                                <div className="flex-1 px-3 py-2 bg-slate-100 border border-slate-300 rounded-lg text-sm text-slate-700">
                                                    Лишние данные
                                                </div>
                                                <button
                                                    onClick={() => handleHighlight('undue')}
                                                    className="px-4 py-2 bg-slate-500 hover:bg-slate-600 text-white rounded-lg text-sm font-medium transition-colors whitespace-nowrap"
                                                >
                                                    Выделить
                                                </button>
                                            </div>

                                            <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                                <p className="text-xs text-blue-800">
                                                    <strong>Внимание!</strong> Лишние данные содержатся только в заданиях типа <strong>А+Б+</strong> и <strong>А-Б+</strong>
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Секция 3: Вопросы (только для А-Б-, А-Б+) */}
                {needsQuestions && showTextSection && (
                    <div className="bg-white border border-slate-200 rounded-xl p-6">
                        <h3 className="text-lg font-semibold mb-4 text-slate-800">
                            Данные, которые необходимо запросить <span className="text-sm text-slate-500">(минимум 3 корректных)</span>
                        </h3>

                        {/* Список вопросов */}
                        {questions.length > 0 && (
                            <div className="mb-4">
                                <div className="grid grid-cols-12 gap-2 px-4 py-2 bg-slate-50 rounded-t-lg border-b border-slate-200 text-sm font-medium text-slate-600">
                                    <div className="col-span-1">№</div>
                                    <div className="col-span-4">Вопрос</div>
                                    <div className="col-span-5">Ответ</div>
                                    <div className="col-span-1 text-center">✓</div>
                                    <div className="col-span-1"></div>
                                </div>

                                <div className="space-y-1 max-h-64 overflow-y-auto">
                                    {questions.map((q) => (
                                        <div key={q.id} className="grid grid-cols-12 gap-2 px-4 py-3 hover:bg-slate-50 transition-colors border-b border-slate-100 items-center">
                                            <div className="col-span-1 font-semibold text-slate-700">{q.number}</div>
                                            <div className="col-span-4 text-sm text-slate-700">{q.question}</div>
                                            <div className="col-span-5 text-sm text-slate-600">{q.answer}</div>
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
                                                    onClick={() => deleteQuestion(q.id)}
                                                    className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                                                    title="Удалить"
                                                >
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Форма добавления вопроса */}
                        {questions.length < 9 && (
                            <>
                                {!showQuestionForm ? (
                                    <button
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
                                            onChange={(e) => setNewQuestion({ ...newQuestion, question: e.target.value })}
                                            placeholder="Введите вопрос"
                                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        />
                                        <input
                                            type="text"
                                            value={newQuestion.answer}
                                            onChange={(e) => setNewQuestion({ ...newQuestion, answer: e.target.value })}
                                            placeholder="Введите ответ"
                                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        />
                                        <div className="flex gap-2">
                                            <button
                                                onClick={addQuestion}
                                                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                                            >
                                                Сохранить
                                            </button>
                                            <button
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
                                )}
                            </>
                        )}
                    </div>
                )}
            </div>

            {/* Кнопка сохранения */}
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