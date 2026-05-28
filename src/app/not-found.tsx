"use client";

import { FiAlertCircle } from "react-icons/fi";

export default function NotFound() {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen px-5 py-10 ">
            <div className="rounded-2xl shadow-md max-w-md w-full p-8 flex flex-col items-center gap-6">
                <FiAlertCircle className="text-red-500 w-14 h-14" />
                <h1 className="text-2xl font-bold text-gray-800 text-center">
                    Страница не найдена
                </h1>
                <p className="text-gray-500 text-center">
                    Упс! Похоже, такой страницы не существует.
                </p>
            </div>
        </div>
    );
}
