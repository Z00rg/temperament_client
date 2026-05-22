import {useMutation, useQuery} from "@tanstack/react-query";
import {
    submissionsControlSubmitCreate,
    submissionsEducationCheckCreate,
    SubmitRequest,
    tasksControlRandomRetrieve, tasksEducationRandomRetrieve
} from "@/shared/api/generated";
import {queue} from "@/shared/ui/Toast";

const controlTaskKey = ["control-task"];
const educationTaskKey = ["education-task"];

// Запрос теста для прохождения с оценкой
export function useControlTaskQuery() {

    return useQuery({
        queryKey: controlTaskKey,
        queryFn: () => tasksControlRandomRetrieve(),
        retry: 0,
        staleTime: 5 * 60 * 1000, // 5 минут
    });
}

// Отправка ответов на задание с оценкой
export function useSubmitControlTaskMutation() {

    return useMutation({
        mutationFn: (submitRequest: SubmitRequest) =>
            submissionsControlSubmitCreate(submitRequest),
        onSuccess: () => {
            queue.add({
                title: 'Ответы отправлены',
                description: 'Ответы на задание успешно отправлены на проверку',
                type: 'success'
            }, {
                timeout: 3000
            });
        },

        onError: (error) => {
            console.error("Ошибка при отправке ответов:", error);

            queue.add({
                title: 'Ошибка: ответы не были отправлены',
                description: `Ошибка при отправке ответов: ${error}`,
                type: 'error'
            }, {
                timeout: 3000
            });
        },
    });
}

// Запрос теста для прохождения без оценки
export function useEducationTaskQuery() {

    return useQuery({
        queryKey: educationTaskKey,
        queryFn: () => tasksEducationRandomRetrieve(),
        retry: 0,
        staleTime: 5 * 60 * 1000, // 5 минут
    });
}

// Отправка ответов на задание без оценки
export function useSubmitEducationTaskMutation() {

    return useMutation({
        mutationFn: (submitRequest: SubmitRequest) =>
            submissionsEducationCheckCreate(submitRequest),
        onSuccess: () => {
            queue.add({
                title: 'Ответы отправлены',
                description: 'Ответы на тесты успешно отправлены на проверку',
                type: 'success'
            }, {
                timeout: 3000
            });
        },

        onError: (error) => {
            console.error("Ошибка при отправке ответов:", error);

            queue.add({
                title: 'Ошибка: ответы не были отправлены',
                description: `Ошибка при отправке ответов: ${error}`,
                type: 'error'
            }, {
                timeout: 3000
            });
        },
    });
}