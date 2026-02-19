'use client';

import {useRouter, useParams} from 'next/navigation';
import {Button} from '@/shared/ui/Button';
import {UiHeader} from "@/shared/ui/ui-header";
import {UiTextArea} from "@/shared/ui/ui-textarea";
import {UiModal} from '@/shared/ui/UiModal';


// Данные о тренажерах с описаниями
const TRAINERS_INFO = {
    "1": {
        title: 'Определение темперамента по И.П. Павлову',
        description:
            'Данный сервис предназначен для обучения студентов определению темперамента человека по классификации И.П. Павлова, основанной на 4-х типах высшей нервной деятельности:',
        trainingRoute: '/task',
        controlRoute: '/task',
    },
    "2": {
        title: 'Работа с экономическими задачами',
        description:
            'Данный сервис предназначен для тестирования студентов по проблемам решения экономических задач.',
        trainingRoute: '/task',
        controlRoute: '/task',
    },
};

// Уровни сложности
const COMPLEXITY_LEVELS = [
    { id: 1, name: 'А+Б-', description: 'Достаточная информация, нет лишней', color: 'bg-green-100 hover:bg-green-200 border-green-300' },
    { id: 2, name: 'А+Б+', description: 'Достаточная информация, есть лишняя', color: 'bg-blue-100 hover:bg-blue-200 border-blue-300' },
    { id: 3, name: 'А-Б-', description: 'Недостаточная информация, нет лишней', color: 'bg-red-100 hover:bg-red-200 border-red-300' },
    { id: 4, name: 'А-Б+', description: 'Недостаточная информация, есть лишняя', color: 'bg-yellow-100 hover:bg-yellow-200 border-yellow-300' },
];

export default function DescriptionPage() {
    const router = useRouter();
    const params = useParams();
    const testId = params.testId as string;

    // Получаем информацию о тренажере по ID
    const trainerInfo =
        TRAINERS_INFO[testId as keyof typeof TRAINERS_INFO] || null;

    const handleStartTrainingWithComplexity = (complexityId: number, closeModal: () => void) => {
        if (trainerInfo?.trainingRoute) {
            // Переход на страницу задания с параметрами: mode=training, complexity=1-4
            router.push(`${trainerInfo.trainingRoute}/${testId}?mode=training&complexity=${complexityId}`);
            closeModal();
        }
    };

    const handleStartControl = () => {
        if (trainerInfo?.controlRoute) {
            // Переход на страницу задания с параметром mode=control
            router.push(`${trainerInfo.controlRoute}/${testId}?mode=control`);
        }
    };

    const handleBack = () => {
        router.push('/');
    };

    if (!trainerInfo) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-slate-800 mb-4">
                        Тренажер не найден
                    </h1>
                    <Button
                        onPress={handleBack}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg"
                    >
                        Вернуться к выбору
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
            {/* Header */}
            <UiHeader/>

            {/* Main Content */}
            <main className="container mx-auto px-6 py-12 max-w-5xl">
                {/* Description Card */}
                <UiTextArea children={trainerInfo.description}/>

                {/* Action Buttons */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    {/* Training Mode */}
                    <div className="bg-white rounded-xl shadow-md p-6 border border-slate-200">
                        <UiModal
                            button={
                                <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-4 rounded-lg font-semibold text-lg transition-all shadow-md hover:shadow-lg mb-4">
                                    Начать обучение
                                </Button>
                            }
                        >
                            {({close}) => (
                                <div className="p-6 max-w-2xl">
                                    {/* Крестик закрытия */}
                                    <button
                                        onClick={close}
                                        className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                                        aria-label="Закрыть"
                                    >
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>

                                    <h3 className="text-2xl font-bold mb-2 text-slate-800">
                                        Выберите уровень сложности
                                    </h3>
                                    <p className="text-slate-600 mb-6">
                                        Выберите один из четырех уровней сложности для начала обучения
                                    </p>

                                    <div className="grid grid-cols-1 gap-3">
                                        {COMPLEXITY_LEVELS.map((level) => (
                                            <button
                                                key={level.id}
                                                onClick={() => handleStartTrainingWithComplexity(level.id, close)}
                                                className={`${level.color} border-2 rounded-xl p-4 text-left transition-all hover:shadow-md`}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <div className="text-lg font-bold text-slate-800 mb-1">
                                                            {level.name}
                                                        </div>
                                                        <div className="text-sm text-slate-600">
                                                            {level.description}
                                                        </div>
                                                    </div>
                                                    <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                    </svg>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </UiModal>
                        <p className="text-slate-600 text-center leading-relaxed">
                            В режиме обучение Вы постепенно обучаетесь решать задачи разного
                            уровня сложности
                        </p>
                    </div>

                    {/* Control Mode */}
                    <div className="bg-white rounded-xl shadow-md p-6 border border-slate-200">
                        <Button
                            onPress={handleStartControl}
                            className="w-full bg-white hover:bg-blue-50 text-blue-600 border-2 border-blue-600 px-6 py-4 rounded-lg font-semibold text-lg transition-all shadow-md hover:shadow-lg mb-4"
                        >
                            Контроль
                        </Button>
                        <p className="text-slate-600 text-center leading-relaxed">
                            В режиме "Контроль" Вам выдается случайное задание, которое
                            необходимо решить за ограниченное время
                        </p>
                    </div>
                </div>

                {/* Back Button */}
                <div className="flex justify-center">
                    <Button
                        onPress={handleBack}
                        className="bg-slate-600 hover:bg-slate-700 text-white px-8 py-3 rounded-lg font-medium transition-colors shadow-sm"
                    >
                        ← Вернуться к выбору тренажера
                    </Button>
                </div>
            </main>
        </div>
    );
}