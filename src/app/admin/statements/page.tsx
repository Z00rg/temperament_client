'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import AdminLayout from '@/shared/layouts/AdminLayout';

// ─── Типы API ─────────────────────────────────────────────────────────────────

/**
 * GET http://localhost:8000/api/admin/submissions/all/
 * Сводная таблица: все студенты со сданными попытками
 */
interface SubmissionRow {
    student_fio:   string;
    group:         string;
    last_start:    string;
    last_end:      string;
    last_spent:    string;
    last_grade:    string;
    last_category: string;
    /**
     * Сервер возвращает строку — либо JSON-массив '["121","122"]',
     * либо comma-separated "121,122". Парсим в parseAttempts().
     */
    attempts: string;
}

// ─── Хелперы ─────────────────────────────────────────────────────────────────

/**
 * Безопасно парсит attempts из строки в string[].
 * Поддерживает JSON-массив и comma-separated формат.
 */
function parseAttempts(raw: string): string[] {
    if (!raw || raw.trim() === '') return [];
    try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed.map(String);
    } catch { /* не JSON — пробуем CSV */ }
    return raw.split(',').map(s => s.trim()).filter(Boolean);
}

function formatDate(dateStr: string): string {
    if (!dateStr) return '—';
    try {
        return new Date(dateStr).toLocaleString('ru-RU', {
            day:    '2-digit',
            month:  '2-digit',
            year:   'numeric',
            hour:   '2-digit',
            minute: '2-digit',
            second: '2-digit',
        });
    } catch { return '—'; }
}

interface GradeDisplay { text: string; color: string; }

function getGradeDisplay(grade: string): GradeDisplay {
    switch (String(grade)) {
        case '5': return { text: 'Отлично',             color: 'text-green-600 font-semibold' };
        case '4': return { text: 'Хорошо',              color: 'text-blue-600 font-semibold'  };
        case '3': return { text: 'Удовлетворительно',   color: 'text-yellow-600 font-semibold'};
        case '2': return { text: 'Неудовлетворительно', color: 'text-red-600 font-semibold'   };
        default:  return { text: grade || '—',          color: 'text-slate-600'               };
    }
}

// ─── Константы ───────────────────────────────────────────────────────────────

const ROWS_PER_PAGE = 10;

// ─── Компонент ────────────────────────────────────────────────────────────────

