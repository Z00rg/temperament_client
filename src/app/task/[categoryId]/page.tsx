'use client';

import {useState, useEffect, useRef, useCallback, useMemo} from 'react';
import {useRouter, useSearchParams} from 'next/navigation';
import {Button} from '@/shared/ui/Button';
import {UiHeader} from "@/shared/ui/ui-header";
import {MarkupItemIn, SubmitRequest, TaskStudentSchema} from "@/shared/api/generated";
import {useControlTaskQuery, useEducationTaskQuery} from "@/entities/task";
import {useSubmitControlTaskMutation, useSubmitEducationTaskMutation} from "@/entities/task";

// ─── Цветовые маппинги (по ключу) ────────────────────────────────────────────

const COLOR_HIGHLIGHT: Record<string, string> = {
    blue:   'bg-blue-200 hover:bg-blue-300',
    yellow: 'bg-yellow-200 hover:bg-yellow-300',
    green:  'bg-green-200 hover:bg-green-300',
    red:    'bg-red-200 hover:bg-red-300',
    purple: 'bg-purple-200 hover:bg-purple-300',
    pink:   'bg-pink-200 hover:bg-pink-300',
};

const COLOR_BUTTON: Record<string, string> = {
    blue:   'bg-blue-500 hover:bg-blue-600',
    yellow: 'bg-yellow-500 hover:bg-yellow-600',
    green:  'bg-green-500 hover:bg-green-600',
    red:    'bg-red-500 hover:bg-red-600',
    purple: 'bg-purple-500 hover:bg-purple-600',
    pink:   'bg-pink-500 hover:bg-pink-600',
};

// Маппинг сложности
const COMPLEXITY_NAMES: Record<number, string> = {
    1: 'А+Б-',
    2: 'А+Б+',
    3: 'А-Б-',
    4: 'А-Б+',
};

// ─── Хелпер нормализации цвета ───────────────────────────────────────────────
// Принимает как "blue", так и "bg-blue-200" — возвращает всегда "blue"

function extractColorKey(color: string): string {
    const match = color?.match(/bg-(\w+)-\d+/);
    return match ? match[1] : (color ?? '');
}

// ─── Компонент ────────────────────────────────────────────────────────────────

