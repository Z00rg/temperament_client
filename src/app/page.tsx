'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/shared/ui/Button';
import {UiHeader} from "@/shared/ui/ui-header";
import {queue} from "@/shared/ui/Toast";

// Тестовые данные
const CATEGORIES_DATA = [
  {
    id: '1',
    button_title: 'Определение темперамента по И.П. Павлову',
    short_description:
        'Данный сервис предназначен для обучения студентов определению темперамента человека по классификации И.П. Павлова, основанной на 4-х типах высшей нервной деятельности',
    detail_description: 'Данный сервис предназначен для обучения студентов определению темперамента человека по классификации И.П. Павлова, основанной на 4-х типах высшей нервной деятельности',
    category: "1",
  },
  {
    id: '2',
    button_title: 'Экономические задачи',
    short_description:
        'Данный сервис предназначен для тестирования студентов по экономическим задачам',
    detail_description: 'Данный сервис предназначен для тестирования студентов по экономическим задачам',
    category: "2",
  },
];

export default function HomePage() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const router = useRouter();

  const selectedCategoryData = CATEGORIES_DATA.find((category) => category.id === selectedCategory);

  const handleCategorySelect = (categoryId: string) => {
      setSelectedCategory(categoryId);
  };

  const handleStartCategory = () => {
    if (!selectedCategory) {
      queue.add({
        title: 'Выберите тест',
        type: 'warning'
      }, {
        timeout: 3000
      });
      return;
    }

    // Переход на динамический маршрут /description/[categoryId]
    router.push(`/description/${selectedCategory}`);
  };

  return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        {/* Header */}
        <UiHeader/>

        {/* Main Content */}
        <main className="container mx-auto px-6 py-12">
          {/* Categories Grid */}
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-slate-800 mb-6">
              Выберите тренажер
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {CATEGORIES_DATA.map((category) => (
                  <button
                      key={category.id}
                      onClick={() => handleCategorySelect(category.id)}
                      className={`
                  p-6 rounded-xl transition-all duration-200 text-center min-h-[140px] flex items-center justify-center
                  ${
                          selectedCategory === category.id
                              ? 'bg-blue-600 text-white shadow-xl scale-105 ring-4 ring-blue-300'
                              : 'bg-white text-slate-800 hover:bg-blue-50 hover:shadow-lg hover:scale-102 shadow-md border border-slate-200'
                      }
                `}
                  >
                <span className="font-semibold leading-tight">
                  {category.button_title.split('<br>').join('\n')}
                </span>
                  </button>
              ))}
            </div>
          </div>

          {/* Category Description */}
          {selectedCategoryData?.short_description && (
              <div className="mb-12">
                <div className="bg-white rounded-xl shadow-md p-8 border border-slate-200">
                  <h3 className="text-lg font-semibold text-slate-800 mb-3">
                    Описание тренажера
                  </h3>
                  <p className="text-slate-700 leading-relaxed">
                    {selectedCategoryData.short_description}
                  </p>
                </div>
              </div>
          )}

          {/* Start Button */}
          <div className="flex justify-center">
            <Button
                onPress={handleStartCategory}
                isDisabled={!selectedCategory}
                className={`
              px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-200 shadow-lg
              ${
                    selectedCategory
                        ? 'bg-blue-600 hover:bg-blue-700 text-white hover:shadow-xl hover:scale-105'
                        : 'bg-slate-300 text-slate-500 cursor-not-allowed hover:bg-slate-300'
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