import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Navbar } from '@/components/Navbar';
import { cookies } from 'next/headers';
import { decrypt } from '@/lib/auth';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'CarRental - Bazy Danych',
  description: 'Projekt z Zaawansowanych Architektur Baz Danych',
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
      <body className={`${inter.className} bg-zinc-50 min-h-screen text-zinc-900`}>
        <Navbar session={session} />

        <main className="min-h-[calc(100vh-4rem)]">
          {children}
        </main>
      </body>
    </html>
  );
}