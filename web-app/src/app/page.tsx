'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ordersApi, activitiesApi, profilesApi, expertPoolApi, Order, Activity, Profile, ExpertPoolEntry } from '@/lib/api';
import Card from '@/components/ui/Card';

export default function HomePage() {
  const [stats, setStats] = useState({
    orders: 0,
    activities: 0,
    profiles: 0,
    expertPool: 0,
  });
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const [ordersRes, activitiesRes, profilesRes, expertPoolRes] = await Promise.all([
          ordersApi.getAll(),
          activitiesApi.getAll(),
          profilesApi.getAll(),
          expertPoolApi.getAll(),
        ]);

        setStats({
          orders: ordersRes.data.length,
          activities: activitiesRes.data.length,
          profiles: profilesRes.data.length,
          expertPool: expertPoolRes.data.filter((e: ExpertPoolEntry) => e.active).length,
        });

        setRecentOrders(ordersRes.data.slice(0, 5));
      } catch (error) {
        // Backend not running - show zeros
        console.warn('Backend no disponible. Inicia el backend para ver datos reales.');
        setStats({ orders: 0, activities: 0, profiles: 0, expertPool: 0 });
        setRecentOrders([]);
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, []);

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      ACTIVE: 'bg-green-100 text-green-800',
      COMPLETED: 'bg-blue-100 text-blue-800',
      CANCELLED: 'bg-red-100 text-red-800',
      SUSPENDED: 'bg-yellow-100 text-yellow-800',
      PLANNED: 'bg-gray-100 text-gray-800',
      IN_PROGRESS: 'bg-blue-100 text-blue-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h2>
        <p className="text-gray-600">Resumen del sistema de gestión de expertos</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Link href="/orders">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Órdenes de Pedido</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{stats.orders}</p>
                </div>
                <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
              </div>
            </div>
          </Card>
        </Link>

        <Link href="/activities">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Actividades</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{stats.activities}</p>
                </div>
                <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
                  <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
              </div>
            </div>
          </Card>
        </Link>

        <Link href="/profiles">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Perfiles</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{stats.profiles}</p>
                </div>
                <div className="h-12 w-12 bg-purple-100 rounded-full flex items-center justify-center">
                  <svg className="h-6 w-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
              </div>
            </div>
          </Card>
        </Link>

        <Link href="/expert-pool">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Bolsa de Expertos</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{stats.expertPool}</p>
                </div>
                <div className="h-12 w-12 bg-indigo-100 rounded-full flex items-center justify-center">
                  <svg className="h-6 w-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>
            </div>
          </Card>
        </Link>
      </div>

      {/* Recent Orders */}
      <Card>
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Órdenes Recientes</h3>
            <Link href="/orders" className="text-sm text-blue-600 hover:text-blue-800">
              Ver todas →
            </Link>
          </div>
          {recentOrders.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No hay órdenes registradas</p>
          ) : (
            <div className="space-y-3">
              {recentOrders.map((order) => (
                <div key={order.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{order.title}</p>
                    <p className="text-sm text-gray-600">{order.number}</p>
                  </div>
                  <span className={`px-3 py-1 text-xs font-medium rounded-full ${getStatusColor(order.status)}`}>
                    {order.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>

      {/* Quick Links */}
      <Card>
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Accesos Rápidos</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <Link href="/orders" className="p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
              <p className="font-medium text-blue-900">Órdenes</p>
              <p className="text-sm text-blue-700">Gestionar órdenes de pedido</p>
            </Link>
            <Link href="/activities" className="p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors">
              <p className="font-medium text-green-900">Actividades</p>
              <p className="text-sm text-green-700">Administrar actividades</p>
            </Link>
            <Link href="/subactivities" className="p-4 bg-teal-50 rounded-lg hover:bg-teal-100 transition-colors">
              <p className="font-medium text-teal-900">Subactividades</p>
              <p className="text-sm text-teal-700">Gestionar subactividades</p>
            </Link>
            <Link href="/profiles" className="p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors">
              <p className="font-medium text-purple-900">Perfiles</p>
              <p className="text-sm text-purple-700">Gestionar expertos</p>
            </Link>
            <Link href="/expert-pool" className="p-4 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors">
              <p className="font-medium text-indigo-900">Bolsa de Expertos</p>
              <p className="text-sm text-indigo-700">Personas disponibles</p>
            </Link>
          </div>
        </div>
      </Card>
    </div>
  );
}
