'use client';

import { useState, useMemo } from 'react';
import AdminLayout from '@/shared/layouts/AdminLayout';

// Типы данных
interface Attempt {
    id: string;
    startTime: string;
    endTime: string;
    spentTime: string;
    estimation: string;
    taskCategory: string; // ID категории задания
}

interface Student {
    id: string;
    fio: string;
    group: string;
    attempts: Attempt[];
}

interface TaskCategory {
    id: string;
    name: string;
}

// Тестовые данные категорий заданий
const MOCK_CATEGORIES: TaskCategory[] = [
    { id: 'all', name: 'Все задания' },
    { id: 'temperament', name: 'Определение темперамента' },
    { id: 'economic', name: 'Экономические задачи' },
];

// Тестовые данные студентов
const MOCK_STUDENTS: Student[] = [
    {
        id: '1',
        fio: 'Иванов Иван Иванович',
        group: 'ЛД-301',
        attempts: [
            {
                id: 'a1',
                startTime: '2025-02-01 10:30:00',
                endTime: '2025-02-01 10:38:45',
                spentTime: '08:45',
                estimation: 'Хорошо',
                taskCategory: 'temperament',
            },
            {
                id: 'a2',
                startTime: '2025-02-02 14:20:00',
                endTime: '2025-02-02 14:31:15',
                spentTime: '11:15',
                estimation: 'Отлично',
                taskCategory: 'temperament',
            },
            {
                id: 'a3',
                startTime: '2025-02-03 09:15:00',
                endTime: '2025-02-03 09:27:30',
                spentTime: '12:30',
                estimation: 'Удовлетворительно',
                taskCategory: 'economic',
            },
        ],
    },
    {
        id: '2',
        fio: 'Петрова Мария Сергеевна',
        group: 'ЛД-301',
        attempts: [
            {
                id: 'a4',
                startTime: '2025-02-01 11:00:00',
                endTime: '2025-02-01 11:12:30',
                spentTime: '12:30',
                estimation: 'Отлично',
                taskCategory: 'economic',
            },
        ],
    },
    {
        id: '3',
        fio: 'Сидоров Петр Александрович',
        group: 'ЛД-302',
        attempts: [
            {
                id: 'a5',
                startTime: '2025-02-02 10:00:00',
                endTime: '2025-02-02 10:09:20',
                spentTime: '09:20',
                estimation: 'Хорошо',
                taskCategory: 'temperament',
            },
            {
                id: 'a6',
                startTime: '2025-02-03 15:30:00',
                endTime: '2025-02-03 15:45:10',
                spentTime: '15:10',
                estimation: 'Неудовлетворительно',
                taskCategory: 'temperament',
            },
        ],
    },
    {
        id: '4',
        fio: 'Кузнецова Анна Викторовна',
        group: 'ЛД-303',
        attempts: [
            {
                id: 'a7',
                startTime: '2025-02-01 16:00:00',
                endTime: '2025-02-01 16:08:45',
                spentTime: '08:45',
                estimation: 'Отлично',
                taskCategory: 'economic',
            },
            {
                id: 'a8',
                startTime: '2025-02-02 13:00:00',
                endTime: '2025-02-02 13:11:20',
                spentTime: '11:20',
                estimation: 'Отлично',
                taskCategory: 'economic',
            },
            {
                id: 'a9',
                startTime: '2025-02-04 10:30:00',
                endTime: '2025-02-04 10:39:15',
                spentTime: '09:15',
                estimation: 'Хорошо',
                taskCategory: 'temperament',
            },
        ],
    },
    {
        id: '5',
        fio: 'Смирнов Алексей Дмитриевич',
        group: 'ЛД-302',
        attempts: [],
    },
];

