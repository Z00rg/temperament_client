import { useQuery } from "@tanstack/react-query";
import {
    submissionRetrieve,
} from "@/shared/api/generated";

const estimationKey = (id: number) => ["estimation", id];

// Запрос данных для странички оценки
export function useEstimationQuery(estimationId: number) {

    return useQuery({
        queryKey: estimationKey(estimationId),
        queryFn: () => submissionRetrieve(estimationId),
        enabled: !!estimationId,
        staleTime: 60 * 60 * 1000, // 60 минут
        retry: 0,
    });
}