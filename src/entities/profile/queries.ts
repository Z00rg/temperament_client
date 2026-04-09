import {useQuery} from "@tanstack/react-query";
import { profileRetrieve } from "@/shared/api/generated";

const profileListKey = ['complexityList'];

// Запрос данных профиля для виджета
export function useProfileQuery() {

    return useQuery({
        queryKey: profileListKey,
        queryFn: () => profileRetrieve(),
        staleTime: 60 * 60 * 1000, // 60 минут
        retry: 0,
    });
}