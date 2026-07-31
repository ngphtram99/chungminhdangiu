import type { Metadata, Viewport } from "next";
import { Fraunces, Inter, Space_Mono, VT323 } from "next/font/google";
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

const vt323 = VT323({
  subsets: ["latin"],
  variable: "--font-pixel",
  weight: ["400"],
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
        className={`${fraunces.variable} ${inter.variable} ${spaceMono.variable} ${vt323.variable} font-body min-h-screen`}
      >
        <div
          className="fixed inset-0 -z-10 bg-[url('/couple-mascot.jpg')] bg-center bg-no-repeat bg-contain opacity-[0.18] pointer-events-none"
          aria-hidden="true"
        />
        <div className="content-safe-bottom">{children}</div>
        <CategoryNav />
      </body>
    </html>
  );
}
