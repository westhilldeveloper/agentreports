'use client';
import { useEffect, useState } from 'react';
import { FaUsers, FaList, FaMoneyBillWave, FaClock } from 'react-icons/fa';

export default function AdminDashboard() {
  const [stats, setStats] = useState({ agents: 0, chits: 0, collections: 0, pending: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/stats')
      .then(res => res.json())
      .then(data => {
        if (data.success) setStats(data.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const statCards = [
    {
      label: 'Total Agents',
      value: stats.agents,
      icon: FaUsers,
      color: 'blue',
      bg: 'bg-blue-50',
      text: 'text-blue-600',
    },
    {
      label: 'Total Chits',
      value: stats.chits,
      icon: FaList,
      color: 'purple',
      bg: 'bg-purple-50',
      text: 'text-purple-600',
    },
    {
      label: 'This Month Collections',
      value: `₹${stats.collections?.toLocaleString()}`,
      icon: FaMoneyBillWave,
      color: 'green',
      bg: 'bg-green-50',
      text: 'text-green-600',
    },
    {
      label: 'Total Pending',
      value: `₹${stats.pending?.toLocaleString()}`,
      icon: FaClock,
      color: 'red',
      bg: 'bg-red-50',
      text: 'text-red-600',
    },
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Admin Dashboard</h1>
        <p className="text-sm text-gray-500">Overview of your platform</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((card, idx) => {
            const Icon = card.icon;
            return (
              <div
                key={idx}
                className="bg-white rounded-lg shadow-sm border border-gray-100 p-5 hover:shadow-md transition"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {card.label}
                    </p>
                    <p className="text-xl font-bold text-gray-900 mt-1">{card.value}</p>
                  </div>
                  <div className={`w-10 h-10 rounded-full ${card.bg} flex items-center justify-center`}>
                    <Icon className={`w-4 h-4 ${card.text}`} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}