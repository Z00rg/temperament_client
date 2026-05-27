'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/shared/ui/Button';
import { UiHeader } from '@/shared/ui/ui-header';
import { EvaluationResult, MarkupItemOut, QuestionOut } from '@/shared/api/generated';

// ─── Цветовые маппинги (по ключу) ────────────────────────────────────────────

const COLOR_HIGHLIGHT: Record<string, string> = {
    blue:   'bg-blue-200',
    yellow: 'bg-yellow-200',
    green:  'bg-green-200',
    red:    'bg-red-200',
    purple: 'bg-purple-200',
    pink:   'bg-pink-200',
};

const COLOR_CHIP: Record<string, string> = {
    blue:   'bg-blue-50   border-blue-200',
    yellow: 'bg-yellow-50 border-yellow-200',
    green:  'bg-green-50  border-green-200',
    red:    'bg-red-50    border-red-200',
    purple: 'bg-purple-50 border-purple-200',
    pink:   'bg-pink-50   border-pink-200',
};

function extractColorKey(color: string): string {
    const match = color?.match(/bg-(\w+)-\d+/);
    return match ? match[1] : (color ?? '');
}

function gradeColor(grade: string) {
    switch (grade) {
        case 'Отлично':           return 'text-emerald-600';
        case 'Хорошо':            return 'text-blue-600';
        case 'Удовлетворительно': return 'text-amber-600';
        default:                  return 'text-red-600';
    }
}

function TextWithHighlights({ text, markup }: { text: string; markup: MarkupItemOut[] }) {
    if (!markup.length) return <span>{text}</span>;

    const sorted = [...markup].sort((a, b) => a.start - b.start);
    const nodes: React.ReactNode[] = [];
    let last = 0;

    sorted.forEach((mark, i) => {
        if (mark.start > last) {
            nodes.push(<span key={`t-${last}`}>{text.slice(last, mark.start)}</span>);
        }
        const colorKey = extractColorKey(mark.style);
        const highlightClass = COLOR_HIGHLIGHT[colorKey] ?? 'bg-gray-200';
        nodes.push(
            <mark key={`m-${i}`} className={`${highlightClass} px-0.5 py-0.5 rounded`}>
                {text.slice(mark.start, mark.end)}
            </mark>
        );
        last = mark.end;
    });

    if (last < text.length) {
        nodes.push(<span key={`t-${last}`}>{text.slice(last)}</span>);
    }

    return <>{nodes}</>;
}

function missingQuestions(student: QuestionOut[], correct: QuestionOut[]): QuestionOut[] {
    const studentIds = new Set(student.map((q) => q.id));
    return correct.filter((q) => !studentIds.has(q.id));
}

// ─── Компонент страницы ───────────────────────────────────────────────────────

