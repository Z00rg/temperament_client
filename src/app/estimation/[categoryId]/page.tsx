'use client';

import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/shared/ui/Button';
import { UiHeader } from '@/shared/ui/ui-header';
import { useEstimationQuery } from '@/entities/estimation'; // путь к хуку
import {
    MarkupItemOut,
    QuestionOut,
} from '@/shared/api/generated';

// Цвет оценки
function gradeColor(grade: string) {
    switch (grade) {
        case 'Отлично':           return 'text-emerald-600';
        case 'Хорошо':            return 'text-blue-600';
        case 'Удовлетворительно': return 'text-amber-600';
        default:                  return 'text-red-600';
    }
}

// Рендер текста с выделениями (style — Tailwind-класс, например "bg-blue-200")
function TextWithHighlights({ text, markup }: { text: string; markup: MarkupItemOut[] }) {
    if (!markup.length) return <span>{text}</span>;

    const sorted = [...markup].sort((a, b) => a.start - b.start);
    const nodes: React.ReactNode[] = [];
    let last = 0;

    sorted.forEach((mark, i) => {
        if (mark.start > last) {
            nodes.push(<span key={`t-${last}`}>{text.slice(last, mark.start)}</span>);
        }
        nodes.push(
            <mark key={`m-${i}`} className={`${mark.style} px-0.5 py-0.5 rounded`}>
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

// Вычисляем «недостающие» вопросы: есть в correctQuestions, но нет в studentQuestions
function missingQuestions(student: QuestionOut[], correct: QuestionOut[]): QuestionOut[] {
    const studentIds = new Set(student.map((q) => q.id));
    return correct.filter((q) => !studentIds.has(q.id));
}

// ─── Компонент страницы ───────────────────────────────────────────────────────
export default function EstimationPage() {
    const router = useRouter();
    const params = useParams();

    // id попытки из URL: /estimation/[id]
    // TODO: баг - некорректный динамический параметр в ссылке
    // 1. Берем правильное имя параметра (замените 'id', если папка называется иначе)
    const rawId = params?.categoryId;

    const idString = Array.isArray(rawId) ? rawId[0] : rawId;

    // 2. Если idString нет, пусть будет NaN, чтобы проверка ниже отработала корректно
    const estimationId = idString ? parseInt(idString, 10) : NaN;

    // 3. Проверяем, что это действительно число и оно больше нуля (id в БД обычно > 0)
    const isValidId = !isNaN(estimationId) && estimationId > 0;

    const useEstimation = useEstimationQuery(estimationId, isValidId);
    const data = useEstimation?.data;
    const isLoading = useEstimation.isPending;
    const isError = useEstimation.isError;

    // ── Loading / Error ────────────────────────────────────────────────────────
    // Измените логику отображения окон:
    if (!isValidId) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
                <div className="text-center space-y-3">
                    <p className="text-xl text-red-500 font-semibold">Некорректный идентификатор попытки</p>
                    <Button onPress={() => router.push('/')} className="bg-slate-600 text-white px-6 py-2 rounded-lg">
                        На главную
                    </Button>
                </div>
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
                <p className="text-xl text-slate-500 animate-pulse">Загрузка результатов…</p>
            </div>
        );
    }

    if (isError || !data) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
                <div className="text-center space-y-3">
                    <p className="text-xl text-red-500 font-semibold">Не удалось загрузить результаты</p>
                    <Button onPress={() => router.push('/')} className="bg-slate-600 text-white px-6 py-2 rounded-lg">
                        На главную
                    </Button>
                </div>
            </div>
        );
    }

    const missing = missingQuestions(data.studentQuestions, data.correctQuestions);
    const answerIsCorrect = data.studentAnswer.id === data.correctAnswer.id;

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
            <UiHeader />

            <main className="container mx-auto px-4 sm:px-6 py-10 max-w-7xl space-y-6">

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
                    {/* Студент */}
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

                    {/* Эталон */}
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
                            const isCorrect =
                                char.studentCharacteristics === char.correctCharacteristics;

                            // Цвет плашки под цвет разметки
                            const chipBg: Record<string, string> = {
                                blue:   'bg-blue-50   border-blue-200',
                                yellow: 'bg-yellow-50 border-yellow-200',
                                green:  'bg-green-50  border-green-200',
                                red:    'bg-red-50    border-red-200',
                                purple: 'bg-purple-50 border-purple-200',
                                pink:   'bg-pink-50   border-pink-200',
                            };

                            return (
                                <div
                                    key={i}
                                    className={`flex flex-wrap items-center justify-between gap-4 rounded-lg border px-4 py-3 ${chipBg[char.color] ?? 'bg-slate-50 border-slate-200'}`}
                                >
                                    <span className="font-medium text-slate-700 text-sm">{char.name}</span>

                                    <div className="flex items-center gap-4 text-sm">
                                        {/* Ответ студента */}
                                        <div className="text-right">
                                            <div className="text-xs text-slate-400 mb-0.5">Ваш выбор</div>
                                            <div className={`font-semibold ${isCorrect ? 'text-emerald-600' : 'text-red-600'}`}>
                                                {char.studentCharacteristics ?? '—'}
                                                {isCorrect ? ' ✓' : ' ✗'}
                                            </div>
                                        </div>

                                        {/* Эталон (показываем только если ошибся) */}
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
                    {/* Заданные вопросы */}
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

                    {/* Недостающие вопросы */}
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
                        onPress={() => window.history.go(-2)}
                        className="bg-slate-600 hover:bg-slate-700 text-white px-8 py-3 rounded-xl font-semibold transition-all shadow-md"
                    >
                        Вернуться к инструкциям
                    </Button>
                    <Button
                        onPress={() => router.back()}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-semibold transition-all shadow-md"
                    >
                        Пройти контроль ещё раз
                    </Button>
                </div>
            </main>
        </div>
    );
}