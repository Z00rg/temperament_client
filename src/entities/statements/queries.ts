import {useQuery} from "@tanstack/react-query";
import {taskBankRetrieve} from "@/shared/api/generated";

const statementsListKey = ['statementsList'];

// Запрос данных профиля для виджета
export function useStatementsQuery() {

    return useQuery({
        queryKey: statementsListKey,
        queryFn: () => taskBankRetrieve(),
        staleTime: 5 * 60 * 1000, // 5 минут
        retry: 0,
    });
}