'use client';
import { useState } from 'react';
import AdminSidebar from '@/components/AdminSidebar';
import { RoleProvider, useRole } from '@/context/RoleContext';
import { FaLock, FaUnlock, FaTimes } from 'react-icons/fa';

function UnlockModal({ isOpen, onClose, onVerify }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/verify-super-admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (data.success) {
        onVerify();
        onClose();
        setPassword('');
      } else {
        setError(data.message || 'Invalid password');
      }
    } catch (err) {
      setError('Network error');
    }
    setLoading(false);
  };

  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6 relative">
        <button onClick={onClose} className="absolute top-3 right-3 text-gray-400 hover:text-gray-600">
          <FaTimes className="w-5 h-5" />
        </button>
        <h2 className="text-lg font-semibold mb-2">Unlock Full Admin</h2>
        <p className="text-sm text-gray-500 mb-4">Enter the super admin password to access all menus.</p>
        <form onSubmit={handleSubmit}>
          <input
            type="password"
            placeholder="Super Admin Password"
            className="w-full border px-3 py-2 rounded mb-3"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          {error && <p className="text-red-600 text-sm mb-3">{error}</p>}
          <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700" disabled={loading}>
            {loading ? 'Verifying...' : 'Unlock'}
          </button>
        </form>
      </div>
    </div>
  );
}

function AdminLayoutContent({ children }) {
  const { isFullAdmin, unlockFullAdmin } = useRole();
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-gray-100">
      <AdminSidebar />
      <main className="ml-64 flex-1 p-8">
        <div className="flex justify-end items-center mb-6">
          {!isFullAdmin ? (
            <button
              onClick={() => setModalOpen(true)}
              className="flex items-center space-x-2 bg-yellow-100 hover:bg-yellow-200 text-yellow-800 px-3 py-1.5 rounded-lg text-sm transition"
            >
              <FaLock className="w-4 h-4" />
              <span>Unlock Full Admin</span>
            </button>
          ) : (
            <span className="text-sm text-green-600 font-medium flex items-center space-x-1">
              <FaUnlock className="w-4 h-4" />
              <span>Full Admin Mode</span>
            </span>
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