import {Metadata} from "next";

export const metadata: Metadata = {
    title: "Результат попытки",
};

export default function EstimationLayout({
                                       children,
                                   }: Readonly<{
    children: React.ReactNode;
}>) {
    return <>
        {children}
    </>;
}