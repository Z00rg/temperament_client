"use client"

import { authApi, SignInBodyDto } from "@/shared/api/authApi";
import { ROUTES } from "@/shared/constants/routes";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import {AxiosError} from "axios";

interface ApiErrorResponse {
  error: string;
}

/**
 * Хук для формы авторизации
 *
 * Обрабатывает:
 * - Валидацию полей email и пароля
 * - Отправку данных на сервер
 * - Редирект после успешного входа
 */

export function useSignInForm() {
  // ========== Навигация ==========
  const router = useRouter();

  // ========== Управление формой ==========
  const { register, handleSubmit } = useForm<{
    email: string;
    password: string;
  }>();

  // ========== Мутация авторизации ==========
  const signInMutation = useMutation({
    mutationFn: (data: SignInBodyDto) => authApi.signIn(data),
    onSuccess: () => {
      router.push(ROUTES.HOME);
    },
  });

  // ========== Обработка ошибок ==========
  // Преобразуем ошибку API в понятное сообщение для пользователя
  const errorMessage = signInMutation.error
      ? (signInMutation.error as AxiosError<ApiErrorResponse>).response?.data?.error
      : undefined;

  // ========== Возвращаемые значения ==========
  return {
    register,      // Функция регистрации полей react-hook-form
    errorMessage,  // Сообщение об ошибке для отображения
    handleSubmit: handleSubmit((data) => signInMutation.mutate(data)), // Обработчик отправки формы
    isPending: signInMutation.isPending, // Индикатор загрузки
  };
}