export default function EducationEstimationPage() {
    const router = useRouter();
    const [data, setData] = useState<EvaluationResult | null>(null);

    useEffect(() => {
        const raw = localStorage.getItem('educationResult');
        if (raw) {
            try {
                setData(JSON.parse(raw));
            } catch {
                router.push('/');
            }
        } else {
            router.push('/');
        }
        // return убираем полностью
    }, []);

    if (!data) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
                <p className="text-xl text-slate-500 animate-pulse">Загрузка результатов…</p>
            </div>
        );
    }

    const missing = missingQuestions(data.studentQuestions, data.correctQuestions);
    const answerIsCorrect = data.studentAnswer.id === data.correctAnswer.id;

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
            <UiHeader />

            <main className="container mx-auto px-4 sm:px-6 py-10 max-w-7xl space-y-6">

                {/* Индикатор режима обучения */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center gap-3">
                        <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
                        </svg>
                        <div>
                            <div className="font-semibold text-blue-800">Режим обучения</div>
                            <div className="text-sm text-blue-600">Результат не сохраняется в ведомость</div>
                        </div>
                    </div>
                </div>

                {/* ── Оценка и время ──────────────────────────────────────────── */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                    <div className="flex flex-wrap gap-6 items-center">
                        <div>
                            <span className="text-sm text-slate-500 block mb-0.5">Ваша оценка</span>
                            <span className={`text-3xl font-bold ${gradeColor(data.grade)}`}>
                                {data.grade}
                            </span>
                        </div>
                        <div className="w-px h-10 bg-slate-200 hidden sm:block" />
                        <div>
                            <span className="text-sm text-slate-500 block mb-0.5">Затраченное время</span>
                            <span className="text-3xl font-bold text-slate-800">{data.spent_time}</span>
                        </div>
                    </div>
                </div>

                {/* ── Тексты с разметкой ──────────────────────────────────────── */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col gap-3">
                        <div className="flex items-center justify-between">
                            <h2 className="text-base font-bold text-slate-700">Ваш ответ</h2>
                            <span className={`text-sm font-semibold px-3 py-1 rounded-full ${
                                answerIsCorrect
                                    ? 'bg-emerald-100 text-emerald-700'
                                    : 'bg-red-100 text-red-700'
                            }`}>
                                {data.studentAnswer.text}
                                {answerIsCorrect ? ' ✓' : ' ✗'}
                            </span>
                        </div>
                        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 text-slate-700 leading-relaxed min-h-[160px] text-sm">
                            <TextWithHighlights text={data.text} markup={data.studentMarkup} />
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col gap-3">
                        <div className="flex items-center justify-between">
                            <h2 className="text-base font-bold text-slate-700">Эталон ответа</h2>
                            <span className="text-sm font-semibold px-3 py-1 rounded-full bg-emerald-100 text-emerald-700">
                                {data.correctAnswer.text} ✓
                            </span>
                        </div>
                        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 text-slate-700 leading-relaxed min-h-[160px] text-sm">
                            <TextWithHighlights text={data.text} markup={data.correctMarkup} />
                        </div>
                    </div>
                </div>

                {/* ── Характеристики ──────────────────────────────────────────── */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                    <h2 className="text-base font-bold text-slate-700 mb-4">Характеристики</h2>
                    <div className="space-y-3">
                        {data.characteristics.map((char, i) => {
                            const isCorrect = char.studentCharacteristics === char.correctCharacteristics;
                            const colorKey = extractColorKey(char.color);
                            const chipClass = COLOR_CHIP[colorKey] ?? 'bg-slate-50 border-slate-200';

                            return (
                                <div
                                    key={i}
                                    className={`flex flex-wrap items-center justify-between gap-4 rounded-lg border px-4 py-3 ${chipClass}`}
                                >
                                    <span className="font-medium text-slate-700 text-sm">{char.name}</span>

                                    <div className="flex items-center gap-4 text-sm">
                                        <div className="text-right">
                                            <div className="text-xs text-slate-400 mb-0.5">Ваш выбор</div>
                                            <div className={`font-semibold ${isCorrect ? 'text-emerald-600' : 'text-red-600'}`}>
                                                {char.studentCharacteristics ?? '—'}
                                                {isCorrect ? ' ✓' : ' ✗'}
                                            </div>
                                        </div>

                                        {!isCorrect && (
                                            <>
                                                <div className="w-px h-8 bg-slate-200" />
                                                <div className="text-right">
                                                    <div className="text-xs text-slate-400 mb-0.5">Эталон</div>
                                                    <div className="font-semibold text-emerald-600">
                                                        {char.correctCharacteristics ?? '—'}
                                                    </div>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* ── Вопросы ─────────────────────────────────────────────────── */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                        <h2 className="text-base font-bold text-slate-700 mb-4">
                            Заданные вами вопросы
                            <span className="ml-2 text-sm font-normal text-slate-400">
                                ({data.studentQuestions.length})
                            </span>
                        </h2>
                        {data.studentQuestions.length === 0 ? (
                            <p className="text-slate-400 text-sm">Вопросы не задавались</p>
                        ) : (
                            <div className="space-y-2">
                                {data.studentQuestions.map((q) => {
                                    const inCorrect = data.correctQuestions.some((cq) => cq.id === q.id);
                                    return (
                                        <div
                                            key={q.id}
                                            className={`rounded-lg border p-3 text-sm ${
                                                inCorrect
                                                    ? 'bg-emerald-50 border-emerald-200'
                                                    : 'bg-orange-50 border-orange-200'
                                            }`}
                                        >
                                            <div className="font-medium text-slate-700 mb-1">В: {q.question}</div>
                                            <div className="text-slate-500">О: {q.answer}</div>
                                            {!inCorrect && (
                                                <div className="text-orange-600 text-xs mt-1 font-medium">
                                                    ⚠ Этот вопрос лишний — он не нужен для решения
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {missing.length > 0 && (
                        <div className="bg-red-50 rounded-xl shadow-sm border-2 border-red-200 p-6">
                            <h2 className="text-base font-bold text-red-700 mb-4">
                                Недостающие вопросы
                                <span className="ml-2 text-sm font-normal text-red-400">
                                    ({missing.length})
                                </span>
                            </h2>
                            <div className="space-y-2">
                                {missing.map((q) => (
                                    <div
                                        key={q.id}
                                        className="bg-white rounded-lg border border-red-200 p-3 text-sm"
                                    >
                                        <div className="font-medium text-slate-700 mb-1">В: {q.question}</div>
                                        <div className="text-slate-500">О: {q.answer}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* ── Кнопки ──────────────────────────────────────────────────── */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center pt-2">
                    <Button
                        onPress={() => {
                            localStorage.removeItem('educationResult');
                            router.push('/');
                        }}
                        className="bg-slate-600 hover:bg-slate-700 text-white px-8 py-3 rounded-xl font-semibold transition-all shadow-md"
                    >
                        Вернуться на главную
                    </Button>
                    <Button
                        onPress={() => {
                            localStorage.removeItem('educationResult');
                            router.back();
                        }}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-semibold transition-all shadow-md"
                    >
                        Пройти обучение ещё раз
                    </Button>
                </div>
            </main>
        </div>
    );
}