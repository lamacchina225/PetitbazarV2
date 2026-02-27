import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster as HotToaster } from 'react-hot-toast';
import { Toaster as SonnerToaster } from 'sonner';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import WhatsAppBotBubble from '@/components/WhatsAppBotBubble';
import SessionProvider from '@/components/providers/SessionProvider';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'PetitBazar - Boutique en ligne',
  description: 'Achetez les meilleurs produits tendance avec livraison rapide a Abidjan',
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body className={`${inter.className} bg-white text-slate-900`}>
        <SessionProvider>
          <div className="flex flex-col min-h-screen">
            <Navbar />
            <main className="flex-1">
              {children}
            </main>
            <Footer />
          </div>
          <WhatsAppBotBubble />
          <HotToaster position="top-center" />
          <SonnerToaster position="top-center" richColors />
        </SessionProvider>
      </body>
    </html>
  );
}

