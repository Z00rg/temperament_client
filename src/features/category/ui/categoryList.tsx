'use client';

import {useCategoryList} from "@/features/category/model/useCategoryList";
import {Button} from "@/shared/ui/Button";

export function CategoryList({isAdmin}: {isAdmin: boolean}) {
    const {items, isLoading, isError, handleClick, handleStart, handleAdminClick, selectedCategory} = useCategoryList();

    return (
        <main className="container mx-auto px-6 py-12">
            {/* Categories Grid */}
            {!isLoading && !isError && <div className="mb-12">
                <h2 className="text-2xl font-bold text-slate-800 mb-6">
                    Выберите тренажер
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                    {items.map((category) => (
                        <button
                            key={category.id}
                            onClick={() => handleClick(category)}
                            className={`
                  p-6 rounded-xl transition-all duration-200 text-center min-h-[140px] flex items-center justify-center
                  ${
                                selectedCategory === category
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
                    {isAdmin && <button
                        onClick={() => handleAdminClick()}
                        className={`
                                    p-6 rounded-xl transition-all duration-200 text-center min-h-[140px] flex items-center justify-center
                                  bg-white text-slate-800 hover:bg-blue-50 hover:shadow-lg hover:scale-102 shadow-md border border-slate-200
                                  `}>
                            <span className="font-semibold leading-tight">
                              Панель администратора
                            </span>
                    </button>}
                </div>
            </div>}

            {/* Category Description */}
            {selectedCategory?.short_description && (
                <div className="mb-12">
                    <div className="bg-white rounded-xl shadow-md p-8 border border-slate-200">
                        <h3 className="text-lg font-semibold text-slate-800 mb-3">
                            Описание тренажера
                        </h3>
                        <p className="text-slate-700 leading-relaxed">
                            {selectedCategory.short_description}
                        </p>
                    </div>
                </div>
            )}

            {/* Start Button */}
            <div className="flex justify-center">
                <Button
                    onPress={handleStart}
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
    )
}