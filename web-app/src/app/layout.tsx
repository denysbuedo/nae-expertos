import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'NAE - Gestión de Expertos',
  description: 'Sistema de gestión de expertos para el Proyecto NAE',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className="min-h-screen bg-gray-50">
        <ConditionalLayout>{children}</ConditionalLayout>
      </body>
    </html>
  );
}

import dynamic from 'next/dynamic';

// Dynamic import to make AuthGuard client-only
const AuthGuard = dynamic(() => import('@/components/AuthGuard'), { ssr: false });
const AppContent = dynamic(() => import('@/components/AppContent'), { ssr: false });

function ConditionalLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <AppContent>{children}</AppContent>
    </AuthGuard>
  );
}
