import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'RKN.AI | ركن الذكاء الاصطناعي',
  description: 'تطبيق محادثة ذكاء اصطناعي عربي بواجهة هادئة على طراز محادثة Claude.',
  applicationName: 'RKN.AI'
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#f5f4ef'
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ar" dir="rtl">
      <body>{children}</body>
    </html>
  );
}
