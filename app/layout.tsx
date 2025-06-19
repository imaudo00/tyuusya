import "./globals.css"; // Tailwind CSSのスタイル
import { Inter } from "next/font/google";
import { Header } from '@/components/Header';

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "駐車場予約システム",
  description: "駐車場をオンラインで簡単に予約",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body className={inter.className}>
        <Header />
        {children}
      </body>
    </html>
  );
}
