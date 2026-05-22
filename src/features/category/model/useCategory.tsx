"use client";

import {useParams, useRouter} from "next/navigation";
import {useCategoryQuery} from "@/entities/category";

export function useCategory() {

    const router = useRouter();

    const params = useParams();
    const categoryId = params.categoryId;

    const categoryQuery = useCategoryQuery(Number(categoryId));

    const item = categoryQuery.data?.data ?? null;

    const isEmpty = !categoryQuery.isPending && !item;

    const handleControlClick = () => {
        router.push(`/task/${categoryId}?mode=control`);
    };

    const handleEducationClick = (complexityId: number, closeModal: () => void) => {
        router.push(`/task/${categoryId}?mode=training&complexity=${complexityId}`);
        closeModal();
    };

    const handleBack = () => {
        router.push('/');
    };


    return {
        item,                                 // Список патологий
        isLoading: categoryQuery.isPending,   // Загрузка данных
        isError: categoryQuery.isError,       // Ошибка загрузки
        isEmpty,                              // Статус пустого массива
        handleControlClick,                  // Переход к заданию с оценкой
        handleEducationClick,                 // Переход к заданию без оценки
        handleBack                          // Роутинг на прошлую страничку
    };
}