'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/shared/ui/Button';

// Типы
interface Question {
    id: string;
    number: number;
    question: string;
    answer: string;
    correct: boolean;
}

interface TaskFormData {
    id?: string;
    taskCategory: string;
    complexity: string;
    taskText: string;
    answer: number;
    highlightedText: string;
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
    const [highlightedHtml, setHighlightedHtml] = useState('');
    const [answer, setAnswer] = useState<number | null>(null);
    const [characteristics, setCharacteristics] = useState({
        blue: 'strong',
        yellow: 'balanced',
        green: 'mobile',
    });
    const [questions, setQuestions] = useState<Question[]>([]);
    const [isAddingQuestion, setIsAddingQuestion] = useState(false);
    const [newQuestion, setNewQuestion] = useState({ question: '', answer: '' });

    const textRef = useRef<HTMLDivElement>(null);
    const isEditing = !!taskId;

    // Загрузка данных при редактировании
    useEffect(() => {
        if (taskId) {
            // TODO: Fetch task data
            // const data = await fetch(`/api/tasks/${taskId}`);
            // Симуляция загрузки
            setCategory('temperament');
            setComplexity('А-Б+');
            setTaskText('Студент Иванов...');
            setHighlightedHtml('Студент Иванов...');
            setIsTextMode(false);
            setAnswer(1);
            setQuestions([
                { id: '1', number: 1, question: 'Вопрос 1?', answer: 'Ответ 1', correct: true },
                { id: '2', number: 2, question: 'Вопрос 2?', answer: 'Ответ 2', correct: true },
                { id: '3', number: 3, question: 'Вопрос 3?', answer: 'Ответ 3', correct: true },
            ]);
        }
    }, [taskId]);

    const showTextSection = category && complexity;
    const showHighlightSection = !isTextMode && taskText;
    const needsQuestions = complexity === 'А-Б-' || complexity === 'А-Б+';
    const showQuestionsSection = needsQuestions && showTextSection;

    // Выделение текста
    const handleHighlight = (type: 'strong' | 'balance' | 'mobility' | 'undue') => {
        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0 || !selection.toString().trim()) {
            alert('Выделите фрагмент текста');
            return;
        }

        const range = selection.getRangeAt(0);
        const textContainer = textRef.current;
        if (!textContainer?.contains(range.commonAncestorContainer)) {
            alert('Выделите текст внутри области задания');
            selection.removeAllRanges();
            return;
        }

        const mark = document.createElement('mark');

        // Tailwind классы для разных типов выделения (с group для hover эффекта)
        const highlightClasses: Record<string, string> = {
            strong: 'bg-blue-200 hover:bg-blue-300 px-1 py-0.5 rounded group relative cursor-pointer transition-colors',
            balance: 'bg-yellow-200 hover:bg-yellow-300 px-1 py-0.5 rounded group relative cursor-pointer transition-colors',
            mobility: 'bg-green-200 hover:bg-green-300 px-1 py-0.5 rounded group relative cursor-pointer transition-colors',
            undue: 'bg-gray-200 hover:bg-gray-300 px-1 py-0.5 rounded group relative cursor-pointer transition-colors',
        };

        mark.className = highlightClasses[type] || highlightClasses.undue;
        mark.appendChild(range.extractContents());

