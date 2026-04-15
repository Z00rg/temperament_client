'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/shared/ui/Button';
import {UiHeader} from "@/shared/ui/ui-header";

// Типы данных
interface TextMarkup {
    start: number;
    end: number;
    category: string;
}

interface Characteristic {
    id: string;
    name: string;
    color: string;
}

interface Question {
    id: string;
    question: string;
    answer: string;
}

interface EstimationData {
    grade: string;
    time: string;
    studentAnswer: number;
    correctAnswer: number;
    text: string;
    studentMarkup: TextMarkup[];
    correctMarkup: TextMarkup[];
    studentCharacteristics: Record<string, string>;
    correctCharacteristics: Record<string, string>;
    characteristics: Characteristic[];
    extraDataNote?: string; // Лишние данные от преподавателя
    missingQuestions: Question[]; // Недостающие вопросы (1-3)
    answerOptions: string[]; // ["Флегматик", "Сангвиник", ...]
}

// Тестовые данные оценки (имитация ответа от бэка)
// TODO: переделать под типизацию с бэка
const MOCK_ESTIMATION: EstimationData = {
    grade: 'Хорошо',
    time: '08:45',
    studentAnswer: 2, // Сангвиник
    correctAnswer: 1, // Флегматик
    text: 'Студент Петров активно участвует в общественной жизни университета. Он быстро адаптируется к новым условиям и легко находит общий язык с окружающими. В стрессовых ситуациях сохраняет спокойствие и рассудительность. Его эмоции стабильны, он редко выходит из себя. При этом он может долго работать над одной задачей, проявляя упорство и настойчивость.',
    studentMarkup: [
        { start: 15, end: 45, category: 'strength' },
        { start: 170, end: 200, category: 'balance' },
        { start: 116, end: 145, category: 'mobility' },
    ],
    correctMarkup: [
        { start: 15, end: 62, category: 'strength' },
        { start: 170, end: 230, category: 'balance' },
        { start: 85, end: 145, category: 'mobility' },
    ],
    studentCharacteristics: {
        strength: 'strong',
        balance: 'balanced',
        mobility: 'mobile',
    },
    correctCharacteristics: {
        strength: 'strong',
        balance: 'balanced',
        mobility: 'inert', // Студент ошибся
    },
    characteristics: [
        { id: 'strength', name: 'Сила нервной системы', color: 'blue' },
        { id: 'balance', name: 'Уравновешенность', color: 'yellow' },
        { id: 'mobility', name: 'Подвижность', color: 'green' },
    ],
    extraDataNote: 'Обратите внимание на темп речи и скорость принятия решений',
    missingQuestions: [
        {
            id: 'q1',
            question: 'Как быстро включается в работу?',
            answer: 'Студент быстро адаптируется к новым условиям',
        },
        {
            id: 'q2',
            question: 'Как проявляет себя в ответственных ситуациях?',
            answer: 'В стрессовых ситуациях сохраняет спокойствие',
        },
    ],
    answerOptions: ['Флегматик', 'Сангвиник', 'Холерик', 'Меланхолик'],
};

// Опции характеристик для отображения
const CHARACTERISTIC_OPTIONS: Record<string, Record<string, string>> = {
    strength: {
        strong: 'Сила',
        weak: 'Слабость',
    },
    balance: {
        balanced: 'Уравновешенность',
        unbalanced: 'Неуравновешенность',
    },
    mobility: {
        mobile: 'Подвижность',
        inert: 'Инертность',
    },
};

