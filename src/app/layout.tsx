import {Montserrat} from 'next/font/google';
import './globals.css';
import {AppProvider} from '@/shared/lib/app-provider';
import {Metadata} from "next";
import {MyToastRegion} from "@/shared/ui/Toast";

const montserrat = Montserrat({subsets: ['latin']});

export const metadata: Metadata = {
    title: {
        default: "Тренажеры для обучающихся",
        template: "%s",
    },
    robots: {
        index: true,
        follow: true,
    },
    description: "Тренажеры для обучающихся",
    applicationName: "Тренажеры для обучающихся",
    appleWebApp: {
        title: "Тренажеры для обучающихся",
        capable: true,
    },
    icons: {
        apple: "/logic-trainer//apple-icon.png",
    },

    // OpenGraph preview
    openGraph: {
        title: "Тренажеры для обучающихся",
        description: "Тренажеры для обучающихся",
        type: "website",
        url: "https://tips.samsmu.ru/logic-trainer/",
        images: [
            {
                url: "https://tips.samsmu.ru/logic-trainer/og-atlas.png",
                width: 1200,
                height: 630,
                alt: "Тренажеры для обучающихся",
            },
        ],
    },


    manifest: "/manifest.webmanifest",
};

export default function RootLayout({
                                       children,
                                   }: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
        <body className={montserrat.className}>
        <AppProvider>
            {children}
            <MyToastRegion />
        </AppProvider>
        </body>
        </html>
    );
}