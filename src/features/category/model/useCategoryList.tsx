"use client";

import { useRouter } from "next/navigation";
import {useCategoryListQuery} from "@/entities/category";
import {useState} from "react";
import {queue} from "@/shared/ui/Toast";
import {CategoryConfigCRUD} from "@/shared/api/generated";

export function useCategoryList() {
    const [selectedCategory, setSelectedCategory] = useState<CategoryConfigCRUD>();

    const router = useRouter();

    const categoryListQuery = useCategoryListQuery();

    const items = categoryListQuery.data ?? [];

    const handleItemClick = (category: CategoryConfigCRUD) => {
        setSelectedCategory(category);
    };

    const handleItemStart = () => {
        if (!selectedCategory) {
            queue.add({
                title: 'Выберите тест',
                type: 'warning'
            }, {
                timeout: 3000
            });
            return;
        }

        router.push(`/description/${selectedCategory.id}`);
    };


    return {
        items,                                 // Список патологий
        isLoading: categoryListQuery.isPending,   // Загрузка данных
        isError: categoryListQuery.isError,       // Ошибка загрузки
        handleClick: handleItemClick,          // Просмотр доп информации
        handleStart: handleItemStart,          // Переход на категорию задания
        selectedCategory                       // Состояние выбранных категорий
    };
}