'use client';
import { useState } from 'react';
import AdminSidebar from '@/components/AdminSidebar';
import { FaBars } from 'react-icons/fa';

export default function AdminLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Header (mobile + desktop) */}
      <header className="lg:hidden bg-white border-b border-gray-200 px-4 py-3 flex items-center shadow-sm sticky top-0 z-30">
        <button
          onClick={toggleSidebar}
          className="p-2 rounded-lg hover:bg-gray-100 text-gray-600"
        >
          <FaBars className="w-5 h-5" />
        </button>
        <h1 className="ml-3 text-lg font-semibold text-blue-700">
          Coinplus<span className="text-gray-500 font-light">Admin</span>
        </h1>
      </header>

      {/* Sidebar */}
      <AdminSidebar isOpen={sidebarOpen} onClose={closeSidebar} />

      {/* Main Content */}
      <main className="lg:ml-64 min-h-screen p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}