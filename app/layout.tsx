import type { Metadata } from 'next';
import { DM_Sans } from 'next/font/google';
import './globals.css';
import { Navbar } from '@/components/Navbar';
import { cookies } from 'next/headers';
import { decrypt } from '@/lib/auth';

const dmSans = DM_Sans({ subsets: ['latin'], weight: ['400', '500', '700'] });

export const metadata: Metadata = {
  title: 'PremiumRent — Wypożyczalnia samochodów',
  description: 'Wypożycz samochód szybko i wygodnie.',
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const cookie = cookieStore.get('session')?.value;
  const session = await decrypt(cookie);

  return (
    <html lang="pl">
      <body className={`${dmSans.className} bg-slate-50 min-h-screen text-slate-900`}>
        <Navbar session={session} />
        <main className="min-h-[calc(100vh-4rem)]">
          {children}
        </main>
      </body>
    </html>
  );
}