'use client';

import { useState, useMemo, useEffect } from 'react';
import AdminLayout from '@/shared/layouts/AdminLayout';

// Типы данных согласно новому формату
interface StudentData {
    student_fio: string;
    group: string;
    last_start: string;
    last_end: string;
    last_spent: string;
    last_grade: string | number;
    last_category: string;
    attempts: string[];
}

const MOCK_DATA: StudentData[] = [
    {
        student_fio: 'Иванов Иван Иванович',
        group: 'ЛД-301',
        last_start: '2025-02-01 10:30:00',
        last_end: '2025-02-01 10:38:45',
        last_spent: '08:45',
        last_grade: 4,
        last_category: 'Определение темперамента',
        attempts: ['121', '122'],
    },
    {
        student_fio: 'Петрова Мария Сергеевна',
        group: 'ЛД-301',
        last_start: '2025-02-01 11:00:00',
        last_end: '2025-02-01 11:12:30',
        last_spent: '12:30',
        last_grade: 5,
        last_category: 'Экономические задачи',
        attempts: ['14'],
    },
    {
        student_fio: 'Сидоров Петр Александрович',
        group: 'ЛД-302',
        last_start: '2025-02-03 15:30:00',
        last_end: '2025-02-03 15:45:10',
        last_spent: '15:10',
        last_grade: 2,
        last_category: 'Определение темперамента',
        attempts: ['15', '16'],
    },
    {
        student_fio: 'Кузнецова Анна Викторовна',
        group: 'ЛД-303',
        last_start: '2025-02-04 10:30:00',
        last_end: '2025-02-04 10:39:15',
        last_spent: '09:15',
        last_grade: 3,
        last_category: 'Определение темперамента',
        attempts: ['17', '18', '19'],
    },
];

