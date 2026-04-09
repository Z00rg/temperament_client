import {useQuery} from "@tanstack/react-query";
import {complexityAllList, complexityRetrieve} from "@/shared/api/generated";

const complexityListKey = ['complexityList'];
const complexityKey = (id: number) => ["complexity", id];

// Запрос списка категорий с их описаниями
export function useComplexityListQuery() {

    return useQuery({
        queryKey: complexityListKey,
        queryFn: () => complexityAllList(),
        staleTime: 60 * 60 * 1000, // 60 минут
        retry: 0,
    });
}

// Запрос определенной категории заданий (при переходе с главной странички)
export function useComplexityQuery(complexityId: number) {

    return useQuery({
        queryKey: complexityKey(complexityId),
        queryFn: () => complexityRetrieve(complexityId),
        enabled: !!complexityId,
        staleTime: 60 * 60 * 1000, // 60 минут
        retry: 0,
    });
}
