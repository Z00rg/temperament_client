'use client';

import {useRouter, useParams} from 'next/navigation';
import {Button} from '@/shared/ui/Button';
import {UiHeader} from "@/shared/ui/ui-header";
import {UiTextArea} from "@/shared/ui/ui-textarea";


// Данные о тренажерах с описаниями
const TRAINERS_INFO = {
    "1": {
        title: 'Определение темперамента по И.П. Павлову',
        description:
            'Данный сервис предназначен для обучения студентов определению темперамента человека по классификации И.П. Павлова, основанной на 4-х типах высшей нервной деятельности:',
        trainingRoute: '/first-train-task',
        controlRoute: '/task',
    },
    "2": {
        title: 'Работа с экономическими задачами',
        description:
            'Данный сервис предназначен для тестирования студентов по проблемам решения экономических задач.',
        trainingRoute: '/first-train-task-triz',
        controlRoute: '/task-triz',
    },
};

export default function DescriptionPage() {
    const router = useRouter();
    const params = useParams();
    const testId = params.testId as string;

    // Получаем информацию о тренажере по ID
    const trainerInfo =
        TRAINERS_INFO[testId as keyof typeof TRAINERS_INFO] || null;

    const handleStartTraining = () => {
        if (trainerInfo?.trainingRoute) {
            router.push(`${trainerInfo.trainingRoute}/${testId}`);
        }
    };

    const handleStartControl = () => {
        if (trainerInfo?.controlRoute) {
            router.push(`${trainerInfo.controlRoute}/${testId}`);
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
                        <Button
                            onPress={handleStartTraining}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-4 rounded-lg font-semibold text-lg transition-all shadow-md hover:shadow-lg mb-4"
                        >
                            Начать обучение
                        </Button>
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