import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { Toaster } from 'react-hot-toast';

export const metadata: Metadata = {
  title: 'TradeFlow ERP - Multi-Tenant Order-to-Cash Platform',
  description: 'Enterprise-grade multi-tenant Order-to-Cash management platform.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#0B0F17] text-slate-100 antialiased min-h-screen">
        <AuthProvider>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#141B2D',
                color: '#F8FAFC',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                backdropFilter: 'blur(12px)',
                fontSize: '13px',
                borderRadius: '12px',
              },
              success: {
                iconTheme: {
                  primary: '#10B981',
                  secondary: '#0B0F17',
                },
              },
              error: {
                iconTheme: {
                  primary: '#F43F5E',
                  secondary: '#0B0F17',
                },
              },
            }}
          />
        </AuthProvider>
      </body>
    </html>
  );
}
