import type { Metadata, Viewport } from 'next';
import { Toaster } from 'sonner';
import './globals.css';

export const metadata: Metadata = {
  title: 'RKN.AI | ركن الذكاء الاصطناعي',
  description: 'تطبيق محادثة ذكاء اصطناعي عربي احترافي يعمل عبر Gemini API.',
  applicationName: 'RKN.AI',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'RKN.AI'
  },
  formatDetection: {
    telephone: false
  }
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  minimumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#070816'
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ar" dir="rtl" className="dark">
      <body>
        <div id="app-root">{children}</div>
        <Toaster richColors closeButton position="top-center" dir="rtl" />
      </body>
    </html>
  );
}