export default function StatementsPage() {
    // ── данные ──
    const [rows,    setRows]    = useState<SubmissionRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [error,   setError]   = useState<string | null>(null);

    // ── фильтры ──
    const [groupFilter,    setGroupFilter]    = useState('');
    const [studentFilter,  setStudentFilter]  = useState('');
    const [categoryFilter, setCategoryFilter] = useState('all');

    // ── пагинация ──
    const [currentPage, setCurrentPage] = useState(1);

    // ── загрузка данных ──
    const loadData = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const res  = await fetch('http://localhost:8000/api/admin/submissions/all/');
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data: SubmissionRow[] = await res.json();
            setRows(data);
        } catch (err) {
            console.error('Ошибка загрузки ведомостей:', err);
            setError('Не удалось загрузить данные. Попробуйте обновить страницу.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { loadData(); }, [loadData]);

    // ── список категорий для фильтра ──
    const categories = useMemo(() => {
        const unique = Array.from(
            new Set(rows.map(r => r.last_category).filter(Boolean))
        );
        return unique;
    }, [rows]);

    // ── фильтрация ──
    const filteredRows = useMemo(() => {
        const g = groupFilter.trim().toLowerCase();
        const s = studentFilter.trim().toLowerCase();

        return rows.filter(row => {
            const matchGroup    = !g || row.group.toLowerCase().includes(g);
            const matchStudent  = !s || row.student_fio.toLowerCase().includes(s);
            const matchCategory = categoryFilter === 'all' || row.last_category === categoryFilter;
            return matchGroup && matchStudent && matchCategory;
        });
    }, [rows, groupFilter, studentFilter, categoryFilter]);

    // ── пагинация ──
    const totalPages     = Math.max(1, Math.ceil(filteredRows.length / ROWS_PER_PAGE));
    const paginatedRows  = useMemo(() => {
        const start = (currentPage - 1) * ROWS_PER_PAGE;
        return filteredRows.slice(start, start + ROWS_PER_PAGE);
    }, [filteredRows, currentPage]);

    // Сброс страницы при изменении фильтров
    useEffect(() => { setCurrentPage(1); }, [groupFilter, studentFilter, categoryFilter]);

    // ─────────────────────────────────────────────────────────────────────────
    return (
        <AdminLayout activeTab="statements">

            {/* Фильтры */}
            <div className="bg-white rounded-xl shadow-md p-6 mb-6 border border-slate-200">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                            Номер группы
                        </label>
                        <input
                            type="text"
                            value={groupFilter}
                            onChange={e => setGroupFilter(e.target.value)}
                            placeholder="Напр: ЛД-301"
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                            Студент
                        </label>
                        <input
                            type="text"
                            value={studentFilter}
                            onChange={e => setStudentFilter(e.target.value)}
                            placeholder="Введите ФИО"
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                            Тип задания
                        </label>
                        <select
                            value={categoryFilter}
                            onChange={e => setCategoryFilter(e.target.value)}
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                        >
                            <option value="all">Все задания</option>
                            {categories.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* Состояния загрузки / ошибки */}
            {loading && (
                <div className="bg-white rounded-xl shadow-md border border-slate-200 p-16 flex items-center justify-center">
                    <div className="flex flex-col items-center gap-3 text-slate-500">
                        <svg className="w-8 h-8 animate-spin text-blue-500" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                        </svg>
                        <span className="text-sm">Загрузка ведомостей...</span>
                    </div>
                </div>
            )}

            {error && !loading && (
                <div className="bg-white rounded-xl shadow-md border border-red-200 p-8 text-center">
                    <p className="text-red-600 mb-4">{error}</p>
                    <button
                        onClick={loadData}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-colors"
                    >
                        Повторить
                    </button>
                </div>
            )}

            {/* Таблица */}
            {!loading && !error && (
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
                                <th className="px-4 py-3 text-center text-sm font-semibold text-slate-700">Попытки</th>
                                <th className="px-4 py-3 text-center text-sm font-semibold text-slate-700">Оценка</th>
                            </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                            {paginatedRows.length === 0 ? (
                                <tr>
                                    <td colSpan={9} className="px-4 py-12 text-center text-slate-400 italic">
                                        Данные не найдены
                                    </td>
                                </tr>
                            ) : (
                                paginatedRows.map((row, index) => {
                                    const gradeInfo  = getGradeDisplay(row.last_grade);
                                    const attempts   = parseAttempts(row.attempts);

                                    return (
                                        <tr key={index} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-4 py-3 text-center font-semibold text-slate-800">
                                                {(currentPage - 1) * ROWS_PER_PAGE + index + 1}
                                            </td>
                                            <td className="px-4 py-3 text-center text-slate-700">
                                                {row.student_fio}
                                            </td>
                                            <td className="px-4 py-3 text-center text-slate-700">
                                                {row.group}
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                {row.last_category ? (
                                                    <span className="inline-block bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                                                            {row.last_category}
                                                        </span>
                                                ) : (
                                                    <span className="text-slate-400">—</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-center text-slate-600 text-sm">
                                                {formatDate(row.last_start)}
                                            </td>
                                            <td className="px-4 py-3 text-center text-slate-600 text-sm">
                                                {formatDate(row.last_end)}
                                            </td>
                                            <td className="px-4 py-3 text-center text-slate-700 font-mono">
                                                {row.last_spent || '—'}
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                {attempts.length > 0 ? (
                                                    <div className="flex items-center justify-center gap-2">
                                                        {attempts.map((id, i) => (
                                                            <a
                                                                key={id}
                                                                href={`/estimation/${id}`}
                                                                className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-blue-100 text-blue-700 hover:bg-blue-200 text-xs font-semibold transition-colors"
                                                                title={`Попытка ${i + 1} (id: ${id})`}
                                                            >
                                                                {i + 1}
                                                            </a>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <span className="text-slate-400">—</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                    <span className={gradeInfo.color}>
                                                        {gradeInfo.text}
                                                    </span>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                            </tbody>
                        </table>
                    </div>

                    {/* Пагинация */}
                    {filteredRows.length > ROWS_PER_PAGE && (
                        <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex justify-center items-center gap-4">
                            <button
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className={`p-2 rounded-lg transition-colors ${
                                    currentPage === 1
                                        ? 'text-slate-400 cursor-not-allowed'
                                        : 'text-slate-600 hover:bg-slate-200'
                                }`}
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                </svg>
                            </button>
                            <span className="text-slate-700 text-sm">
                                Страница{' '}
                                <span className="font-semibold">{currentPage}</span>
                                {' '}из{' '}
                                <span className="font-semibold">{totalPages}</span>
                            </span>
                            <button
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                className={`p-2 rounded-lg transition-colors ${
                                    currentPage === totalPages
                                        ? 'text-slate-400 cursor-not-allowed'
                                        : 'text-slate-600 hover:bg-slate-200'
                                }`}
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