export default function StatementsPage() {
    const [groupFilter, setGroupFilter] = useState('');
    const [studentFilter, setStudentFilter] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);

    const rowsPerPage = 10;

    // Фильтрация студентов
    const filteredStudents = useMemo(() => {
        return MOCK_STUDENTS.filter((student) => {
            const matchesGroup = groupFilter
                ? student.group.toUpperCase().includes(groupFilter.toUpperCase())
                : true;
            const matchesStudent = studentFilter
                ? student.fio.toUpperCase().includes(studentFilter.toUpperCase())
                : true;

            // Фильтр по типу задания - проверяем последнюю попытку
            let matchesCategory = true;
            if (categoryFilter !== 'all') {
                const latestAttempt =
                    student.attempts.length > 0
                        ? student.attempts[student.attempts.length - 1]
                        : null;
                matchesCategory = latestAttempt
                    ? latestAttempt.taskCategory === categoryFilter
                    : false;
            }

            return matchesGroup && matchesStudent && matchesCategory;
        });
    }, [groupFilter, studentFilter, categoryFilter]);

    // Пагинация
    const totalPages = Math.ceil(filteredStudents.length / rowsPerPage);
    const paginatedStudents = useMemo(() => {
        const start = (currentPage - 1) * rowsPerPage;
        const end = start + rowsPerPage;
        return filteredStudents.slice(start, end);
    }, [filteredStudents, currentPage]);

    // Сброс страницы при изменении фильтров
    useMemo(() => {
        setCurrentPage(1);
    }, [groupFilter, studentFilter, categoryFilter]);

    const handlePrevPage = () => {
        if (currentPage > 1) setCurrentPage(currentPage - 1);
    };

    const handleNextPage = () => {
        if (currentPage < totalPages) setCurrentPage(currentPage + 1);
    };

    // Форматирование даты
    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleString('ru-RU', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
        });
    };

    // Цвет оценки
    const getGradeColor = (grade: string) => {
        switch (grade) {
            case 'Отлично':
                return 'text-green-600 font-semibold';
            case 'Хорошо':
                return 'text-blue-600 font-semibold';
            case 'Удовлетворительно':
                return 'text-yellow-600 font-semibold';
            case 'Неудовлетворительно':
                return 'text-red-600 font-semibold';
            default:
                return 'text-slate-600';
        }
    };

    // Получение названия категории
    const getCategoryName = (categoryId: string) => {
        const category = MOCK_CATEGORIES.find((c) => c.id === categoryId);
        return category?.name || categoryId;
    };

    return (
        <AdminLayout activeTab="statements">
            {/* Filters */}
            <div className="bg-white rounded-xl shadow-md p-6 mb-6 border border-slate-200">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Group Filter */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                            Номер группы
                        </label>
                        <input
                            type="text"
                            value={groupFilter}
                            onChange={(e) => setGroupFilter(e.target.value)}
                            placeholder="Введите группу"
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>

                    {/* Student Filter */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                            Студент
                        </label>
                        <input
                            type="text"
                            value={studentFilter}
                            onChange={(e) => setStudentFilter(e.target.value)}
                            placeholder="Введите ФИО"
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>

                    {/* Category Filter */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                            Тип задания
                        </label>
                        <select
                            value={categoryFilter}
                            onChange={(e) => setCategoryFilter(e.target.value)}
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                            {MOCK_CATEGORIES.map((category) => (
                                <option key={category.id} value={category.id}>
                                    {category.name}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                            <th className="px-4 py-3 text-center text-sm font-semibold text-slate-700">
                                №
                            </th>
                            <th className="px-4 py-3 text-center text-sm font-semibold text-slate-700">
                                ФИО студента
                            </th>
                            <th className="px-4 py-3 text-center text-sm font-semibold text-slate-700">
                                Группа
                            </th>
                            <th className="px-4 py-3 text-center text-sm font-semibold text-slate-700">
                                Тип задания
                            </th>
                            <th className="px-4 py-3 text-center text-sm font-semibold text-slate-700">
                                Время начала
                            </th>
                            <th className="px-4 py-3 text-center text-sm font-semibold text-slate-700">
                                Время окончания
                            </th>
                            <th className="px-4 py-3 text-center text-sm font-semibold text-slate-700">
                                Затраченное время
                            </th>
                            <th className="px-4 py-3 text-center text-sm font-semibold text-slate-700">
                                Попытка
                            </th>
                            <th className="px-4 py-3 text-center text-sm font-semibold text-slate-700">
                                Оценка
                            </th>
                        </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                        {paginatedStudents.length === 0 ? (
                            <tr>
                                <td
                                    colSpan={9}
                                    className="px-4 py-8 text-center text-slate-500"
                                >
                                    Нет данных
                                </td>
                            </tr>
                        ) : (
                            paginatedStudents.map((student, index) => {
                                const latestAttempt =
                                    student.attempts.length > 0
                                        ? student.attempts[student.attempts.length - 1]
                                        : null;
                                const displayedAttempts = student.attempts.slice(-3); // Последние 3 попытки

                                return (
                                    <tr
                                        key={student.id}
                                        className="hover:bg-slate-50 transition-colors"
                                    >
                                        <td className="px-4 py-3 text-center font-semibold text-slate-800">
                                            {(currentPage - 1) * rowsPerPage + index + 1}
                                        </td>
                                        <td className="px-4 py-3 text-center text-slate-700">
                                            {student.fio}
                                        </td>
                                        <td className="px-4 py-3 text-center text-slate-700">
                                            {student.group}
                                        </td>
                                        <td className="px-4 py-3 text-center text-slate-700">
                                            {latestAttempt ? (
                                                <span className="inline-block bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                                                    {getCategoryName(latestAttempt.taskCategory)}
                                                </span>
                                            ) : (
                                                <span className="text-slate-400">—</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-center text-slate-600 text-sm">
                                            {latestAttempt
                                                ? formatDate(latestAttempt.startTime)
                                                : 'Нет данных'}
                                        </td>
                                        <td className="px-4 py-3 text-center text-slate-600 text-sm">
                                            {latestAttempt
                                                ? formatDate(latestAttempt.endTime)
                                                : 'Нет данных'}
                                        </td>
                                        <td className="px-4 py-3 text-center text-slate-700 font-mono">
                                            {latestAttempt ? latestAttempt.spentTime : 'Нет данных'}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            {displayedAttempts.length > 0 ? (
                                                <div className="flex items-center justify-center gap-2">
                                                    {displayedAttempts.map((attempt) => (
                                                        <a
                                                            key={attempt.id}
                                                            href={`/estimation/${attempt.id}`}
                                                            className="text-blue-600 hover:text-blue-800 hover:underline font-medium"
                                                        >
                                                            {student.attempts.indexOf(attempt) + 1}
                                                        </a>
                                                    ))}
                                                </div>
                                            ) : (
                                                <span className="text-slate-400">—</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            {latestAttempt ? (
                                                <span className={getGradeColor(latestAttempt.estimation)}>
                                                    {latestAttempt.estimation}
                                                </span>
                                            ) : (
                                                <span className="text-slate-400">Нет данных</span>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {filteredStudents.length > 0 && (
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