import {SignInForm} from "@/features/auth";
import {UiHeader} from "@/shared/ui/ui-header";
import {Metadata} from "next";

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
            {/* Хедр */}
            <UiHeader variant="logo"/>

            {/* Формочка авторизации */}
            <SignInForm/>
        </div>
    );
}