import type { Metadata } from "next";
import { Be_Vietnam_Pro, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";

const beVietnamPro = Be_Vietnam_Pro({
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-sans",
  subsets: ["latin", "latin-ext", "vietnamese"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin", "latin-ext", "vietnamese"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "VietNenkin Solutions - Hệ Thống Nghiệp Vụ Hoàn Thuế & An Sinh Nhật Bản",
  description: "Nền tảng giải pháp quản trị và xử lý nghiệp vụ hồ sơ Nenkin & thuế chuyên nghiệp.",
};

import LayoutWrapper from "@/components/LayoutWrapper";
import { FloatingAiChat } from "@/components/FloatingAiChat";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="vi"
      className={`${beVietnamPro.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        <LayoutWrapper>{children}</LayoutWrapper>
        <FloatingAiChat />
        <Toaster
          position="top-right"
          richColors
          closeButton
          duration={4000}
          toastOptions={{
            classNames: {
              toast: "font-sans text-xs",
              title: "font-semibold text-xs",
              description: "text-[11px]",
            },
          }}
        />
      </body>
    </html>
  );
}
