import type { Metadata } from 'next';
import { Noto_Sans_Thai } from 'next/font/google';
import { AuthProvider } from '@/contexts/AuthContext';
import './globals.css';

const notoSansThai = Noto_Sans_Thai({
  subsets: ['thai', 'latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-noto-sans-thai',
});

export const metadata: Metadata = {
  title: 'EduChain',
  description: 'ระบบออกและตรวจสอบเอกสารวุฒิการศึกษาดิจิทัลด้วย ข้อมูลยืนยัน',
  icons: {
    icon: [
      { url: '/favicon.ico?v=2026', type: 'image/x-icon' },
      { url: '/educhain-logo.png?v=2026', type: 'image/png' },
    ],
    shortcut: '/favicon.ico?v=2026',
    apple: '/educhain-logo.png?v=2026',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th" className={notoSansThai.variable}>
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}