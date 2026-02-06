'use client';

import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/shared/ui/Button';
import {UiHeader} from "@/shared/ui/ui-header";


// Данные о тренажерах с описаниями
const TRAINERS_INFO = {
    "1" : {
        title: 'Определение темперамента по И.П. Павлову',
        description:
            'Данный сервис предназначен для обучения студентов определению темперамента человека по классификации И.П. Павлова, основанной на 4-х типах высшей нервной деятельности:',
        types: ['Флегматик', 'Сангвиник', 'Холерик', 'Меланхолик'],
        instructions: [
            'Вам будет выдано задание, содержащее описание поведения человека.',
            'Необходимо определить тип темперамента человека по классификации И.П. Павлова в зависимости от проявления личностных качеств в его поведении.',
            'Необходимо выявить характеристики разных видов темперамента: сила, уравновешенность и подвижность нервной системы.',
            'Задание может содержать недостаточные и избыточные сведения.',
            'В случае, если вам потребуется подсказки, вы можете воспользоваться чат-ботом, однако излишнее обращение к нему нежелательно.',
        ],
        note: 'Оценка выставляется по последней попытке в режиме "Контроль", данные в режиме "Обучение" не учитываются.',
        trainingRoute: '/first-train-task',
        controlRoute: '/task',
    },
    "2" : {
        title: 'Работа с экономическими задачами',
        description:
            'Данный сервис предназначен для тестирования студентов по проблемам решения экономических задач.',
        types: [],
        instructions: [
            'Вам будет выдано задание по экономике.',
            'Необходимо применить методы теории решения изобретательских задач.',
            'Задание может содержать недостаточные и избыточные сведения.',
        ],
        note: 'Оценка выставляется по последней попытке в режиме "Контроль".',
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
                <div className="bg-white rounded-xl shadow-md p-8 mb-8 border border-slate-200">
                    <p className="text-slate-700 text-lg leading-relaxed mb-4">
                        {trainerInfo.description}
                    </p>

                    {/* Types List (if available) */}
                    {trainerInfo.types.length > 0 && (
                        <ul className="space-y-2 mb-6">
                            {trainerInfo.types.map((type, index) => (
                                <li key={index} className="text-slate-700 text-lg">
                                    <span className="font-semibold">{index + 1}.</span>
                                    <span className="ml-4">{type}</span>
                                </li>
                            ))}
                        </ul>
                    )}

                    {/* Instructions */}
                    <div className="space-y-4 mt-6">
                        {trainerInfo.instructions.map((instruction, index) => (
                            <p key={index} className="text-slate-700 leading-relaxed">
                                {instruction}
                            </p>
                        ))}
                    </div>

                    {/* Note */}
                    {trainerInfo.note && (
                        <div className="mt-6 p-4 bg-blue-50 border-l-4 border-blue-600 rounded">
                            <p className="text-slate-700 font-medium">{trainerInfo.note}</p>
                        </div>
                    )}
                </div>

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