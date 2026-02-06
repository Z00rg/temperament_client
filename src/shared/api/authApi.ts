import {createInstance, RequestOptions} from "./api-instance";

// DTO

export interface SignInBodyDto {
    email: string;
    password: string;
}

export interface GetTokenDto {
    refresh_token: string;
    access_token: string;
}

export interface SignUpBodyDto {
    name: string;
    surname: string;
    patronymic: string;
    work: string;
    position: string;
    email: string;
    password: string;
    password2: string;
}

// API

// Авторизация
const signIn = (body: SignInBodyDto, options?: RequestOptions) =>
    createInstance<GetTokenDto>(
        {
            url: "/login/",
            method: "POST",
            data: body,
        },
        options
    );

// Регистрация
const signUp = (body: SignUpBodyDto, options?: RequestOptions) =>
    createInstance<void>(
        {
            url: "/register/worker/",
            method: "POST",
            data: body,
        },
        options
    );

// Выход из аккаунта
const signOut = (options?: RequestOptions) =>
    createInstance<void>(
        {
            url: "/logout/",
            method: "POST",
        },
        options
    );

export const authApi = {
    signIn,
    signUp,
    signOut,
};
