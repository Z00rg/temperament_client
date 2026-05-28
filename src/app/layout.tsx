import {Montserrat} from 'next/font/google';
import './globals.css';
import {AppProvider} from '@/shared/lib/app-provider';
import {Metadata} from "next";
import {MyToastRegion} from "@/shared/ui/Toast";

const montserrat = Montserrat({subsets: ['latin']});

export const metadata: Metadata = {
    title: {
        default: "Темперамент",
        template: "%s — задачи темперамента",
    },
    robots: {
        index: true,
        follow: true,
    },
    description: "Описание темперамента",
    applicationName: "Темперамент",
    appleWebApp: {
        title: "Темперамент",
        capable: true,
    },
    icons: {
        apple: "/logic-trainer//apple-icon.png",
    },

    // OpenGraph preview
    openGraph: {
        title: "Темперамент",
        description: "Описание темперамента",
        type: "website",
        url: "https://tips.samsmu.ru/logic-trainer/",
        images: [
            {
                url: "https://tips.samsmu.ru/logic-trainer/og-atlas.png",
                width: 1200,
                height: 630,
                alt: "Темперамент",
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