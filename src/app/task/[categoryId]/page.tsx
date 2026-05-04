'use client';

import {useState, useEffect, useRef, useCallback, useMemo} from 'react';
import {useRouter, useParams, useSearchParams} from 'next/navigation';
import {Button} from '@/shared/ui/Button';
import {UiHeader} from "@/shared/ui/ui-header";
import {MarkupItemIn, SubmitRequest, TaskStudentSchema} from "@/shared/api/generated";
import {useControlTaskQuery, useEducationTaskQuery} from "@/entities/task";
import {useSubmitControlTaskMutation, useSubmitEducationTaskMutation} from "@/entities/task";

// Тестовые данные задания (имитация ответа от бэка)
// TODO: заменить на запрос с бека (уже написан в entities/task)
const MOCK_TASK: TaskStudentSchema = {
    id: 'task_123',
    text: 'Студент Петров активно участвует в общественной жизни университета. Он быстро адаптируется к новым условиям и легко находит общий язык с окружающими. В стрессовых ситуациях сохраняет спокойствие и рассудительность. Его эмоции стабильны, он редко выходит из себя. При этом он может долго работать над одной задачей, проявляя упорство и настойчивость.',
    characteristics: [
        {
            id: '1',
            name: 'Сила нервной системы',
            color: 'blue',
            options: [
                {id: '1', name: 'Сила'},
                {id: '2', name: 'Слабость'},
            ],
        },
        {
            id: '2',
            name: 'Уравновешенность',
            color: 'yellow',
            options: [
                {id: '3', name: 'Уравновешенность'},
                {id: '4', name: 'Неуравновешенность'},
            ],
        },
        {
            id: '3',
            name: 'Подвижность',
            color: 'green',
            options: [
                {id: '5', name: 'Подвижность'},
                {id: '6', name: 'Инертность'},
            ],
        },
    ],
    questions: [
        {
            id: 'q1',
            text: 'Как быстро включается в работу?',
            answer: 'Студент быстро адаптируется к новым условиям',
        },
        {
            id: 'q2',
            text: 'Как проявляет себя в ответственных ситуациях?',
            answer: 'В стрессовых ситуациях сохраняет спокойствие',
        },
        {
            id: 'q3',
            text: 'Какой у него характер?',
            answer: 'Это не относится к определению темперамента',
        },
        {
            id: 'q4',
            text: 'Как он общается с людьми?',
            answer: 'Легко находит общий язык с окружающими',
        },
        {
            id: 'q5',
            text: 'Какие у него увлечения?',
            answer: 'Это не относится к определению темперамента',
        },
    ],
    answerOptions: [
        {id: 1, text: 'Флегматик'},
        {id: 2, text: 'Сангвиник'},
        {id: 3, text: 'Холерик'},
        {id: 4, text: 'Меланхолик'},
    ],
};

// Цвета для подсветки (используем Tailwind классы)
const HIGHLIGHT_COLORS: Record<string, string> = {
    blue: 'bg-blue-200',
    yellow: 'bg-yellow-200',
    green: 'bg-green-200',
    red: 'bg-red-200',
    purple: 'bg-purple-200',
    pink: 'bg-pink-200',
};

// Маппинг сложности
const COMPLEXITY_NAMES: Record<number, string> = {
    1: 'А+Б-',
    2: 'А+Б+',
    3: 'А-Б-',
    4: 'А-Б+',
};