        // Создаем кнопку удаления
        const deleteBtn = document.createElement('button');
        deleteBtn.innerHTML = '×';
        deleteBtn.className = 'hidden group-hover:inline-block absolute -top-1 -right-1 bg-red-500 hover:bg-red-600 text-white rounded-full w-5 h-5 text-xs leading-none transition-colors';
        deleteBtn.setAttribute('type', 'button');
        deleteBtn.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            mark.remove();
            if (textContainer) {
                setHighlightedHtml(textContainer.innerHTML);
            }
        };

        mark.appendChild(deleteBtn);
        range.insertNode(mark);
        selection.removeAllRanges();

        if (textContainer) {
            setHighlightedHtml(textContainer.innerHTML);
        }
    };

    const clearHighlights = () => {
        if (textRef.current) {
            textRef.current.textContent = taskText;
            setHighlightedHtml('');
        }
    };

    const startAddingQuestion = () => {
        setIsAddingQuestion(true);
        setNewQuestion({ question: '', answer: '' });
    };

    const cancelAddingQuestion = () => {
        setIsAddingQuestion(false);
        setNewQuestion({ question: '', answer: '' });
    };

    const saveNewQuestion = () => {
        if (!newQuestion.question.trim() || !newQuestion.answer.trim()) {
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
        setIsAddingQuestion(false);
        setNewQuestion({ question: '', answer: '' });
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
        if (confirm('Вы уверены, что хотите удалить этот вопрос?')) {
            setQuestions(questions.filter(q => q.id !== id)
                .map((q, i) => ({ ...q, number: i + 1 })));
        }
    };

    const handleSave = () => {
        // Валидация
        if (!category || !complexity) {
            alert('Выберите тип задания и сложность');
            return;
        }
        if (!taskText) {
            alert('Введите текст задания');
            return;
        }
        if (!answer) {
            alert('Выберите ответ');
            return;
        }

        if (needsQuestions && questions.filter(q => q.correct).length !== 3) {
            alert('Выберите ровно 3 корректных вопроса');
            return;
        }

        const data: TaskFormData = {
            id: taskId,
            taskCategory: category,
            complexity,
            taskText,
            answer,
            highlightedText: highlightedHtml || taskText,
            characteristics,
            questions,
        };

        onSave?.(data);
        closeModal();
    };

    return (
        <div className="w-full max-w-6xl">
            {/* Header с крестиком */}
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-200">
                <h2 className="text-2xl font-bold text-slate-800">
                    {isEditing ? 'Редактирование задания' : 'Создание задания'}
                </h2>
                <button
                    onClick={closeModal}
                    className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                    title="Закрыть"
                >
                    <svg className="w-6 h-6 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>

            <div className="max-h-[75vh] overflow-y-auto pr-2 space-y-6">
                {/* 1. Тип задания и сложность */}
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                            Тип задания <span className="text-red-600">*</span>
                        </label>
                        <select
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value="">Выберите тип задания</option>
                            {CATEGORIES.map(c => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                    </div>

                    {category && (
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">
                                Сложность <span className="text-red-600">*</span>
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
                    )}
                </div>

                {/* 2. Текст задания и выделение */}
                {showTextSection && (
                    <div className="border-t border-slate-200 pt-6">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Левая колонка - текст */}
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                                        Текст задания <span className="text-red-600">*</span>
                                    </label>
                                    {isTextMode ? (
                                        <textarea
                                            value={taskText}
                                            onChange={(e) => setTaskText(e.target.value)}
                                            className="w-full h-64 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                                            placeholder="Введите текст задания"
                                        />
                                    ) : (
                                        <div
                                            ref={textRef}
                                            className="w-full h-64 px-4 py-2 border border-slate-300 rounded-lg overflow-y-auto bg-slate-50 cursor-text"
                                            style={{ userSelect: 'text' }}
                                            dangerouslySetInnerHTML={{ __html: highlightedHtml || taskText }}
                                        />
                                    )}

                                    <div className="flex gap-3 mt-2">
                                        {isTextMode && taskText && (
                                            <button
                                                onClick={() => {
                                                    setHighlightedHtml(taskText);
                                                    setIsTextMode(false);
                                                }}
                                                className="flex items-center gap-2 text-sm text-green-600 hover:text-green-700 font-medium"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                                                </svg>
                                                Покрасить
                                            </button>
                                        )}
                                        {!isTextMode && (
                                            <>
                                                <button
                                                    onClick={() => { setIsTextMode(true); clearHighlights(); }}
                                                    className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                    </svg>
                                                    Редактировать
                                                </button>
                                                <button
                                                    onClick={clearHighlights}
                                                    className="flex items-center gap-2 text-sm text-red-600 hover:text-red-700 font-medium"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                    Очистить выделения
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                                        Ответ <span className="text-red-600">*</span>
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

                            {/* Правая колонка - выделение */}
                            {showHighlightSection && (
                                <div className="space-y-4">
                                    <h3 className="text-sm font-semibold text-slate-700">
                                        Выделите фрагменты текста, характеризующие соответствующие личностные качества:
                                    </h3>

                                    <div className="space-y-3">
                                        {Object.entries(CHAR_OPTIONS).map(([color, options]) => {
                                            const buttonColors = {
                                                blue: 'bg-blue-500 hover:bg-blue-600',
                                                yellow: 'bg-yellow-500 hover:bg-yellow-600',
                                                green: 'bg-green-500 hover:bg-green-600',
                                            };

                                            return (
                                                <div key={color} className="flex items-center gap-2">
                                                    <select
                                                        value={characteristics[color as keyof typeof characteristics]}
                                                        onChange={(e) => setCharacteristics({
                                                            ...characteristics,
                                                            [color]: e.target.value
                                                        })}
                                                        className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                                                    >
                                                        {options.map(opt => (
                                                            <option key={opt.id} value={opt.id}>{opt.name}</option>
                                                        ))}
                                                    </select>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleHighlight(
                                                            color === 'blue' ? 'strong' : color === 'yellow' ? 'balance' : 'mobility'
                                                        )}
                                                        className={`px-4 py-2 rounded-lg text-white text-sm font-medium transition-colors ${
                                                            buttonColors[color as keyof typeof buttonColors]
                                                        }`}
                                                    >
                                                        Выделить текст
                                                    </button>
                                                </div>
                                            );
                                        })}

                                        <div className="flex items-center gap-2">
                                            <div className="flex-1 px-3 py-2 border border-slate-300 rounded-lg bg-slate-100 text-sm">
                                                Лишние данные
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => handleHighlight('undue')}
                                                className="px-4 py-2 rounded-lg bg-slate-500 hover:bg-slate-600 text-white text-sm font-medium transition-colors"
                                            >
                                                Выделить текст
                                            </button>
                                        </div>

                                        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                            <p className="text-sm text-blue-800">
                                                <span className="font-semibold">Внимание!</span> Лишние данные содержатся только в заданиях типа А+Б+, А-Б+
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* 3. Вопросы (только для А-Б-, А-Б+) */}
                {showQuestionsSection && (
                    <div className="border-t border-slate-200 pt-6 space-y-4">
                        <h3 className="text-sm font-semibold text-slate-700">
                            Данные, которые необходимо запросить (минимум 3 корректных)
                        </h3>

                        {/* Заголовки таблицы */}
                        {questions.length > 0 && (
                            <div className="grid grid-cols-12 gap-2 text-xs font-semibold text-slate-600 pb-2 border-b border-slate-200">
                                <div className="col-span-1">№</div>
                                <div className="col-span-4">Вопрос</div>
                                <div className="col-span-4">Ответ</div>
                                <div className="col-span-1 text-center">Корректный</div>
                                <div className="col-span-2 text-center">Действия</div>
                            </div>
                        )}

                        {/* Список вопросов */}
                        <div className="space-y-2">
                            {questions.map((q) => (
                                <div key={q.id} className="grid grid-cols-12 gap-2 items-center p-3 bg-slate-50 rounded-lg border border-slate-200">
                                    <div className="col-span-1 font-semibold text-slate-700">{q.number}</div>
                                    <div className="col-span-4 text-sm text-slate-700">{q.question}</div>
                                    <div className="col-span-4 text-sm text-slate-600">{q.answer}</div>
                                    <div className="col-span-1 flex justify-center">
                                        <input
                                            type="checkbox"
                                            checked={q.correct}
                                            onChange={() => toggleCorrect(q.id)}
                                            className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                    <div className="col-span-2 flex justify-center gap-1">
                                        <button
                                            type="button"
                                            onClick={() => deleteQuestion(q.id)}
                                            className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                                            title="Удалить"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Форма добавления вопроса */}
                        {!isAddingQuestion && questions.length < 9 && (
                            <button
                                type="button"
                                onClick={startAddingQuestion}
                                className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                                Новый вопрос
                            </button>
                        )}

                        {isAddingQuestion && (
                            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200 space-y-3">
                                <input
                                    type="text"
                                    value={newQuestion.question}
                                    onChange={(e) => setNewQuestion({ ...newQuestion, question: e.target.value })}
                                    placeholder="Введите вопрос"
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                                />
                                <input
                                    type="text"
                                    value={newQuestion.answer}
                                    onChange={(e) => setNewQuestion({ ...newQuestion, answer: e.target.value })}
                                    placeholder="Введите ответ"
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                                />
                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={saveNewQuestion}
                                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
                                    >
                                        Сохранить
                                    </button>
                                    <button
                                        type="button"
                                        onClick={cancelAddingQuestion}
                                        className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-sm font-medium rounded-lg transition-colors"
                                    >
                                        Отменить
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Footer с кнопкой сохранения */}
            <div className="mt-6 pt-4 border-t border-slate-200 flex justify-end">
                <Button
                    onPress={handleSave}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold transition-colors shadow-sm"
                >
                    Сохранить
                </Button>
            </div>

        </div>
    );
}