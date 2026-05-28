import {SignOutButton} from "@/features/auth";
import {useProfileQuery} from "@/entities/profile";

interface UiHeaderProps {
    isAdmin?: boolean;
}

export function UiHeader({isAdmin = false}: UiHeaderProps) {
    const useProfile = useProfileQuery();

    const fullName = useProfile.data
        ? `${useProfile.data.surname} ${useProfile.data.name} ${useProfile.data.patronymic}`
        : null;

    return (
        <header className="bg-white shadow-md border-b border-slate-200">
            <div className="container mx-auto px-4 sm:px-6 py-3 sm:py-4">
                <div className="flex items-center justify-between gap-3">

                    {/* Left — лого + название */}
                    <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                        <div className="shrink-0">
                            <img
                                src="/logic-trainer/logo.png"
                                width={190}
                                height={70}
                                alt="Логотип приложения"
                                style={{ height: 'auto', width: 'auto', maxWidth: '120px' }}
                                className="sm:max-w-[190px]"
                            />
                        </div>
                        <div className="flex flex-col min-w-0 hidden sm:flex">
                            <h1 className="text-lg sm:text-xl font-bold text-slate-800 leading-tight">
                                Тренажеры для обучающихся
                            </h1>
                            <p className="text-xs sm:text-sm text-slate-500 truncate">
                                {isAdmin
                                    ? 'Административная панель'
                                    : 'Самарский государственный медицинский университет'}
                            </p>
                        </div>
                    </div>

                    {/* Right — пользователь + кнопка выхода */}
                    <div className="flex items-center gap-2 sm:gap-6 shrink-0">
                        {!useProfile.isPending && fullName && (
                            <div className="flex flex-col items-end">
                                {isAdmin ? (
                                    <span className="font-semibold text-slate-800 text-sm sm:text-base text-right">
                                        {fullName}
                                    </span>
                                ) : (
                                    <>
                                        {/* На мобилке — только имя, без лейблов */}
                                        <span className="font-semibold text-slate-800 text-xs sm:text-sm text-right leading-tight">
                                            {fullName}
                                        </span>
                                        {useProfile.data?.group && (
                                            <div className="flex items-center gap-1">
                                                <span className="text-xs text-slate-500 hidden sm:inline">Группа:</span>
                                                <span className="font-semibold text-slate-700 text-xs">
                                                    {useProfile.data.group}
                                                </span>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        )}
                        <SignOutButton/>
                    </div>
                </div>
            </div>
        </header>
    );
}