export default function TaskPage() {
    const router = useRouter();
    const params = useParams();
    const searchParams = useSearchParams();

    // TODO: вытаскивать отсюда дату для тасков
    // const useControlTask = useControlTaskQuery();
    // const useEducationTask = useEducationTaskQuery();

    // Сабмиты
    const submitEducationTask = useSubmitEducationTaskMutation();
    const submitControlTask = useSubmitControlTaskMutation();


    // const categoryId = params.categoryId as string; // temperament или economic
    const mode = searchParams.get('mode') || 'control'; // training или control
    const complexityParam = searchParams.get('complexity'); // 1, 2, 3, 4
    const complexity = complexityParam ? parseInt(complexityParam) : null;

    // Определяем режим тренировки
    const isTrainingMode = mode === 'training';

    // State
    const [timeLeft, setTimeLeft] = useState(600);
    const [startTime] = useState(new Date());
    const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
    const [selectedQuestions, setSelectedQuestions] = useState<string[]>([]);
    const [chatbotAnswer, setChatbotAnswer] = useState('');
    const [textMarkup, setTextMarkup] = useState<MarkupItemIn[]>([]);

    // Динамические характеристики (выбранные значения)
    const [selectedCharacteristics, setSelectedCharacteristics] = useState<
        Record<string, string>
    >(() => {
        const initial: Record<string, string> = {};
        MOCK_TASK.characteristics.forEach((char) => {
            initial[char.id] = char.options[0].id;
        });
        return initial;
    });

    const textRef = useRef<HTMLDivElement>(null);
    const [isSelecting, setIsSelecting] = useState(false);
    const selectionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const [debugInfo, setDebugInfo] = useState<string[]>([]);

    // Функция для добавления отладочной информации
    const addDebug = useCallback((message: string) => {
        const timestamp = new Date().toLocaleTimeString();
        console.log(`[${timestamp}] ${message}`);
        setDebugInfo(prev => [...prev.slice(-9), `[${timestamp}] ${message}`]);
    }, []);

    // Отслеживание активного выделения
    useEffect(() => {
        const handleSelectionChange = () => {
            const selection = window.getSelection();
            const selectionText = selection?.toString().trim() || '';
            const hasSelection = selectionText.length > 0;

            // Проверяем, что выделение внутри текстового блока задания
            const textContainer = textRef.current;
            if (hasSelection && selection && textContainer) {
                const range = selection.rangeCount > 0 ? selection.getRangeAt(0) : null;
                if (!range) return;

                // Проверяем, что выделение внутри textContainer
                const isInsideTextContainer = textContainer.contains(range.commonAncestorContainer);

                if (!isInsideTextContainer) {
                    addDebug('⚠️ Selection outside task text area, ignoring');
                    return;
                }
            }

            addDebug(`selectionchange event: hasSelection=${hasSelection}, text="${selectionText.substring(0, 30)}${selectionText.length > 30 ? '...' : ''}"`);

            // Очищаем предыдущий тайм-аут
            if (selectionTimeoutRef.current) {
                clearTimeout(selectionTimeoutRef.current);
            }

            if (hasSelection) {
                // Есть выделение - блокируем обновление
                addDebug('Setting isSelecting = true (blocking DOM update)');
                setIsSelecting(true);
            } else {
                // Выделение сброшено - разблокируем через небольшую задержку
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

    // Таймер
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

    // Форматирование времени
    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60)
            .toString()
            .padStart(2, '0');
        const s = (seconds % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    };

    // Получение позиции выделенного текста в исходной строке
    const getTextPosition = useCallback(
        (selectedText: string): { start: number; end: number } | null => {
            const trimmedSelection = selectedText.trim();
            if (!trimmedSelection) return null;

            // Ищем вхождение в исходном тексте
            let startIndex = 0;
            const allMatches: number[] = [];

            // Находим все возможные вхождения
            while (true) {
                const index = MOCK_TASK.text.indexOf(trimmedSelection, startIndex);
                if (index === -1) break;
                allMatches.push(index);
                startIndex = index + 1;
            }

            if (allMatches.length === 0) return null;

            // Если только одно совпадение - используем его
            if (allMatches.length === 1) {
                return {
                    start: allMatches[0],
                    end: allMatches[0] + trimmedSelection.length,
                };
            }

            // Если несколько совпадений, берем первое непересекающееся
            for (const matchStart of allMatches) {
                const matchEnd = matchStart + trimmedSelection.length;
                const hasOverlap = textMarkup.some(
                    (mark) =>
                        (matchStart >= mark.start && matchStart < mark.end) ||
                        (matchEnd > mark.start && matchEnd <= mark.end) ||
                        (matchStart <= mark.start && matchEnd >= mark.end)
                );

                if (!hasOverlap) {
                    return {start: matchStart, end: matchEnd};
                }
            }

            // Если все совпадения пересекаются - возвращаем null
            return null;
        },
        [textMarkup]
    );

    // Обработка выделения текста
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
                alert(
                    'Не удалось определить позицию выделенного текста или фрагмент уже выделен'
                );
                return;
            }

            const {start, end} = position;

            // Добавляем новое выделение
            const newMarkup: MarkupItemIn = {start, end, category_slug: categoryId};
            addDebug(`✅ Adding markup: ${JSON.stringify(newMarkup)}`);
            setTextMarkup((prev) => [...prev, newMarkup]);

            // Сбрасываем выделение
            addDebug('Clearing selection');
            selection.removeAllRanges();

            // Принудительно разрешаем обновление DOM
            addDebug('Force setting isSelecting = false');
            setIsSelecting(false);
        },
        [getTextPosition, addDebug]
    );

    // Применение выделений к тексту - используем React элементы вместо dangerouslySetInnerHTML
    const renderTextWithHighlights = useMemo(() => {
        if (!textMarkup.length) {
            return <span>{MOCK_TASK.text}</span>;
        }

        // Сортируем выделения по позиции начала
        const sortedMarkup = [...textMarkup].sort((a, b) => a.start - b.start);

        const elements: React.ReactNode[] = [];
        let lastIndex = 0;

        sortedMarkup.forEach((mark, sortedIndex) => {
            // Добавляем текст до выделения
            if (mark.start > lastIndex) {
                elements.push(
                    <span key={`text-${lastIndex}`}>
            {MOCK_TASK.text.slice(lastIndex, mark.start)}
          </span>
                );
            }

            // Получаем цвет для категории
            const characteristic = MOCK_TASK.characteristics.find(
                (c) => c.id === mark.category_slug
            );
            const color = characteristic?.color || 'gray';

            // Цветовые классы Tailwind
            const colorClasses: Record<string, string> = {
                blue: 'bg-blue-200 hover:bg-blue-300',
                yellow: 'bg-yellow-200 hover:bg-yellow-300',
                green: 'bg-green-200 hover:bg-green-300',
                red: 'bg-red-200 hover:bg-red-300',
                purple: 'bg-purple-200 hover:bg-purple-300',
                pink: 'bg-pink-200 hover:bg-pink-300',
            };

            const highlightClass = colorClasses[color] || 'bg-gray-200 hover:bg-gray-300';
            const highlightedPart = MOCK_TASK.text.slice(mark.start, mark.end);

            // Находим оригинальный индекс в несортированном массиве
            const originalIndex = textMarkup.findIndex(
                m => m.start === mark.start && m.end === mark.end && m.category_slug === mark.category_slug
            );

            // Добавляем выделенный текст как React элемент
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

        // Добавляем оставшийся текст
        if (lastIndex < MOCK_TASK.text.length) {
            elements.push(
                <span key={`text-${lastIndex}`}>
          {MOCK_TASK.text.slice(lastIndex)}
        </span>
            );
        }

        return <>{elements}</>;
    }, [textMarkup]);

    // Выбор вопроса
    const handleQuestionSelect = (questionId: string) => {
        if (selectedQuestions.includes(questionId)) {
            // Показываем ответ повторно
            const question = MOCK_TASK.questions.find((q) => q.id === questionId);
            if (question) {
                setChatbotAnswer(question.answer);
            }
            return;
        }

        if (selectedQuestions.length >= 3) {
            return;
        }

        setSelectedQuestions((prev) => [...prev, questionId]);
        const question = MOCK_TASK.questions.find((q) => q.id === questionId);
        if (question) {
            setChatbotAnswer(question.answer);
        }
    };

    // Автоотправка при истечении времени
    const handleAutoSubmit = () => {
        handleSubmit(false);
    };

    // Отправка формы
    const handleSubmit = async (manual: boolean = true) => {
        // Валидация
        if (manual) {
            // Проверяем, что выделено по каждой характеристике
            const missingCategories = MOCK_TASK.characteristics.filter(
                (char) => !textMarkup.some((mark) => mark.category_slug === char.id)
            );

            if (missingCategories.length > 0) {
                const categoryNames = missingCategories.map((c) => c.name).join(', ');
                alert(
                    `Необходимо выделить текст по следующим критериям: ${categoryNames}`
                );
                return;
            }

            if (selectedAnswer === null) {
                alert('Необходимо выбрать ответ.');
                return;
            }
        }

        // Подготовка данных для отправки
        const endTime = new Date();
        const spentTime = Math.floor(
            (endTime.getTime() - startTime.getTime()) / 1000
        );
        const minutes = Math.floor(spentTime / 60);
        const seconds = spentTime % 60;

        const submissionData: SubmitRequest = {
            task_id: MOCK_TASK.id,
            time_spent: `${minutes.toString().padStart(2, '0')}:${seconds
                .toString()
                .padStart(2, '0')}`,
            start_time: startTime.toISOString(),
            answer_markup: textMarkup,
            selected_question_ids: selectedQuestions,
            student_characteristics: selectedCharacteristics,
            selected_answer_id: selectedAnswer!,
        };

        console.log('Submitting data:', submissionData);

        let estimationId: number = 1;

        // TODO: Отправка на страничку просмотра попытки по id с бека
        // if (isTrainingMode) {
        //     // Режим обучения - без оценки
        //     const data = await submitEducationTask.mutateAsync(submissionData);
        //     estimationId = data.data.submission_id;
        // } else {
        //     // Режим контроля - сохраняем оценку
        //     const data = await submitControlTask.mutateAsync(submissionData);
        //     estimationId = data.data.submission_id;
        // }

        // Переход на страницу оценки с параметрами
        router.push(`/estimation/${estimationId}`);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
            {/* Header */}
            <UiHeader/>

            {/* Main Content */}
            <main className="container mx-auto px-6 py-8">
                {/* Debug Panel */}
                <div className="bg-yellow-50 border-2 border-yellow-400 rounded-lg p-4 mb-6 select-none hidden">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="font-bold text-yellow-800">🐛 Debug Panel</h3>
                        <div className="flex items-center gap-4">
                              <span className="text-sm">
                                isSelecting: <span
                                  className={`font-bold ${isSelecting ? 'text-red-600' : 'text-green-600'}`}>{isSelecting ? 'TRUE (blocked)' : 'FALSE (allowed)'}</span>
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
                            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor"
                                 viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                      d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
                            </svg>
                            <div>
                                <div className="font-semibold text-blue-800">Режим обучения</div>
                                <div className="text-sm text-blue-600">
                                    Сложность: {complexity ? COMPLEXITY_NAMES[complexity] : 'Не указана'}
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
                        <h2 className="text-lg font-bold text-slate-800 mb-4">
                            Условия задания
                        </h2>
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
                            <svg
                                className="w-5 h-5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M6 18L18 6M6 6l12 12"
                                />
                            </svg>
                            <span className="font-medium">Убрать все выделения</span>
                        </button>
                    </div>

                    {/* Right Column - Highlighting Controls */}
                    <div className="bg-white rounded-xl shadow-md p-6 border border-slate-200">
                        <h2 className="text-lg font-bold text-slate-800 mb-4">
                            Выделите фрагменты текста, характеризующие соответствующие
                            личностные качества:
                        </h2>

                        <div className="space-y-4">
                            {MOCK_TASK.characteristics.map((characteristic) => {
                                const colorClass =
                                    HIGHLIGHT_COLORS[characteristic.color] || 'bg-gray-200';
                                const buttonColorMap: Record<string, string> = {
                                    blue: 'bg-blue-500 hover:bg-blue-600',
                                    yellow: 'bg-yellow-500 hover:bg-yellow-600',
                                    green: 'bg-green-500 hover:bg-green-600',
                                    red: 'bg-red-500 hover:bg-red-600',
                                    purple: 'bg-purple-500 hover:bg-purple-600',
                                    pink: 'bg-pink-500 hover:bg-pink-600',
                                };
                                const buttonColor =
                                    buttonColorMap[characteristic.color] ||
                                    'bg-gray-500 hover:bg-gray-600';

                                return (
                                    <div key={characteristic.id} className="space-y-2">
                                        <label className="block text-sm font-medium text-slate-700">
                                            {characteristic.name}
                                        </label>
                                        <div className="flex items-center gap-4">
                                            <select
                                                value={selectedCharacteristics[characteristic.id]}
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
              <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
              >
                <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                    clipRule="evenodd"
                />
              </svg>
            </span>
                    </h2>

                    <div className="flex flex-wrap gap-2 mb-4">
                        {MOCK_TASK.questions.map((question) => {
                            const isSelected = selectedQuestions.includes(question.id);
                            const isDisabled = !isSelected && selectedQuestions.length >= 3;

                            return (
                                <button
                                    key={question.id}
                                    onClick={() => handleQuestionSelect(question.id)}
                                    disabled={isDisabled}
                                    className={`
                                                px-4 py-2 rounded-lg font-medium transition-all
                                                ${isSelected ? 'bg-blue-600 text-white shadow-md'
                                        : isDisabled
                                            ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                                            : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                                    } `}
                                >
                                    {question.text}
                                </button>
                            );
                        })}
                    </div>

                    <div className="mt-4">
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Чат-бот
                        </label>
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
                        {MOCK_TASK.answerOptions.map((option) => (
                            <button
                                key={option.id}
                                onClick={() => setSelectedAnswer(option.id)}
                                className={`
                  px-6 py-4 rounded-xl font-semibold text-lg transition-all
                  ${
                                    selectedAnswer === option.id
                                        ? 'bg-blue-600 text-white shadow-xl scale-105'
                                        : 'bg-white text-blue-600 border-2 border-blue-600 hover:bg-blue-50'
                                }
                `}
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
                        className="bg-blue-600 hover:bg-blue-700 text-white px-12 py-4 rounded-xl font-semibold text-lg transition-all shadow-lg hover:shadow-xl"
                    >
                        Проверить
                    </Button>
                </div>
            </main>
        </div>
    );
}