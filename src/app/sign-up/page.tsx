import {SignUpForm} from "@/features/auth";
import {Metadata} from "next";

export const metadata: Metadata = {
    title: "Регистрация",
};

export default function SignUpPage() {

    return (
        <div className="flex flex-col items-center">

            <header
                className="flex items-center justify-center flex-col gap-[3svh] mt-[3svh]"
            >
                <img
                    src="/logic-trainer/logo.png"
                    width={270}
                    height={97}
                    alt="Логотип приложения"
                />
                <div className="text-4xl w-80 font-normal text-center">
                    Тренажеры для обучающихся
                </div>
            </header>

            {/* Формочка регистрации */}
            <SignUpForm/>
        </div>
    );
}
