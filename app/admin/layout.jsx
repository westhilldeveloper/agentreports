'use client';
import { useState } from 'react';
import AdminSidebar from '@/components/AdminSidebar';
import { RoleProvider, useRole } from '@/context/RoleContext';
import { FaLock, FaUnlock } from 'react-icons/fa';
import UnlockModal from '@/components/UnlockModal';

function AdminLayoutContent({ children }) {
  const { isFullAdmin, unlockFullAdmin, exitFullAdmin } = useRole();
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-gray-100">
      <AdminSidebar />
      <main className="ml-64 flex-1 p-8">
        <div className="flex justify-end items-center mb-6 gap-3">
          {!isFullAdmin ? (
            <button
              onClick={() => setModalOpen(true)}
              className="flex items-center space-x-2 bg-yellow-100 hover:bg-yellow-200 text-yellow-800 px-3 py-1.5 rounded-lg text-sm transition"
            >
              <FaLock className="w-4 h-4" />
              <span>Unlock Full Admin</span>
            </button>
          ) : (
            <>
              <span className="text-sm text-green-600 font-medium flex items-center space-x-1">
                <FaUnlock className="w-4 h-4" />
                <span>Full Admin Mode</span>
              </span>
              <button
                onClick={exitFullAdmin}
                className="flex items-center space-x-2 bg-red-100 hover:bg-red-200 text-red-700 px-3 py-1.5 rounded-lg text-sm transition"
              >
                <span>Exit Full Admin</span>
              </button>
            </>
          )}
        </div>
        {children}
        <UnlockModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          onVerify={unlockFullAdmin}
        />
      </main>
    </div>
  );
}

export default function AdminLayout({ children }) {
  return (
    <RoleProvider>
      <AdminLayoutContent>{children}</AdminLayoutContent>
    </RoleProvider>
  );
}