export default function EstimationPage() {
    const router = useRouter();
    const params = useParams();
    const categoryId = params.categoryId as string;

    const [estimationData, setEstimationData] = useState<EstimationData | null>(
        null
    );

    useEffect(() => {
        // В реальности получаем с бэка, сейчас берем из localStorage или MOCK
        const storedData = localStorage.getItem('taskSubmission');

        if (storedData) {
            // Обработка данных из localStorage (пока используем MOCK)
            setEstimationData(MOCK_ESTIMATION);
        } else {
            setEstimationData(MOCK_ESTIMATION);
        }

        // Предотвращение возврата назад
        const handlePopState = () => {
            router.push(`/description/${categoryId}`);
        };

        window.history.pushState(null, '', window.location.href);
        window.addEventListener('popstate', handlePopState);

        return () => {
            window.removeEventListener('popstate', handlePopState);
        };
    }, [categoryId, router]);

    const handleBackToInstructions = () => {
        localStorage.removeItem('taskSubmission');
        localStorage.removeItem('estimationInfo');
        router.push(`/description/${categoryId}`);
    };

    const handleRetakeControl = () => {
        localStorage.removeItem('taskSubmission');
        localStorage.removeItem('estimationInfo');
        router.push(`/task/${categoryId}`);
    };

    // Рендер текста с выделениями
    const renderTextWithHighlights = (markup: TextMarkup[], text: string) => {
        if (!markup.length) {
            return <span>{text}</span>;
        }

        const sortedMarkup = [...markup].sort((a, b) => a.start - b.start);
        const elements: React.ReactNode[] = [];
        let lastIndex = 0;

        sortedMarkup.forEach((mark, index) => {
            if (mark.start > lastIndex) {
                elements.push(
                    <span key={`text-${lastIndex}`}>{text.slice(lastIndex, mark.start)}</span>
                );
            }

            const characteristic = estimationData?.characteristics.find(
                (c) => c.id === mark.category
            );
            const color = characteristic?.color || 'gray';

            const colorClasses: Record<string, string> = {
                blue: 'bg-blue-200',
                yellow: 'bg-yellow-200',
                green: 'bg-green-200',
                red: 'bg-red-200',
                purple: 'bg-purple-200',
                pink: 'bg-pink-200',
            };

            const highlightClass = colorClasses[color] || 'bg-gray-200';
            const highlightedPart = text.slice(mark.start, mark.end);

            elements.push(
                <mark key={`mark-${index}`} className={`${highlightClass} px-1 py-0.5 rounded`}>
                    {highlightedPart}
                </mark>
            );

            lastIndex = mark.end;
        });

        if (lastIndex < text.length) {
            elements.push(<span key={`text-${lastIndex}`}>{text.slice(lastIndex)}</span>);
        }

        return <>{elements}</>;
    };

    if (!estimationData) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <p className="text-xl text-slate-600">Загрузка результатов...</p>
                </div>
            </div>
        );
    }

    // Определение цвета оценки
    const gradeColor =
        estimationData.grade === 'Отлично'
            ? 'text-green-600'
            : estimationData.grade === 'Хорошо'
                ? 'text-blue-600'
                : estimationData.grade === 'Удовлетворительно'
                    ? 'text-yellow-600'
                    : 'text-red-600';

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
            {/* Header */}
            <UiHeader/>

            {/* Main Content */}
            <main className="container mx-auto px-6 py-12 max-w-7xl">
                {/* Grade and Time */}
                <div className="bg-white rounded-xl shadow-md p-8 mb-6 border border-slate-200">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <span className="text-lg text-slate-600">Ваша оценка: </span>
                            <span className={`text-2xl font-bold ${gradeColor}`}>
                {estimationData.grade}
              </span>
                        </div>
                        <div>
                            <span className="text-lg text-slate-600">Ваше время: </span>
                            <span className="text-2xl font-bold text-slate-800">
                {estimationData.time}
              </span>
                        </div>
                    </div>
                </div>

                {/* Student Answer vs Correct Answer */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                    {/* Student Answer */}
                    <div className="bg-white rounded-xl shadow-md p-6 border border-slate-200">
                        <h2 className="text-lg font-bold text-slate-800 mb-4">
                            Ваш ответ:{' '}
                            <span
                                className={
                                    estimationData.studentAnswer === estimationData.correctAnswer
                                        ? 'text-green-600'
                                        : 'text-red-600'
                                }
                            >
                {estimationData.answerOptions[estimationData.studentAnswer - 1]}
              </span>
                        </h2>
                        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 text-slate-700 leading-relaxed min-h-[200px]">
                            {renderTextWithHighlights(
                                estimationData.studentMarkup,
                                estimationData.text
                            )}
                        </div>
                    </div>

                    {/* Correct Answer */}
                    <div className="bg-white rounded-xl shadow-md p-6 border border-slate-200">
                        <h2 className="text-lg font-bold text-slate-800 mb-4">
                            Эталон ответа:{' '}
                            <span className="text-green-600">
                {estimationData.answerOptions[estimationData.correctAnswer - 1]}
              </span>
                        </h2>
                        <div className="bg-green-50 p-4 rounded-lg border border-green-200 text-slate-700 leading-relaxed min-h-[200px]">
                            {renderTextWithHighlights(
                                estimationData.correctMarkup,
                                estimationData.text
                            )}
                        </div>
                    </div>
                </div>

                {/* Characteristics Comparison */}
                <div className="bg-white rounded-xl shadow-md p-6 mb-6 border border-slate-200">
                    <h2 className="text-lg font-bold text-slate-800 mb-4">
                        Выбранные характеристики
                    </h2>
                    <div className="space-y-4">
                        {estimationData.characteristics.map((char) => {
                            const studentValue =
                                estimationData.studentCharacteristics[char.id];
                            const correctValue =
                                estimationData.correctCharacteristics[char.id];
                            const isCorrect = studentValue === correctValue;

                            const colorClasses: Record<string, string> = {
                                blue: 'bg-blue-100 border-blue-300',
                                yellow: 'bg-yellow-100 border-yellow-300',
                                green: 'bg-green-100 border-green-300',
                            };
                            const colorClass = colorClasses[char.color] || 'bg-gray-100';

                            return (
                                <div
                                    key={char.id}
                                    className={`p-4 rounded-lg border-2 ${colorClass}`}
                                >
                                    <div className="flex items-center justify-between">
                                        <div>
                      <span className="font-semibold text-slate-800">
                        {char.name}:
                      </span>
                                        </div>
                                        <div className="flex items-center gap-6">
                                            <div className="text-right">
                                                <div className="text-sm text-slate-600">Ваш выбор:</div>
                                                <div
                                                    className={`font-semibold ${
                                                        isCorrect ? 'text-green-600' : 'text-red-600'
                                                    }`}
                                                >
                                                    {CHARACTERISTIC_OPTIONS[char.id]?.[studentValue] ||
                                                        studentValue}
                                                    {!isCorrect && ' ✗'}
                                                    {isCorrect && ' ✓'}
                                                </div>
                                            </div>
                                            {!isCorrect && (
                                                <div className="text-right">
                                                    <div className="text-sm text-slate-600">Эталон:</div>
                                                    <div className="font-semibold text-green-600">
                                                        {CHARACTERISTIC_OPTIONS[char.id]?.[correctValue] ||
                                                            correctValue}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Extra Data and Missing Questions */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                    {/* Extra Data Note */}
                    {estimationData.extraDataNote && (
                        <div className="bg-orange-50 rounded-xl shadow-md p-6 border-2 border-orange-300">
                            <h3 className="text-lg font-bold text-orange-800 mb-3">
                                Лишние данные
                            </h3>
                            <p className="text-slate-700">{estimationData.extraDataNote}</p>
                        </div>
                    )}

                    {/* Missing Questions */}
                    {estimationData.missingQuestions.length > 0 && (
                        <div className="bg-red-50 rounded-xl shadow-md p-6 border-2 border-red-300">
                            <h3 className="text-lg font-bold text-red-800 mb-3">
                                Недостающие данные (вопросы, которые нужно было задать)
                            </h3>
                            <div className="space-y-3">
                                {estimationData.missingQuestions.map((q) => (
                                    <div
                                        key={q.id}
                                        className="bg-white p-3 rounded border border-red-200"
                                    >
                                        <div className="font-semibold text-slate-800 mb-1">
                                            В: {q.question}
                                        </div>
                                        <div className="text-slate-600 text-sm">О: {q.answer}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Button
                        onPress={handleBackToInstructions}
                        className="bg-slate-600 hover:bg-slate-700 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all shadow-lg"
                    >
                        Вернуться к инструкциям
                    </Button>
                    <Button
                        onPress={handleRetakeControl}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all shadow-lg"
                    >
                        Пройти контроль еще раз
                    </Button>
                </div>
            </main>
        </div>
    );
}