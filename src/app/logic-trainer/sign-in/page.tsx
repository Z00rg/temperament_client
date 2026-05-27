import {SignInForm} from "@/features/auth";
import {Metadata} from "next";
import Image from "next/image";

export const metadata: Metadata = {
    title: "Авторизация",
    robots: {
        index: false,
        follow: false,
    },
};

export default function SignInPage() {
    return (
        <div className="flex flex-col items-center">

            <header
                className="flex items-center justify-center flex-col gap-[3svh] mt-[3svh]"
            >
                    <Image
                        src="/logo.png"
                        width={270}
                        height={97}
                        alt="Логотип приложения"
                    />
                <div className="text-4xl w-80 font-normal text-center">
                    Тренажеры для обучающихся
                </div>
            </header>

            {/* Формочка авторизации */}
            <SignInForm/>
        </div>
    );
}