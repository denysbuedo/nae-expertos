'use client';

import { usePathname } from 'next/navigation';
import Image from 'next/image';
import { useAuthStore } from '@/stores/authStore';

export default function AppContent({ children }: { children: React.ReactNode }) {
  const { user, logout, isAuthenticated } = useAuthStore();
  const pathname = usePathname();

  // Login page renders independently, no wrapper needed
  if (pathname === '/login') {
    return <>{children}</>;
  }

  // If not authenticated and not on login, just render children (auth guard will redirect)
  if (!isAuthenticated) {
    return <>{children}</>;
  }

  return (
    <>
      <header className="bg-slate-800 shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Image
                src="/logo.png"
                alt="Logo NAE"
                width={220}
                height={70}
                className="object-contain"
              />
              <div>
                <p className="text-lg font-medium text-white">
                  Gestión de Expertos
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-6">
              <nav className="hidden md:flex space-x-6">
                <a href="/" className="text-slate-300 hover:text-white">Dashboard</a>
                <a href="/orders" className="text-slate-300 hover:text-white">Órdenes</a>
                <a href="/activities" className="text-slate-300 hover:text-white">Actividades</a>
                <a href="/subactivities" className="text-slate-300 hover:text-white">Subactividades</a>
                <a href="/deliverables" className="text-slate-300 hover:text-white">Entregables</a>
                <a href="/profiles" className="text-slate-300 hover:text-white">Perfiles</a>
                <a href="/expert-pool" className="text-slate-300 hover:text-white">Bolsa de Expertos</a>
                <a href="/reports" className="text-slate-300 hover:text-white">Reportes</a>
              </nav>
              {isAuthenticated && user && (
                <div className="flex items-center space-x-3 ml-4 pl-4 border-l border-slate-600">
                  <div className="text-right">
                    <p className="text-sm font-medium text-white">{user.username}</p>
                    <p className="text-xs text-slate-400">{user.role}</p>
                  </div>
                  <button
                    onClick={logout}
                    className="text-slate-300 hover:text-white text-sm font-medium"
                    title="Cerrar sesión"
                  >
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </>
  );
}