export default function StatementsPage() {
    const [groupFilter, setGroupFilter] = useState('');
    const [studentFilter, setStudentFilter] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);

    const rowsPerPage = 10;

    // Динамическое формирование категорий из данных
    const dynamicCategories = useMemo(() => {
        const categories = MOCK_DATA
            .map(item => item.last_category)
            .filter(cat => cat && cat.trim() !== '');
        return ['all', ...Array.from(new Set(categories))];
    }, []);

    // Исправленная логика фильтрации
    const filteredData = useMemo(() => {
        return MOCK_DATA.filter((item) => {
            const searchGroup = groupFilter.trim().toLowerCase();
            const searchStudent = studentFilter.trim().toLowerCase();

            const matchesGroup = !searchGroup
                ? true
                : item.group.toLowerCase().includes(searchGroup);

            const matchesStudent = !searchStudent
                ? true
                : item.student_fio.toLowerCase().includes(searchStudent);

            const matchesCategory = categoryFilter === 'all'
                ? true
                : item.last_category === categoryFilter;

            return matchesGroup && matchesStudent && matchesCategory;
        });
    }, [groupFilter, studentFilter, categoryFilter]);

    // Пагинация
    const totalPages = Math.ceil(filteredData.length / rowsPerPage);
    const paginatedData = useMemo(() => {
        const start = (currentPage - 1) * rowsPerPage;
        return filteredData.slice(start, start + rowsPerPage);
    }, [filteredData, currentPage]);

    // Сброс на 1 страницу при поиске
    useEffect(() => {
        setCurrentPage(1);
    }, [groupFilter, studentFilter, categoryFilter]);

    const formatDate = (dateStr: string) => {
        if (!dateStr) return '—';
        try {
            const date = new Date(dateStr);
            return date.toLocaleString('ru-RU', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
            });
        } catch { return '—'; }
    };

    const getGradeDisplay = (grade: string | number) => {
        const g = String(grade);
        switch (g) {
            case '5': return { text: 'Отлично', color: 'text-green-600 font-semibold' };
            case '4': return { text: 'Хорошо', color: 'text-blue-600 font-semibold' };
            case '3': return { text: 'Удовлетворительно', color: 'text-yellow-600 font-semibold' };
            case '2': return { text: 'Неудовлетворительно', color: 'text-red-600 font-semibold' };
            default: return { text: g || '—', color: 'text-slate-600' };
        }
    };

    return (
        <AdminLayout activeTab="statements">
            {/* Filters */}
            <div className="bg-white rounded-xl shadow-md p-6 mb-6 border border-slate-200">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Номер группы</label>
                        <input
                            type="text"
                            value={groupFilter}
                            onChange={(e) => setGroupFilter(e.target.value)}
                            placeholder="Напр: ЛД-301"
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Студент</label>
                        <input
                            type="text"
                            value={studentFilter}
                            onChange={(e) => setStudentFilter(e.target.value)}
                            placeholder="Введите ФИО"
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Тип задания</label>
                        <select
                            value={categoryFilter}
                            onChange={(e) => setCategoryFilter(e.target.value)}
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                        >
                            {dynamicCategories.map((cat) => (
                                <option key={cat} value={cat}>
                                    {cat === 'all' ? 'Все задания' : cat}
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
                            <th className="px-4 py-3 text-center text-sm font-semibold text-slate-700 w-12">№</th>
                            <th className="px-4 py-3 text-center text-sm font-semibold text-slate-700">ФИО студента</th>
                            <th className="px-4 py-3 text-center text-sm font-semibold text-slate-700">Группа</th>
                            <th className="px-4 py-3 text-center text-sm font-semibold text-slate-700">Тип задания</th>
                            <th className="px-4 py-3 text-center text-sm font-semibold text-slate-700">Время начала</th>
                            <th className="px-4 py-3 text-center text-sm font-semibold text-slate-700">Время окончания</th>
                            <th className="px-4 py-3 text-center text-sm font-semibold text-slate-700">Затраченное время</th>
                            <th className="px-4 py-3 text-center text-sm font-semibold text-slate-700">Попытка</th>
                            <th className="px-4 py-3 text-center text-sm font-semibold text-slate-700">Оценка</th>
                        </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                        {paginatedData.length === 0 ? (
                            <tr>
                                <td colSpan={9} className="px-4 py-10 text-center text-slate-500 italic">Данные не найдены</td>
                            </tr>
                        ) : (
                            paginatedData.map((item, index) => {
                                const gradeInfo = getGradeDisplay(item.last_grade);
                                return (
                                    <tr key={index} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-4 py-3 text-center font-semibold text-slate-800">
                                            {(currentPage - 1) * rowsPerPage + index + 1}
                                        </td>
                                        <td className="px-4 py-3 text-center text-slate-700">{item.student_fio}</td>
                                        <td className="px-4 py-3 text-center text-slate-700">{item.group}</td>
                                        <td className="px-4 py-3 text-center text-slate-700">
                                            {item.last_category ? (
                                                <span className="inline-block bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                                                    {item.last_category}
                                                </span>
                                            ) : <span className="text-slate-400">—</span>}
                                        </td>
                                        <td className="px-4 py-3 text-center text-slate-600 text-sm">{formatDate(item.last_start)}</td>
                                        <td className="px-4 py-3 text-center text-slate-600 text-sm">{formatDate(item.last_end)}</td>
                                        <td className="px-4 py-3 text-center text-slate-700 font-mono">{item.last_spent || '—'}</td>
                                        <td className="px-4 py-3 text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                {item.attempts.length > 0 ? (
                                                    item.attempts.map((id, i) => (
                                                        <a key={id} href={`/estimation/${id}`} className="text-blue-600 hover:text-blue-800 hover:underline font-medium">
                                                            {i + 1}
                                                        </a>
                                                    ))
                                                ) : <span className="text-slate-400">—</span>}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <span className={gradeInfo.color}>{gradeInfo.text}</span>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {filteredData.length > 0 && (
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
                        <span className="text-slate-700">
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
        </AdminLayout>
    );
}