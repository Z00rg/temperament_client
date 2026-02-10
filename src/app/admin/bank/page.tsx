'use client';

import { useState, useMemo } from 'react';
import AdminLayout from '@/shared/layouts/AdminLayout';

// Типы данных
interface Task {
    id: string;
    complexity: string;
    taskCategory: string;
    taskText: string;
}

interface TaskCategory {
    id: string;
    name: string;
}

// Тестовые данные категорий
const MOCK_CATEGORIES: TaskCategory[] = [
    { id: 'all', name: 'Все задания' },
    { id: 'temperament', name: 'Определение темперамента' },
    { id: 'economic', name: 'Экономические задачи' },
];

// Тестовые данные заданий
const MOCK_TASKS: Task[] = [
    {
        id: '1',
        complexity: 'А+Б-',
        taskCategory: 'temperament',
        taskText:
            'Студент Петров активно участвует в общественной жизни университета. Он быстро адаптируется к новым условиям и легко находит общий язык с окружающими. В стрессовых ситуациях сохраняет спокойствие и рассудительность.',
    },
    {
        id: '2',
        complexity: 'А+Б+',
        taskCategory: 'temperament',
        taskText:
            'Студентка Сидорова медлительна, но упорна. Она тщательно выполняет все задания, предпочитает работать в одиночку. Редко проявляет эмоции, говорит спокойным, монотонным голосом.',
    },
    {
        id: '3',
        complexity: 'А-Б-',
        taskCategory: 'temperament',
        taskText:
            'Студент Иванов вспыльчив и энергичен. Быстро берется за новые проекты, но часто не доводит их до конца. В споре может повысить голос, легко возбуждается.',
    },
    {
        id: '4',
        complexity: 'А+Б-',
        taskCategory: 'economic',
        taskText:
            'Компания планирует увеличить производство на 20%. Текущие затраты составляют 500 000 рублей в месяц. Рассчитайте новые затраты при условии, что постоянные расходы не изменятся.',
    },
    {
        id: '5',
        complexity: 'А-Б+',
        taskCategory: 'economic',
        taskText:
            'Инвестор вложил 1 000 000 рублей под 8% годовых. Через какое время его капитал удвоится при условии ежегодной капитализации процентов?',
    },
    {
        id: '6',
        complexity: 'А-Б-',
        taskCategory: 'economic',
        taskText:
            'Предприятие имеет три варианта инвестиций с разными показателями NPV и IRR. Определите оптимальный вариант при ставке дисконтирования 12% годовых.',
    },
    {
        id: '7',
        complexity: 'А-Б+',
        taskCategory: 'temperament',
        taskText:
            'Студент Козлов очень чувствителен к критике. Он предпочитает избегать конфликтных ситуаций, часто сомневается в своих силах. Работает медленно, но аккуратно.',
    },
    {
        id: '8',
        complexity: 'А+Б+',
        taskCategory: 'economic',
        taskText:
            'Рассчитайте точку безубыточности, если постоянные затраты составляют 300 000 рублей, цена единицы продукции 500 рублей, переменные затраты на единицу 200 рублей.',
    },
];

