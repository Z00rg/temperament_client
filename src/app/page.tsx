'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/shared/ui/Button';
import {UiHeader} from "@/shared/ui/ui-header";

// Тестовые данные
const TESTS_DATA = [
  {
    id: '1',
    title: 'Определение темперамента по И.П. Павлову',
    description:
        'Данный сервис предназначен для обучения студентов определению темперамента человека по классификации И.П. Павлова, основанной на 4-х типах высшей нервной деятельности',
    isAvailable: true,
  },
  {
    id: '2',
    title: 'Экономические задачи',
    description:
        'Данный сервис предназначен для тестирования студентов по экономическим задачам',
    isAvailable: true,
  },
  {
    id: '3',
    title: 'Тест',
    description: '',
    isAvailable: false,
  },
  {
    id: '4',
    title: 'Тест',
    description: '',
    isAvailable: false,
  },
  {
    id: '5',
    title: 'Тест',
    description: '',
    isAvailable: false,
  },
];

export default function HomePage() {
  const [selectedTest, setSelectedTest] = useState<string | null>(null);
  const router = useRouter();

  const selectedTestData = TESTS_DATA.find((test) => test.id === selectedTest);

  const handleTestSelect = (testId: string) => {
    const test = TESTS_DATA.find((t) => t.id === testId);
    if (test?.isAvailable) {
      setSelectedTest(testId);
    }
  };

  const handleStartTest = () => {
    if (!selectedTest) {
      alert('Выберите тест');
      return;
    }

    const test = TESTS_DATA.find((t) => t.id === selectedTest);
    if (!test?.isAvailable) {
      alert('Выберите доступный тест');
      return;
    }

    // Переход на динамический маршрут /description/[testId]
    router.push(`/description/${selectedTest}`);
  };

  return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        {/* Header */}
        <UiHeader/>

        {/* Main Content */}
        <main className="container mx-auto px-6 py-12">
          {/* Tests Grid */}
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-slate-800 mb-6">
              Выберите тренажер
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {TESTS_DATA.map((test) => (
                  <button
                      key={test.id}
                      onClick={() => handleTestSelect(test.id)}
                      disabled={!test.isAvailable}
                      className={`
                  p-6 rounded-xl transition-all duration-200 text-center min-h-[140px] flex items-center justify-center
                  ${
                          selectedTest === test.id
                              ? 'bg-blue-600 text-white shadow-xl scale-105 ring-4 ring-blue-300'
                              : test.isAvailable
                                  ? 'bg-white text-slate-800 hover:bg-blue-50 hover:shadow-lg hover:scale-102 shadow-md border border-slate-200'
                                  : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                      }
                `}
                  >
                <span className="font-semibold leading-tight">
                  {test.title.split('<br>').join('\n')}
                </span>
                  </button>
              ))}
            </div>
          </div>

          {/* Test Description */}
          {selectedTestData?.description && (
              <div className="mb-12">
                <div className="bg-white rounded-xl shadow-md p-8 border border-slate-200">
                  <h3 className="text-lg font-semibold text-slate-800 mb-3">
                    Описание тренажера
                  </h3>
                  <p className="text-slate-700 leading-relaxed">
                    {selectedTestData.description}
                  </p>
                </div>
              </div>
          )}

          {/* Start Button */}
          <div className="flex justify-center">
            <Button
                onPress={handleStartTest}
                isDisabled={!selectedTest}
                className={`
              px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-200 shadow-lg
              ${
                    selectedTest
                        ? 'bg-blue-600 hover:bg-blue-700 text-white hover:shadow-xl hover:scale-105'
                        : 'bg-slate-300 text-slate-500 cursor-not-allowed'
                }
            `}
            >
              Приступить к работе
            </Button>
          </div>
        </main>
      </div>
  );
}