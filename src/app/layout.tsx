import "@/app/globals.css";
import { PwaRegister } from "@/components/pwa-register";
import type { Metadata, Viewport } from "next";
import { Inter, Noto_Sans_SC } from "next/font/google";
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const notoSansSc = Noto_Sans_SC({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-noto-sc",
});

const siteName = process.env.NEXT_PUBLIC_SITE_NAME ?? "Jaylin_love_Erika";

export const metadata: Metadata = {
  title: {
    default: siteName,
    template: `%s · ${siteName}`,
  },
  description: "A private Chinese learning site for Erika — Jaylin_love_Erika",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: siteName,
  },
};

export const viewport: Viewport = {
  themeColor: "#f8b4b4",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${notoSansSc.variable} min-h-dvh bg-cream font-sans text-warm-brown antialiased`}
      >
        <PwaRegister />
        {children}
      </body>
    </html>
  );
}
