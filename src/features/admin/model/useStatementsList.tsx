"use client";

import { useStatementsListQuery } from "@/entities/statements";
import { useRouter } from "next/navigation";

export function useStatementsList() {
    // ========== Навигация ==========
    const router = useRouter();

    // ========== Запрос данных ==========
    const statementsListQuery = useStatementsListQuery();

    // Извлекаем список патологий (с fallback на пустой массив)
    const items = statementsListQuery.data ?? [];

    // ========== Обработчики ==========
    /**
     * Навигация к странице детальной информации о патологии
     * @param id - ID патологии
     */
    const handleItemClick = (id: number) => {
        router.push(`/pathology/${id}`);
    };

    // ========== Возвращаемые значения ==========
    return {
        items,                                 // Список патологий
        isLoading: statementsListQuery.isPending,   // Загрузка данных
        isError: statementsListQuery.isError,       // Ошибка загрузки
        handleClick: handleItemClick,          // Обработчик клика по элементу
    };
}