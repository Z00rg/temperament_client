import {useQuery} from "@tanstack/react-query";
import {adminSubmissionsAllList} from "@/shared/api/generated";

const statementsListKey = ['statementsList'];

// Запрос попыток для виджета
export function useStatementsListQuery() {

    return useQuery({
        queryKey: statementsListKey,
        queryFn: () => adminSubmissionsAllList(),
        staleTime: 5 * 60 * 1000, // 5 минут
        retry: 0,
    });
}