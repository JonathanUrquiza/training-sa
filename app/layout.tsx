import 'bootstrap/dist/css/bootstrap.min.css';
import './globals.css';
import { Inter } from 'next/font/google';
import BootstrapClient from '@/components/BootstrapClient';
import { ThemeProvider } from '@/contexts/ThemeContext';
import Sidebar from '@/components/Sidebar';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'App de Entrenamiento',
  description: 'Sistema de seguimiento de entrenamiento',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                const theme = localStorage.getItem('theme') || 
                  (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
                document.documentElement.setAttribute('data-theme', theme);
              })();
            `,
          }}
        />
      </head>
      <body className={inter.className}>
        <ThemeProvider>
          <Sidebar />
          <main className="main-content">
            {children}
          </main>
          <BootstrapClient />
        </ThemeProvider>
      </body>
    </html>
  );
}

