import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import Image from 'next/image';
<<<<<<< HEAD
import { LangProvider } from './components/LanguageSwitcher';
=======
import { LanguageProvider } from './contexts/LanguageContext';
import LanguageSwitcher from './components/LanguageSwitcher';
import Header from './components/Header';
>>>>>>> 7c89df3edf3ae3e960d6375442cc16bcb8efaaba

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Pulse – News App',
  description: 'Real‑time news with credibility scoring',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pl">
      <body className={inter.className + ' bg-white'}>
<<<<<<< HEAD
        <LangProvider>
          <header className="bg-black flex items-center h-16 px-4">
            <div className="flex items-center space-x-3">
              <Image
                src="/Untitled design (12).png"
                width={40}
                height={40}
                alt="Pulse logo"
                className="rounded-lg"
              />
              <span className="text-white text-lg font-semibold">Pulse</span>
            </div>
          </header>
              <main>{children}</main>
            </LangProvider>
          </body>
        </html>
      );
    }
=======
        <LanguageProvider>
          <Header />
          <main>{children}</main>
        </LanguageProvider>
      </body>
    </html>
  );
}

>>>>>>> 7c89df3edf3ae3e960d6375442cc16bcb8efaaba
