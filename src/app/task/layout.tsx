import {Metadata} from "next";

export const metadata: Metadata = {
    title: "Выполнение задания",
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