'use client';

import { useState, useMemo, useEffect } from 'react';
import AdminLayout from '@/shared/layouts/AdminLayout';
import { UiModal } from '@/shared/ui/UiModal';
import { TaskForm } from '@/features/tasks/ui/TaskForm';
import { Button } from '@/shared/ui/Button';
import { useBankTaskList } from "@/features/admin/model/useBankTaskList";

// ─── Типы API ─────────────────────────────────────────────────────────────────

interface TaskItem {
    id: number;
    complexity: string;
    complexity_id: number;
    task_category: string;
    task_text: string;
}

interface TaskGroup {
    category_id: number;
    category_slug: string;
    category_name: string;
    tasks: TaskItem[];
}

// ─── Вспомогательные константы ───────────────────────────────────────────────

const COMPLEXITY_COLORS: Record<string, string> = {
    'А+Б-': 'bg-green-100 text-green-800 border border-green-300',
    'А+Б+': 'bg-blue-100 text-blue-800 border border-blue-300',
    'А-Б-': 'bg-red-100 text-red-800 border border-red-300',
    'А-Б+': 'bg-yellow-100 text-yellow-800 border border-yellow-300',
};

const ROWS_PER_PAGE = 10;

// ─── Компонент ────────────────────────────────────────────────────────────────

export default function BankPage() {
    // Подключаем твой хук. Явно указываем тип для items, чтобы TS не ругался на any.
    const {
        items,
        isLoading,
        isError,
        handleDeleteClinicalCase
    } = useBankTaskList() as {
        items: TaskGroup[];
        isLoading: boolean;
        isError: boolean;
        handleDeleteClinicalCase: (id: number) => void;
    };

    // Состояния фильтрации и пагинации
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);

    // Сброс страницы при изменении фильтра
    useEffect(() => {
        setCurrentPage(1);
    }, [categoryFilter]);

    // 1. Формируем список категорий для селекта из пришедших групп
    const categories = useMemo(() => {
        if (!Array.isArray(items)) return [];
        return items.map((group) => ({
            slug: group.category_slug,
            name: group.category_name,
        }));
    }, [items]);

    // 2. Превращаем сгруппированную структуру в плоский отфильтрованный список задач
    const filteredTasks = useMemo<TaskItem[]>(() => {
        if (!Array.isArray(items)) return [];

        // Если выбраны "Все задания" — собираем задачи из всех групп в один плоский массив
        if (categoryFilter === 'all') {
            return items.flatMap((group) => group.tasks || []);
        }

        // Если выбрана конкретная категория — берем задачи только из неё
        const targetGroup = items.find((group) => group.category_slug === categoryFilter);
        return targetGroup ? (targetGroup.tasks || []) : [];
    }, [items, categoryFilter]);

    // 3. Расчет общего количества страниц
    const totalPages = useMemo(() => {
        return Math.max(1, Math.ceil(filteredTasks.length / ROWS_PER_PAGE));
    }, [filteredTasks]);

    // 4. Срез задач для текущей страницы с жесткой типизацией TaskItem[]
    const paginatedTasks = useMemo<TaskItem[]>(() => {
        const startIndex = (currentPage - 1) * ROWS_PER_PAGE;
        return filteredTasks.slice(startIndex, startIndex + ROWS_PER_PAGE);
    }, [filteredTasks, currentPage]);

    console.log(items);

    // ─────────────────────────────────────────────────────────────────────────
    return (
        <AdminLayout activeTab="bank">

            {/* Фильтры и кнопка создания */}
            <div className="bg-white rounded-xl shadow-md p-6 mb-6 border border-slate-200">
                <div className="flex items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                        <label className="text-sm font-semibold text-slate-700 whitespace-nowrap">
                            Тип задания:
                        </label>
                        <select
                            value={categoryFilter}
                            onChange={e => setCategoryFilter(e.target.value)}
                            className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
                        >
                            <option value="all">Все задания</option>
                            {categories.map(c => (
                                <option key={c.slug} value={c.slug}>{c.name}</option>
                            ))}
                        </select>
                    </div>

                    <UiModal
                        button={
                            <Button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors shadow-sm flex items-center gap-2">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                            </Button>
                        }
                    >
                        {({ close }) => (
                            <TaskForm
                                closeModal={close}
                                onSave={close} // Форма сама вызовет мутацию создания внутри себя и обновит кэш
                            />
                        )}
                    </UiModal>
                </div>
            </div>

            {/* Состояния загрузки */}
            {isLoading && (
                <div className="bg-white rounded-xl shadow-md border border-slate-200 p-16 flex items-center justify-center">
                    <div className="flex flex-col items-center gap-3 text-slate-500">
                        <svg className="w-8 h-8 animate-spin text-blue-500" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                        </svg>
                        <span className="text-sm">Загрузка заданий...</span>
                    </div>
                </div>
            )}

            {/* Состояния ошибки */}
            {isError && !isLoading && (
                <div className="bg-white rounded-xl shadow-md border border-red-200 p-8 text-center">
                    <p className="text-red-600">Произошла ошибка при загрузке банка заданий.</p>
                </div>
            )}

            {/* Таблица */}
            {!isLoading && !isError && (
                <div className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="px-4 py-3 text-center text-sm font-semibold text-slate-700 w-16">№</th>
                                <th className="px-4 py-3 text-center text-sm font-semibold text-slate-700 w-32">Сложность</th>
                                <th className="px-4 py-3 text-center text-sm font-semibold text-slate-700 w-48">Тип задания</th>
                                <th className="px-4 py-3 text-center text-sm font-semibold text-slate-700">Текст задания</th>
                                <th className="px-4 py-3 text-center text-sm font-semibold text-slate-700 w-32">Действия</th>
                            </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                            {paginatedTasks.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-4 py-12 text-center text-slate-400 italic">
                                        Заданий не найдено
                                    </td>
                                </tr>
                            ) : (
                                paginatedTasks.map((task, index) => (
                                    <tr key={task.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-4 py-3 text-center font-semibold text-slate-800">
                                            {(currentPage - 1) * ROWS_PER_PAGE + index + 1}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                                <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${COMPLEXITY_COLORS[task.complexity] ?? 'bg-gray-100 text-gray-800 border border-gray-300'}`}>
                                                    {task.complexity}
                                                </span>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                                <span className="inline-block bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                                                    {task.task_category}
                                                </span>
                                        </td>
                                        <td className="px-4 py-3 text-slate-700">
                                            <div className="line-clamp-2">{task.task_text}</div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center justify-center gap-2">
                                                {/* Кнопка редактирования */}
                                                <UiModal
                                                    button={
                                                        <Button
                                                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                            variant="secondary"
                                                        >
                                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                                                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                            </svg>
                                                        </Button>
                                                    }
                                                >
                                                    {({ close }) => (
                                                        <TaskForm
                                                            taskId={task.id}
                                                            closeModal={close}
                                                            onSave={close} // Форма сама выполнит апдейт и закроется
                                                        />
                                                    )}
                                                </UiModal>

                                                {/* Кнопка удаления */}
                                                <Button
                                                    onClick={() => handleDeleteClinicalCase(task.id)}
                                                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                    variant="secondary"
                                                >
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                            </tbody>
                        </table>
                    </div>

                    {/* Пагинация */}
                    {filteredTasks.length > ROWS_PER_PAGE && (
                        <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex justify-center items-center gap-4">
                            <button
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className={`p-2 rounded-lg transition-colors ${currentPage === 1 ? 'text-slate-400 cursor-not-allowed' : 'text-slate-600 hover:bg-slate-200'}`}
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                </svg>
                            </button>
                            <span className="text-slate-700 text-sm">
                                Страница <span className="font-semibold">{currentPage}</span> из <span className="font-semibold">{totalPages}</span>
                            </span>
                            <button
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                className={`p-2 rounded-lg transition-colors ${currentPage === totalPages ? 'text-slate-400 cursor-not-allowed' : 'text-slate-600 hover:bg-slate-200'}`}
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </button>
                        </div>
                    )}
                </div>
            )}
        </AdminLayout>
    );
}