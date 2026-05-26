"use client";

import { useStatementsListQuery } from "@/entities/statements";
import { useRouter } from "next/navigation";

export function useStatementsList() {
    // ========== Навигация ==========
    const router = useRouter();

    // ========== Запрос данных ==========
    const statementsListQuery = useStatementsListQuery();

    // Извлекаем список ведомостей (с fallback на пустой массив)
    const items = statementsListQuery.data ?? null;

    // ========== Обработчики ==========
    /**
     * Навигация к странице попытки
     * @param id - ID попытки
     */
    const handleItemClick = (id: number) => {
        router.push(`/estimation/${id}`);
    };

    // ========== Возвращаемые значения ==========
    return {
        items,                                 // Список патологий
        isLoading: statementsListQuery.isPending,   // Загрузка данных
        isError: statementsListQuery.isError,       // Ошибка загрузки
        handleClick: handleItemClick,          // Обработчик клика по элементу
        refetch: statementsListQuery.refetch  // рефетч
    };
}