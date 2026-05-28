import {Metadata} from "next";

export const metadata: Metadata = {
    title: "Описание тренажера",
};

export default function DescriptionLayout({
                                       children,
                                   }: Readonly<{
    children: React.ReactNode;
}>) {
    return <>
        {children}
    </>;
}