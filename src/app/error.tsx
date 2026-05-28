"use client";

import { FiAlertCircle } from "react-icons/fi";
import clsx from "clsx";

export default function Error({
                                  error,
                                  reset,
                              }: {
    error: Error;
    reset: () => void;
}) {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen px-5 py-10 ">
            <div className="rounded-2xl shadow-md max-w-md w-full p-8 flex flex-col items-center gap-6">
                {/* Иконка */}
                <FiAlertCircle className="text-red-500 w-14 h-14" />

                {/* Заголовок */}
                <h1 className="text-2xl font-bold text-gray-800 text-center">
                    Упс! Что-то пошло не так
                </h1>

                {/* Описание */}
                <p className="text-gray-500 text-center">
                    Произошла ошибка при загрузке страницы. Попробуйте обновить или вернуться позже.
                </p>

                {/* Сообщение об ошибке (для разработчика) */}
                <pre className="text-xs text-gray-400 wrap-break-word bg-gray-100 p-3 rounded-lg w-full max-h-32 overflow-auto">
          {error.message}
        </pre>

                {/* Кнопка */}
                <button
                    onClick={reset}
                    className={clsx(
                        "mt-3 w-full py-3 rounded-xl font-medium text-white cursor-pointer",
                        "bg-linear-to-r from-blue-500 to-blue-600",
                        "hover:from-blue-600 hover:to-blue-700 active:from-blue-700 active:to-blue-800",
                        "transition-all duration-200"
                    )}
                >
                    Попробовать снова
                </button>
            </div>
        </div>
    );
}
