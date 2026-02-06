"use client";

import {useSignInForm} from "../model/use-sign-in-form";
import {UiButton} from "@/shared/ui/ui-button";
import {UiTextField} from "@/shared/ui/ui-text-field";
import {UiSpinner} from "@/shared/ui/ui-spinner";
import {UiLink} from "@/shared/ui/ui-link";
import {ROUTES} from "@/shared/constants/routes";

export function SignInForm() {
    const {register, handleSubmit, errorMessage, isPending} = useSignInForm();

    return (
        <form
            className="flex flex-col w-full max-w-md mx-auto px-5 py-6 gap-6"
            onSubmit={handleSubmit}
            action="/auth/login/"
            method="POST"
        >
            {/* Заголовок */}
            <div className="flex flex-col gap-2">
                <h1 className="text-2xl font-bold text-gray-800">Авторизация</h1>
                <p className="text-sm text-gray-600">
                    Войдите в свой аккаунт для продолжения
                </p>
            </div>

            {/* Поля формы */}
            <div className="flex flex-col gap-4">
                <UiTextField
                    label="Email"
                    placeholder="example@mail.com"
                    inputProps={{
                        ...register("email", {required: true}),
                        type: "email",
                        name: "email",
                        autoComplete: "email",
                    }}
                />
                <UiTextField
                    label="Пароль"
                    placeholder="Введите пароль"
                    inputProps={{
                        type: "password",
                        ...register("password", {required: true}),
                        name: "password",
                        autoComplete: "current-password",
                    }}
                />
            </div>

            {/* Сообщение об ошибке */}
            {errorMessage && (
                <div
                    className="flex items-center gap-2 p-3 bg-red-50 border-l-4 border-red-500 rounded text-sm text-red-600">
                    <svg className="w-5 h-5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd"
                              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                              clipRule="evenodd"/>
                    </svg>
                    {errorMessage}
                </div>
            )}

            {/* Кнопка входа */}
            <UiButton className="w-full mt-2" disabled={isPending}>
                {isPending ? <UiSpinner/> : "Войти"}
            </UiButton>

            {/* Ссылка на регистрацию */}
            <div className="text-center text-base text-gray-600">
                Нет аккаунта?{" "}
                <UiLink href={ROUTES.SIGN_UP} className="text-[#2E76AA] hover:text-[#26628A] font-medium">
                    Зарегистрироваться
                </UiLink>
            </div>
        </form>
    );
}