export default function TaskPage() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const mode = searchParams.get('mode') || 'control';
    const complexityParam = searchParams.get('complexity');
    const complexity = complexityParam ? parseInt(complexityParam) : null;

    const isTrainingMode = mode === 'training';

    const controlTaskQuery = useControlTaskQuery();
    const educationTaskQuery = useEducationTaskQuery();

    const submitEducationTask = useSubmitEducationTaskMutation();
    const submitControlTask = useSubmitControlTaskMutation();

    const taskData: TaskStudentSchema | null = useMemo(() => {
        if (isTrainingMode) {
            const tasks = educationTaskQuery.data;
            if (!tasks) return null;
            if (complexity) {
                return tasks.find((t: { complexity_level: number; }) => t.complexity_level === complexity) ?? tasks[0] ?? null;
            }
            return tasks[0] ?? null;
        } else {
            return controlTaskQuery.data ?? null;
        }
    }, [isTrainingMode, controlTaskQuery.data, educationTaskQuery.data, complexity]);

    const isLoading = isTrainingMode ? educationTaskQuery.isLoading : controlTaskQuery.isLoading;
    const isError = isTrainingMode ? educationTaskQuery.isError : controlTaskQuery.isError;

    const [timeLeft, setTimeLeft] = useState(600);
    const [startTime] = useState(new Date());
    const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
    const [selectedQuestions, setSelectedQuestions] = useState<number[]>([]);
    const [chatbotAnswer, setChatbotAnswer] = useState('');
    const [textMarkup, setTextMarkup] = useState<MarkupItemIn[]>([]);
    const [selectedCharacteristics, setSelectedCharacteristics] = useState<Record<string, string>>({});

    useEffect(() => {
        if (taskData) {
            const initial: Record<string, string> = {};
            taskData.characteristics.forEach((char) => {
                initial[char.id] = char.options[0]?.id ?? '';
            });
            setSelectedCharacteristics(initial);
        }
    }, [taskData]);

    const textRef = useRef<HTMLDivElement>(null);
    const [isSelecting, setIsSelecting] = useState(false);
    const selectionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const [debugInfo, setDebugInfo] = useState<string[]>([]);

    const addDebug = useCallback((message: string) => {
        const timestamp = new Date().toLocaleTimeString();
        console.log(`[${timestamp}] ${message}`);
        setDebugInfo(prev => [...prev.slice(-9), `[${timestamp}] ${message}`]);
    }, []);

    useEffect(() => {
        const handleSelectionChange = () => {
            const selection = window.getSelection();
            const selectionText = selection?.toString().trim() || '';
            const hasSelection = selectionText.length > 0;

            const textContainer = textRef.current;
            if (hasSelection && selection && textContainer) {
                const range = selection.rangeCount > 0 ? selection.getRangeAt(0) : null;
                if (!range) return;
                const isInsideTextContainer = textContainer.contains(range.commonAncestorContainer);
                if (!isInsideTextContainer) {
                    addDebug('⚠️ Selection outside task text area, ignoring');
                    return;
                }
            }

            addDebug(`selectionchange event: hasSelection=${hasSelection}, text="${selectionText.substring(0, 30)}${selectionText.length > 30 ? '...' : ''}"`);

            if (selectionTimeoutRef.current) {
                clearTimeout(selectionTimeoutRef.current);
            }

            if (hasSelection) {
                addDebug('Setting isSelecting = true (blocking DOM update)');
                setIsSelecting(true);
            } else {
                addDebug('Selection cleared, scheduling isSelecting = false');
                selectionTimeoutRef.current = setTimeout(() => {
                    addDebug('Setting isSelecting = false (allowing DOM update)');
                    setIsSelecting(false);
                }, 100);
            }
        };

        document.addEventListener('selectionchange', handleSelectionChange);
        addDebug('selectionchange listener attached');

        return () => {
            document.removeEventListener('selectionchange', handleSelectionChange);
            if (selectionTimeoutRef.current) {
                clearTimeout(selectionTimeoutRef.current);
            }
            addDebug('selectionchange listener removed');
        };
    }, [addDebug]);

    useEffect(() => {
        const timer = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    handleAutoSubmit();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60).toString().padStart(2, '0');
        const s = (seconds % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    };

    const formatTimeSpent = (totalSeconds: number): string => {
        const h = Math.floor(totalSeconds / 3600).toString().padStart(2, '0');
        const m = Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, '0');
        const s = (totalSeconds % 60).toString().padStart(2, '0');
        return `${h}:${m}:${s}`;
    };

    const getTextPosition = useCallback(
        (selectedText: string): { start: number; end: number } | null => {
            if (!taskData) return null;
            const trimmedSelection = selectedText.trim();
            if (!trimmedSelection) return null;

            let startIndex = 0;
            const allMatches: number[] = [];

            while (true) {
                const index = taskData.text.indexOf(trimmedSelection, startIndex);
                if (index === -1) break;
                allMatches.push(index);
                startIndex = index + 1;
            }

            if (allMatches.length === 0) return null;

            if (allMatches.length === 1) {
                return { start: allMatches[0], end: allMatches[0] + trimmedSelection.length };
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
        [textMarkup, taskData]
    );

    const handleHighlight = useCallback(
        (categoryId: string) => {
            addDebug(`🖱️ Highlight button clicked for category: ${categoryId}`);

            const selection = window.getSelection();
            if (!selection || selection.rangeCount === 0 || !selection.toString().trim()) {
                addDebug('❌ No selection found');
                alert('Выделите фрагмент текста');
                return;
            }

            const selectedText = selection.toString();
            addDebug(`Selected text: "${selectedText.substring(0, 50)}${selectedText.length > 50 ? '...' : ''}"`);

            const position = getTextPosition(selectedText);
            addDebug(`Position result: ${position ? `start=${position.start}, end=${position.end}` : 'null'}`);

            if (!position) {
                addDebug('❌ Failed to get position');
                alert('Не удалось определить позицию выделенного текста или фрагмент уже выделен');
                return;
            }

            const { start, end } = position;
            const newMarkup: MarkupItemIn = { start, end, category_slug: categoryId };
            addDebug(`✅ Adding markup: ${JSON.stringify(newMarkup)}`);
            setTextMarkup((prev) => [...prev, newMarkup]);

            addDebug('Clearing selection');
            selection.removeAllRanges();

            addDebug('Force setting isSelecting = false');
            setIsSelecting(false);
        },
        [getTextPosition, addDebug]
    );

    const renderTextWithHighlights = useMemo(() => {
        if (!taskData) return null;

        if (!textMarkup.length) {
            return <span>{taskData.text}</span>;
        }

        const sortedMarkup = [...textMarkup].sort((a, b) => a.start - b.start);
        const elements: React.ReactNode[] = [];
        let lastIndex = 0;

        sortedMarkup.forEach((mark, sortedIndex) => {
            if (mark.start > lastIndex) {
                elements.push(
                    <span key={`text-${lastIndex}`}>
                        {taskData.text.slice(lastIndex, mark.start)}
                    </span>
                );
            }

            const characteristic = taskData.characteristics.find(
                (c) => c.id === mark.category_slug
            );
            const colorKey = extractColorKey(characteristic?.color ?? '');
            const highlightClass = COLOR_HIGHLIGHT[colorKey] ?? 'bg-gray-200 hover:bg-gray-300';
            const highlightedPart = taskData.text.slice(mark.start, mark.end);

            const originalIndex = textMarkup.findIndex(
                m => m.start === mark.start && m.end === mark.end && m.category_slug === mark.category_slug
            );

            elements.push(
                <mark
                    key={`mark-${sortedIndex}`}
                    className={`${highlightClass} px-1 py-0.5 rounded group relative cursor-pointer transition-colors`}
                    data-category={mark.category_slug}
                    data-index={sortedIndex}
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

        if (lastIndex < taskData.text.length) {
            elements.push(
                <span key={`text-${lastIndex}`}>
                    {taskData.text.slice(lastIndex)}
                </span>
            );
        }

        return <>{elements}</>;
    }, [textMarkup, taskData]);

    const handleQuestionSelect = (questionId: number) => {
        if (selectedQuestions.includes(questionId)) {
            const question = taskData?.questions.find((q) => q.id === questionId);
            if (question) setChatbotAnswer(question.answer);
            return;
        }

        if (selectedQuestions.length >= 3) return;

        setSelectedQuestions((prev) => [...prev, questionId]);
        const question = taskData?.questions.find((q) => q.id === questionId);
        if (question) setChatbotAnswer(question.answer);
    };

    const handleAutoSubmit = () => {
        handleSubmit(false);
    };

    const handleSubmit = async (manual: boolean = true) => {
        if (!taskData) return;

        if (manual) {
            const missingCategories = taskData.characteristics.filter(
                (char) => !textMarkup.some((mark) => mark.category_slug === char.id)
            );

            if (missingCategories.length > 0) {
                const categoryNames = missingCategories.map((c) => c.name).join(', ');
                alert(`Необходимо выделить текст по следующим критериям: ${categoryNames}`);
                return;
            }

            if (selectedAnswer === null) {
                alert('Необходимо выбрать ответ.');
                return;
            }
        }

        const endTime = new Date();
        const spentSeconds = Math.floor((endTime.getTime() - startTime.getTime()) / 1000);

        const submissionData: SubmitRequest = {
            task_id: taskData.id,
            time_spent: formatTimeSpent(spentSeconds),
            start_time: startTime.toISOString(),
            answer_markup: textMarkup,
            selected_question_ids: selectedQuestions,
            student_characteristics: selectedCharacteristics,
            selected_answer_id: selectedAnswer ?? undefined,
        };

        console.log('Submitting data:', submissionData);

        try {
            if (isTrainingMode) {
                const data = await submitEducationTask.mutateAsync(submissionData);
                console.log('saving to localStorage:', data);
                localStorage.setItem('educationResult', JSON.stringify(data));
                console.log('saved:', localStorage.getItem('educationResult'));
                router.push(`/estimation/education`);
            } else {
                const data = await submitControlTask.mutateAsync(submissionData);
                const estimationId = data.submission_id;
                router.push(`/estimation/${estimationId}`);
            }
        } catch (error) {
            console.error('Submit failed:', error);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
                <UiHeader/>
                <main className="container mx-auto px-6 py-8 flex items-center justify-center min-h-[60vh]">
                    <div className="text-center">
                        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"/>
                        <p className="text-slate-600 text-lg">Загрузка задания...</p>
                    </div>
                </main>
            </div>
        );
    }

    if (isError || !taskData) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
                <UiHeader/>
                <main className="container mx-auto px-6 py-8 flex items-center justify-center min-h-[60vh]">
                    <div className="text-center">
                        <p className="text-red-600 text-lg font-semibold mb-2">Не удалось загрузить задание</p>
                        <p className="text-slate-500 mb-6">Попробуйте обновить страницу</p>
                        <Button onPress={() => window.location.reload()} className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-semibold">
                            Обновить
                        </Button>
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
            <UiHeader/>

            <main className="container mx-auto px-6 py-8">
                {/* Debug Panel */}
                <div className="bg-yellow-50 border-2 border-yellow-400 rounded-lg p-4 mb-6 select-none hidden">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="font-bold text-yellow-800">🐛 Debug Panel</h3>
                        <div className="flex items-center gap-4">
                            <span className="text-sm">
                                isSelecting: <span className={`font-bold ${isSelecting ? 'text-red-600' : 'text-green-600'}`}>
                                    {isSelecting ? 'TRUE (blocked)' : 'FALSE (allowed)'}
                                </span>
                            </span>
                            <span className="text-sm">
                                Markup count: <span className="font-bold">{textMarkup.length}</span>
                            </span>
                            <button
                                onClick={() => setDebugInfo([])}
                                className="text-xs bg-yellow-200 hover:bg-yellow-300 px-2 py-1 rounded"
                            >
                                Clear
                            </button>
                        </div>
                    </div>
                    <div className="bg-white rounded p-2 max-h-40 overflow-y-auto font-mono text-xs select-text">
                        {debugInfo.length === 0 ? (
                            <div className="text-gray-400">Waiting for events...</div>
                        ) : (
                            debugInfo.map((msg, i) => (
                                <div key={i} className="text-gray-700">{msg}</div>
                            ))
                        )}
                    </div>
                </div>

                {/* Индикатор режима обучения */}
                {isTrainingMode && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                        <div className="flex items-center gap-3">
                            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                      d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
                            </svg>
                            <div>
                                <div className="font-semibold text-blue-800">Режим обучения</div>
                                <div className="text-sm text-blue-600">
                                    Сложность: {taskData.complexity_level ? COMPLEXITY_NAMES[taskData.complexity_level] : 'Не указана'}
                                    {' • '}
                                    Результат не сохраняется в ведомость
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Timer */}
                <div className="text-center mb-6">
                    <p className="text-xl font-bold text-blue-600">
                        Время до конца выполнения:{' '}
                        <span className={timeLeft < 60 ? 'text-red-600' : 'text-blue-600'}>
                            {formatTime(timeLeft)}
                        </span>
                    </p>
                </div>

                {/* Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                    {/* Left Column - Task Text */}
                    <div className="bg-white rounded-xl shadow-md p-6 border border-slate-200">
                        <h2 className="text-lg font-bold text-slate-800 mb-4">Условия задания</h2>
                        {taskData.condition && (
                            <p className="text-sm text-slate-500 italic mb-3">{taskData.condition}</p>
                        )}
                        <div
                            ref={textRef}
                            className="bg-slate-50 p-4 rounded-lg border border-slate-200 mb-4 text-slate-700 leading-relaxed min-h-[300px] cursor-text select-text"
                        >
                            {renderTextWithHighlights}
                        </div>
                        <button
                            onClick={() => {
                                setTextMarkup([]);
                                addDebug('🗑️ All highlights cleared');
                            }}
                            className="flex items-center gap-2 text-blue-600 hover:text-blue-700 transition-colors"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
                            </svg>
                            <span className="font-medium">Убрать все выделения</span>
                        </button>
                    </div>

                    {/* Right Column - Highlighting Controls */}
                    <div className="bg-white rounded-xl shadow-md p-6 border border-slate-200">
                        <h2 className="text-lg font-bold text-slate-800 mb-4">
                            Выделите фрагменты текста, характеризующие соответствующие личностные качества:
                        </h2>

                        <div className="space-y-4">
                            {taskData.characteristics.map((characteristic) => {
                                const colorKey = extractColorKey(characteristic.color);
                                const buttonColor = COLOR_BUTTON[colorKey] ?? 'bg-gray-500 hover:bg-gray-600';

                                return (
                                    <div key={characteristic.id} className="space-y-2">
                                        <label className="block text-sm font-medium text-slate-700">
                                            {characteristic.name}
                                        </label>
                                        <div className="flex items-center gap-4">
                                            <select
                                                value={selectedCharacteristics[characteristic.id] ?? ''}
                                                onChange={(e) =>
                                                    setSelectedCharacteristics((prev) => ({
                                                        ...prev,
                                                        [characteristic.id]: e.target.value,
                                                    }))
                                                }
                                                className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            >
                                                {characteristic.options.map((option) => (
                                                    <option key={option.id} value={option.id}>
                                                        {option.name}
                                                    </option>
                                                ))}
                                            </select>
                                            <button
                                                onClick={() => handleHighlight(characteristic.id)}
                                                className={`${buttonColor} text-white px-6 py-2 rounded-lg font-medium transition-colors whitespace-nowrap`}
                                            >
                                                Выделить текст
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Questions Section */}
                <div className="bg-white rounded-xl shadow-md p-6 border border-slate-200 mb-6">
                    <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                        Уточняющие вопросы (выберите не более трех):
                        <span
                            className="text-blue-600 cursor-help"
                            title="Чтобы снова увидеть ответ на вопрос, кликните на него в списке еще раз"
                        >
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"/>
                            </svg>
                        </span>
                    </h2>

                    <div className="flex flex-wrap gap-2 mb-4">
                        {taskData.questions.map((question) => {
                            const isSelected = selectedQuestions.includes(question.id);
                            const isDisabled = !isSelected && selectedQuestions.length >= 3;

                            return (
                                <button
                                    key={question.id}
                                    onClick={() => handleQuestionSelect(question.id)}
                                    disabled={isDisabled}
                                    className={`px-4 py-2 rounded-lg font-medium transition-all ${
                                        isSelected
                                            ? 'bg-blue-600 text-white shadow-md'
                                            : isDisabled
                                                ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                                                : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                                    }`}
                                >
                                    {question.text}
                                </button>
                            );
                        })}
                    </div>

                    <div className="mt-4">
                        <label className="block text-sm font-medium text-slate-700 mb-2">Чат-бот</label>
                        <textarea
                            value={chatbotAnswer}
                            readOnly
                            className="w-full h-24 p-3 border border-slate-300 rounded-lg bg-slate-50 text-slate-700 resize-none"
                            placeholder="Выберите вопрос, чтобы увидеть ответ..."
                        />
                    </div>
                </div>

                {/* Answer Selection */}
                <div className="bg-white rounded-xl shadow-md p-6 border border-slate-200 mb-6">
                    <h2 className="text-lg font-bold text-slate-800 mb-4">
                        Укажите, какой тип темперамента описан в задаче
                    </h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {taskData.answerOptions.map((option) => (
                            <button
                                key={option.id}
                                onClick={() => setSelectedAnswer(option.id)}
                                className={`px-6 py-4 rounded-xl font-semibold text-lg transition-all ${
                                    selectedAnswer === option.id
                                        ? 'bg-blue-600 text-white shadow-xl scale-105'
                                        : 'bg-white text-blue-600 border-2 border-blue-600 hover:bg-blue-50'
                                }`}
                            >
                                {option.text}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Submit Button */}
                <div className="flex justify-center">
                    <Button
                        onPress={() => handleSubmit(true)}
                        isDisabled={submitControlTask.isPending || submitEducationTask.isPending}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-12 py-4 rounded-xl font-semibold text-lg transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {(submitControlTask.isPending || submitEducationTask.isPending)
                            ? 'Отправка...'
                            : 'Проверить'}
                    </Button>
                </div>
            </main>
        </div>
    );
}