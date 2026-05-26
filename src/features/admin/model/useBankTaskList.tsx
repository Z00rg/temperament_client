"use client";

import {useBankTaskListQuery} from "@/entities/bank-tasks";
import {useDeleteTaskMutationQuery} from "@/entities/bank-tasks/queries";

export function useBankTaskList() {
    // ========== Запрос данных ==========
    const bankTaskListQuery = useBankTaskListQuery();
    const deleteMutation = useDeleteTaskMutationQuery();

    // Извлекаем список ведомостей (с fallback на пустой массив)
    const items = bankTaskListQuery.data ?? [];

    // Удаление задания
    const handleDeleteClinicalCase = (id: number) => {
        if (window.confirm("Вы уверены, что хотите удалить этот задание?")) {
            deleteMutation.mutate(id);
        }
    };

    // ========== Возвращаемые значения ==========
    return {
        items,                                 // Список патологий
        isLoading: bankTaskListQuery.isPending,   // Загрузка данных
        isError: bankTaskListQuery.isError,       // Ошибка загрузки
        handleDeleteClinicalCase,                // Удаление задания
    };
}