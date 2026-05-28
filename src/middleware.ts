import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// 1. Конфигурация путей
const AUTH_ROUTES = ['/sign-in', '/sign-up'];
const ADMIN_ROUTE = '/admin/statements';
const ACCESS_COOKIE_NAME = 'access';
const REFRESH_COOKIE_NAME = 'refresh';
const PERMISSION_COOKIE_NAME = 'user_role';

// 2. Заголовки безопасности
const securityHeaders = {
    'X-Frame-Options': 'DENY',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'origin-when-cross-origin',
    'X-XSS-Protection': '1; mode=block',
};

export default function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;
    const refreshCookie = request.cookies.get(REFRESH_COOKIE_NAME);
    const userRoleCookie = request.cookies.get(PERMISSION_COOKIE_NAME);

    const isAuthPath = AUTH_ROUTES.some(route => pathname.startsWith(route));
    const isAdminPath = pathname.startsWith(ADMIN_ROUTE);
    const isAdmin = userRoleCookie?.value === "admin";
    const isWorker = userRoleCookie?.value === "student";

    let response: NextResponse;

    // Корневая страничка находиться по /menu
    if (pathname === '/' || pathname === '') {
        return NextResponse.redirect(new URL('/logic-trainer/menu', request.url));
    }

    // --- ЛОГИКА АВТОРИЗАЦИИ ---
    if (!refreshCookie) {
        // Пользователь НЕ залогинен
        if (isAuthPath) {
            response = NextResponse.next();
        } else {
            const signInUrl = new URL('/logic-trainer/sign-in', request.url);
            signInUrl.searchParams.set('redirect', pathname);
            response = NextResponse.redirect(signInUrl);
        }

        // Защита от рассинхронизации севера и клиента
        response.cookies.delete(ACCESS_COOKIE_NAME);
        response.cookies.delete(REFRESH_COOKIE_NAME);
        response.cookies.delete(PERMISSION_COOKIE_NAME);
    } else {
        // Пользователь ЗАЛОГИНЕН

        // Не пускаем залогиненных на страницы логина/регистрации
        if (isAuthPath) {
            // Редирект в зависимости от роли
            const redirectUrl = isAdmin ? ADMIN_ROUTE : '/logic-trainer/menu';
            response = NextResponse.redirect(new URL(redirectUrl, request.url));
        }
        // Проверка доступа для админов
        else if (isAdmin) {
            // Админ имеет доступ ко всем страницам
            response = NextResponse.next();
        }
        // Проверка доступа для обычных пользователей (workers)
        else if (isWorker) {
            // Worker НЕ может быть на /admin-home
            if (isAdminPath) {
                response = NextResponse.redirect(new URL('/logic-trainer/menu', request.url));
            } else {
                response = NextResponse.next();
            }
        }
        // Если роль не определена (на всякий случай)
        else {
            // Разлогиниваем пользователя без роли
            const signInUrl = new URL('/logic-trainer/sign-in', request.url);
            response = NextResponse.redirect(signInUrl);
            response.cookies.delete(ACCESS_COOKIE_NAME);
            response.cookies.delete(REFRESH_COOKIE_NAME);
            response.cookies.delete(PERMISSION_COOKIE_NAME);
        }
    }

    // --- ДОБАВЛЕНИЕ SECURITY HEADERS ---
    Object.entries(securityHeaders).forEach(([key, value]) => {
        response.headers.set(key, value);
    });

    return response;
}

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|apple-icon.png|icon-192.png|icon-512.jpg|.*\\.(?:svg|png|jpg|jpeg|gif|webp|pdf)).*)',
        '/',
    ],
};