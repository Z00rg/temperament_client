import {useQuery} from "@tanstack/react-query";
import {categoryConfigAllRetrieve, categoryConfigRetrieve} from "@/shared/api/generated";

const categoryListKey = ['categoryList'];
const categoryKey = (id: number) => ["category", id];

// Запрос списка категорий с их описаниями
export function useCategoryListQuery() {

    return useQuery({
       queryKey: categoryListKey,
       queryFn: () => categoryConfigAllRetrieve(),
       staleTime: 60 * 60 * 1000, // 60 минут
       retry: 0,
    });
}

// Запрос определенной категории заданий (при переходе с главной странички)
export function useCategoryQuery(categoryId: number) {

    return useQuery({
        queryKey: categoryKey(categoryId),
        queryFn: () => categoryConfigRetrieve(categoryId),
        enabled: !!categoryId,
        staleTime: 60 * 60 * 1000, // 60 минут
        retry: 0,
    });
}