export default function BankPage() {
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [taskToDelete, setTaskToDelete] = useState<string | null>(null);

    const rowsPerPage = 10;

    // Фильтрация заданий
    const filteredTasks = useMemo(() => {
        if (categoryFilter === 'all') {
            return MOCK_TASKS;
        }
        return MOCK_TASKS.filter((task) => task.taskCategory === categoryFilter);
    }, [categoryFilter]);

    // Пагинация
    const totalPages = Math.ceil(filteredTasks.length / rowsPerPage);
    const paginatedTasks = useMemo(() => {
        const start = (currentPage - 1) * rowsPerPage;
        const end = start + rowsPerPage;
        return filteredTasks.slice(start, end);
    }, [filteredTasks, currentPage]);

    // Сброс страницы при изменении фильтра
    useMemo(() => {
        setCurrentPage(1);
    }, [categoryFilter]);

    const handlePrevPage = () => {
        if (currentPage > 1) setCurrentPage(currentPage - 1);
    };

    const handleNextPage = () => {
        if (currentPage < totalPages) setCurrentPage(currentPage + 1);
    };

    const handleCreateTask = () => {
        // TODO: Открыть модалку или перейти на страницу создания
        console.log('Create new task');
    };

    const handleEditTask = (taskId: string) => {
        // TODO: Открыть модалку редактирования или перейти на страницу
        console.log('Edit task:', taskId);
    };

    const handleDeleteTask = (taskId: string) => {
        if (confirm('Вы уверены, что хотите удалить это задание?')) {
            // TODO: Отправка запроса на удаление
            console.log('Delete task:', taskId);
            // После успешного удаления обновить список
        }
    };

    // Получение названия категории
    const getCategoryName = (categoryId: string) => {
        const category = MOCK_CATEGORIES.find((c) => c.id === categoryId);
        return category?.name || categoryId;
    };

    // Цвет бейджа сложности
    const getComplexityColor = (complexity: string) => {
        switch (complexity) {
            case 'А+Б-':
                return 'bg-green-100 text-green-800 border border-green-300';
            case 'А+Б+':
                return 'bg-blue-100 text-blue-800 border border-blue-300';
            case 'А-Б-':
                return 'bg-red-100 text-red-800 border border-red-300';
            case 'А-Б+':
                return 'bg-yellow-100 text-yellow-800 border border-yellow-300';
            default:
                return 'bg-gray-100 text-gray-800 border border-gray-300';
        }
    };

    return (
        <AdminLayout activeTab="bank">
            {/* Filters and Create Button */}
            <div className="bg-white rounded-xl shadow-md p-6 mb-6 border border-slate-200">
                <div className="flex items-center justify-between gap-6">
                    {/* Category Filter */}
                    <div className="flex items-center gap-4">
                        <label className="text-sm font-semibold text-slate-700 whitespace-nowrap">
                            Тип задания:
                        </label>
                        <select
                            value={categoryFilter}
                            onChange={(e) => setCategoryFilter(e.target.value)}
                            className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                            {MOCK_CATEGORIES.map((category) => (
                                <option key={category.id} value={category.id}>
                                    {category.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Create Button */}
                    <button
                        onClick={handleCreateTask}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors shadow-sm flex items-center gap-2"
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
                                d="M12 4v16m8-8H4"
                            />
                        </svg>
                        Создать
                    </button>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                            <th className="px-4 py-3 text-center text-sm font-semibold text-slate-700 w-16">
                                №
                            </th>
                            <th className="px-4 py-3 text-center text-sm font-semibold text-slate-700 w-32">
                                Сложность
                            </th>
                            <th className="px-4 py-3 text-center text-sm font-semibold text-slate-700 w-48">
                                Тип задания
                            </th>
                            <th className="px-4 py-3 text-center text-sm font-semibold text-slate-700">
                                Текст задания
                            </th>
                            <th className="px-4 py-3 text-center text-sm font-semibold text-slate-700 w-32">
                                Действия
                            </th>
                        </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                        {paginatedTasks.length === 0 ? (
                            <tr>
                                <td
                                    colSpan={5}
                                    className="px-4 py-8 text-center text-slate-500"
                                >
                                    Нет заданий
                                </td>
                            </tr>
                        ) : (
                            paginatedTasks.map((task, index) => (
                                <tr
                                    key={task.id}
                                    className="hover:bg-slate-50 transition-colors"
                                >
                                    <td className="px-4 py-3 text-center font-semibold text-slate-800">
                                        {(currentPage - 1) * rowsPerPage + index + 1}
                                    </td>
                                    <td className="px-4 py-3 text-center">
                      <span
                          className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getComplexityColor(
                              task.complexity
                          )}`}
                      >
                        {task.complexity}
                      </span>
                                    </td>
                                    <td className="px-4 py-3 text-center">
                      <span className="inline-block bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                        {getCategoryName(task.taskCategory)}
                      </span>
                                    </td>
                                    <td className="px-4 py-3 text-slate-700">
                                        <div className="line-clamp-2">{task.taskText}</div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center justify-center gap-2">
                                            {/* Edit Button */}
                                            <button
                                                onClick={() => handleEditTask(task.id)}
                                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                title="Редактировать"
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
                                                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                                    />
                                                </svg>
                                            </button>

                                            {/* Delete Button */}
                                            <button
                                                onClick={() => handleDeleteTask(task.id)}
                                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                title="Удалить"
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
                                                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                                    />
                                                </svg>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {filteredTasks.length > 0 && (
                    <div className="bg-slate-50 px-6 py-4 border-t border-slate-200">
                        <div className="flex items-center justify-center gap-4">
                            <button
                                onClick={handlePrevPage}
                                disabled={currentPage === 1}
                                className={`p-2 rounded-lg transition-colors ${
                                    currentPage === 1
                                        ? 'text-slate-400 cursor-not-allowed'
                                        : 'text-slate-600 hover:bg-slate-200'
                                }`}
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
                                        d="M15 19l-7-7 7-7"
                                    />
                                </svg>
                            </button>

                            <span className="text-slate-700">
                Страница <span className="font-semibold">{currentPage}</span> из{' '}
                                <span className="font-semibold">{totalPages}</span>
              </span>

                            <button
                                onClick={handleNextPage}
                                disabled={currentPage === totalPages}
                                className={`p-2 rounded-lg transition-colors ${
                                    currentPage === totalPages
                                        ? 'text-slate-400 cursor-not-allowed'
                                        : 'text-slate-600 hover:bg-slate-200'
                                }`}
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
                                        d="M9 5l7 7-7 7"
                                    />
                                </svg>
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}