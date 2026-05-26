import {useMutation, useQuery} from "@tanstack/react-query";
import {
    categoryConfigFormList,
    taskBankList, taskDeleteDestroy,
    TaskFormCreate,
    tasksCreate,
    tasksRetrieve, tasksUpdateUpdate
} from "@/shared/api/generated";
import {queryClient} from "@/shared/api/query-client";
import {queue} from "@/shared/ui/Toast";

const bankTasksListKey = ['bankTasksList'];
const taskCategoriesKey = ['taskCategories'];
const taskInfoKey = (id: number) => ["taskInfo", id];

// Запрос списка заданий
export function useBankTaskListQuery() {

    return useQuery({
        queryKey: bankTasksListKey,
        queryFn: () => taskBankList(),
        staleTime: 5 * 60 * 1000, // 5 минут
        retry: 0,
    });
}

// Запрос данных задания для отображения в форме редактирования
export function useTaskInfoQuery(taskId: number) {

    return useQuery({
        queryKey: taskInfoKey(taskId),
        queryFn: () => tasksRetrieve(taskId),
        enabled: !!taskId,
        staleTime: 60 * 60 * 1000, // 60 минут
        retry: 0,
    });
}

// Запрос категорий с данными для создания задания
export function useTaskCategoriesQuery() {

    return useQuery({
        queryKey: taskCategoriesKey,
        queryFn: () => categoryConfigFormList(),
        staleTime: 60 * 60 * 1000, // 60 минут
        retry: 0,
    });
}

// Добавление нового задания
export function useCreateTaskMutationQuery({ closeModal }: { closeModal: () => void }) {
    return useMutation({
        mutationFn: (data: TaskFormCreate) => tasksCreate(data),
        onSuccess: () => {
            queryClient.invalidateQueries();
            closeModal();

            queue.add({
                title: 'Задание добавлено',
                description: 'Задание успешно добавлено в систему',
                type: 'success'
            }, {
                timeout: 3000
            });
        },
        onError: (error) => {
            console.error("Ошибка при добавлении задания:", error);

            queue.add({
                title: 'Задание не была добавлена',
                description: `Ошибка при добавлении задания: ${error}`,
                type: 'error'
            }, {
                timeout: 3000
            });
        },
    });
}


// Удаление задания
export function useDeleteTaskMutationQuery() {
    return useMutation({
        mutationFn: (id: number) => taskDeleteDestroy(id),
        onSuccess: () => {
            queryClient.invalidateQueries();

            queue.add({
                title: 'Задание успешно удален',
                type: 'success'
            }, {
                timeout: 3000
            });
        },
        onError: (error) => {
            console.error("Ошибка при удалении задания:", error);

            queue.add({
                title: 'Ошибка при удалении задания',
                type: 'error'
            }, {
                timeout: 3000
            });
        },
    });
}

// Редактирование задания
export function useEditTaskMutationQuery({ closeModal }: { closeModal: () => void }) {
    return useMutation ({
        mutationFn: ({id, data}: {id: number; data: TaskFormCreate}) => tasksUpdateUpdate(id, data),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: taskInfoKey(variables.id) });
            closeModal();

            queue.add({
                title: 'Задание изменено',
                description: 'Задание успешно изменено',
                type: 'success'
            }, {
                timeout: 3000
            });
        },
        onError: (error) => {
            console.error("Ошибка при изменении задания:", error);

            queue.add({
                title: 'Задание не была изменено',
                description: `Ошибка при изменении задания: ${error}`,
                type: 'error'
            }, {
                timeout: 3000
            });
        },
    });
}