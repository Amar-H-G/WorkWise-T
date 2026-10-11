import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/lib/auth-context';

export const metadata: Metadata = {
  title: 'WorkWise — Industrial Procurement SaaS',
  description: 'Enterprise procurement management: purchase orders, vendors, goods receipt notes, and spend analytics.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark h-full antialiased">
      <body className="min-h-full bg-[#0b0f17] text-slate-100 selection:bg-blue-600/30">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
