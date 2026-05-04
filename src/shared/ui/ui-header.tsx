import Image from "next/image";
import {SignOutButton} from "@/features/auth";
import {useProfileQuery} from "@/entities/profile";

interface UiHeaderProps {
    isAdmin?: boolean;
}

export function UiHeader({isAdmin = false}: UiHeaderProps) {
    const useProfile = useProfileQuery();

    console.log('profile data:', useProfile.data);

    return (
        <header className="bg-white shadow-md border-b border-slate-200">
            <div className="container mx-auto px-6 py-4">
                <div className="flex items-center justify-between">
                    {/* Left side - Logo and Title */}
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-3">
                            <Image
                                src="/logo.png"
                                width={190}
                                height={70}
                                alt="Логотип приложения"
                            />
                            <div className="flex flex-col">
                                <h1 className="text-xl font-bold text-slate-800">
                                    Тренажеры для обучающихся
                                </h1>
                                <p className="text-sm text-slate-500">
                                    {isAdmin
                                        ? 'Административная панель'
                                        : 'Самарский государственный медицинский университет'}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Right side - User Info and Logout */}
                    <div className="flex items-center gap-6">
                        {!useProfile.isPending && useProfile.data && (
                            <div className="flex flex-col items-end">
                                {isAdmin ? (
                                    <span className="font-semibold text-slate-800">
                                        {useProfile.data.surname} {useProfile.data.name} {useProfile.data.patronymic}
                                    </span>
                                ) : (
                                    <>
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm text-slate-600">Студент:</span>
                                            <span className="font-semibold text-slate-800">
                                                {useProfile.data.surname} {useProfile.data.name} {useProfile.data.patronymic}
                                            </span>
                                        </div>
                                        {useProfile.data.group && (
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm text-slate-600">Группа:</span>
                                                <span className="font-semibold text-slate-800">
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