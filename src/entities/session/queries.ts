import {queryClient} from "@/shared/api/query-client";


// Выход из аккаунта
export function useResetSession() {

    return () => {
        queryClient.removeQueries();
    };
}
