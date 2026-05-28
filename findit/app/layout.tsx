import type { Metadata } from 'next';
import { Geist } from 'next/font/google';
import { Space_Mono } from 'next/font/google';
import './globals.css';
import Navbar from '@/components/Navbar';

const geist = Geist({
  subsets: ['latin'],
  variable: '--font-geist',
});

const spaceMono = Space_Mono({
  weight: ['400', '700'],
  subsets: ['latin'],
  variable: '--font-space-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'FindIt - Smart GPS Tracker',
  description: 'Real-time GPS tracking dashboard for your ESP32 device',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geist.variable} ${spaceMono.variable}`}>
      <head>
        <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>📡</text></svg>" />
      </head>
      <body className="min-h-screen flex flex-col" style={{ fontFamily: 'var(--font-geist), system-ui, sans-serif', background: '#060d1a', color: '#e2e8f0' }}>
        <Navbar />
        <main className="flex-1 flex flex-col">{children}</main>
      </body>
    </html>
  );
}
