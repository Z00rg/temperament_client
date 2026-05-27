import axios, { AxiosError, AxiosRequestConfig } from "axios";
import {queryClient} from "@/shared/api/query-client";
import {authApi} from "@/shared/api/authApi";

const CSRF_TOKEN_KEY = "csrftoken";
const AUTH_URLS = [
    "/login/",
    "/refresh_token/",
    "/register/worker/",
    "/logout/",
];

export function getCookie(name: string): string | null {
    const matches = document.cookie.match(new RegExp(
        "(?:^|; )" + name.replace(/([.$?*|{}()\[\]\\/+^])/g, '\\$1') + "=([^;]*)"
    ));
    return matches ? decodeURIComponent(matches[1]) : null;
}

export const apiInstance = axios.create({
    baseURL: "/api",
    headers: {
        "Content-Type": "application/json",
    },
    withCredentials: true,
});

const isAuthUrl = (url: string) => {
    const normalizedUrl = url.startsWith("/") ? url.slice(1) : url;

    return AUTH_URLS.some((authPath) => {
        const normalizedAuthPath = authPath.startsWith("/")
            ? authPath.slice(1)
            : authPath;
        return normalizedUrl.includes(normalizedAuthPath);
    });
};

// --- Request Interceptor ---
apiInstance.interceptors.request.use(
    (config) => {
        const csrfToken = getCookie(CSRF_TOKEN_KEY);
        if (csrfToken && config.headers) {
            config.headers["X-CSRFToken"] = csrfToken;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Интерцептор ответов: логика обновления токена и обработка ошибок 401, 403
apiInstance.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;
        const requestUrl = originalRequest.url || "";

        // Обработка и 401 и 403
        const isAuthError = error.response?.status === 401 || error.response?.status === 403;
        const isNotRetry = !originalRequest?._isRetry;
        const isAuthEndpoint = isAuthUrl(requestUrl);

        // Первая auth-ошибка — refresh
        if ( isAuthError && isNotRetry && !isAuthEndpoint ) {
            originalRequest._isRetry = true;
            try {
                await apiInstance.post("/refresh_token/");
                return apiInstance(originalRequest);
            } catch {
                return handleAuthFailure();
            }
        }

        // Повторная auth-ошибка — logout
        if (isAuthError && originalRequest?._isRetry && !isAuthEndpoint) {
            return handleAuthFailure();
        }

        // Всё остальное проброс далее
        return Promise.reject(error);
    }
);

async function handleAuthFailure() {
    console.error("Token refresh failed. Session expired, redirecting to login");
    queryClient.removeQueries();
    try {
        await authApi.signOut();
    } catch (logoutError) {
        console.error(logoutError);
    } finally {
        // Принудительный редирект
        if (typeof window !== 'undefined') {
            window.location.replace("/sign-in");

        }
    }

    return Promise.reject(new Error('AUTH_EXPIRED'));
}

export const createInstance = <T>(
    config: AxiosRequestConfig,
    options?: AxiosRequestConfig
): Promise<T> => {
    return apiInstance({
        ...config,
        ...options,
    }).then((r) => r.data);
};

export type RequestOptions = Parameters<typeof createInstance>[1];

export type BodyType<Data> = Data;

export type ErrorType<Error> = AxiosError<Error>;