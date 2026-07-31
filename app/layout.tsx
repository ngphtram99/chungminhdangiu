import type { Metadata, Viewport } from "next";
import { Fraunces, Inter, Space_Mono } from "next/font/google";
import "./globals.css";
import CategoryNav from "@/components/CategoryNav";

const fraunces = Fraunces({
  subsets: ["latin", "vietnamese"],
  variable: "--font-fraunces",
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
});

const inter = Inter({
  subsets: ["latin", "vietnamese"],
  variable: "--font-inter",
});

const spaceMono = Space_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  title: "Nhật Ký Đôi Ta",
  description: "Lưu lại những nơi hai đứa đã đi qua",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: "#F0DEEA",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi">
      <body
        className={`${fraunces.variable} ${inter.variable} ${spaceMono.variable} font-body min-h-screen`}
      >
        <div className="content-safe-bottom">{children}</div>
        <CategoryNav />
      </body>
    </html>
  );
}
