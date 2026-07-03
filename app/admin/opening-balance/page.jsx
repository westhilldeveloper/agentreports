'use client';
import { useState, useEffect, useMemo } from 'react';
import {
  FaDollarSign,
  FaList,
  FaTicketAlt,
  FaSave,
  FaEdit,
  FaTrash,
  FaTimes,
  FaSearch,
  FaSync,
} from 'react-icons/fa';

export default function OpeningBalancePage() {
  const [chits, setChits] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [selectedChitId, setSelectedChitId] = useState('');
  const [selectedTicketNumber, setSelectedTicketNumber] = useState('');
  const [openingBalance, setOpeningBalance] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [allBalances, setAllBalances] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  // Edit modal state
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [editAmount, setEditAmount] = useState('');
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState('');

  // Fetch chits on mount
  useEffect(() => {
    fetch('/api/admin/chits')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setChits(data.data);
      });
  }, []);

  // Fetch tickets when chit changes
  useEffect(() => {
    if (!selectedChitId) {
      setTickets([]);
      return;
    }
    fetch(`/api/admin/agent-tickets?chitId=${selectedChitId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setTickets(data.data);
      });
  }, [selectedChitId]);

  const fetchBalances = async () => {
    const res = await fetch('/api/admin/opening-balance');
    const data = await res.json();
    if (data.success) setAllBalances(data.data);
  };

  useEffect(() => {
    fetchBalances();
  }, []);

  // Filter balances
  const filteredBalances = useMemo(() => {
    if (!searchTerm.trim()) return allBalances;
    const term = searchTerm.toLowerCase().trim();
    return allBalances.filter(
      (b) =>
        b.agent_name?.toLowerCase().includes(term) ||
        b.chit_name?.toLowerCase().includes(term) ||
        b.ticket_number?.toString().includes(term)
    );
  }, [allBalances, searchTerm]);

  // Create or update opening balance
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');
    try {
      const res = await fetch('/api/admin/opening-balance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chitId: selectedChitId,
          ticketNumber: parseInt(selectedTicketNumber),
          openingBalance: parseFloat(openingBalance),
        }),
      });
      const data = await res.json();
      if (data.success) {
        setMessage('Opening balance updated successfully!');
        setOpeningBalance('');
        fetchBalances();
      } else {
        setError(data.message);
      }
    } catch {
      setError('Network error');
    }
    setLoading(false);
  };

  // Edit handlers
  const openEditModal = (item) => {
    setEditingItem(item);
    setEditAmount(item.opening_balance);
    setEditError('');
    setEditModalOpen(true);
  };

  const closeEditModal = () => {
    setEditModalOpen(false);
    setEditingItem(null);
    setEditAmount('');
    setEditError('');
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setEditLoading(true);
    setEditError('');
    try {
      const res = await fetch(`/api/admin/opening-balance/${editingItem.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ openingBalance: parseFloat(editAmount) }),
      });
      const data = await res.json();
      if (data.success) {
        closeEditModal();
        fetchBalances();
        setMessage('Opening balance updated!');
        setTimeout(() => setMessage(''), 3000);
      } else {
        setEditError(data.message);
      }
    } catch {
      setEditError('Network error');
    }
    setEditLoading(false);
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to reset this opening balance to 0?')) return;
    try {
      const res = await fetch(`/api/admin/opening-balance/${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        fetchBalances();
        setMessage('Opening balance reset to 0!');
        setTimeout(() => setMessage(''), 3000);
      } else {
        alert(data.message || 'Failed to reset');
      }
    } catch {
      alert('Network error');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Page Header */}
        <div className="flex items-center space-x-3 mb-6">
          <FaDollarSign className="w-5 h-5 text-blue-600" />
          <h1 className="text-xl font-semibold text-gray-900">Set Opening Balance</h1>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 mb-6">
          <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <label htmlFor="chit" className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                Chit
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaList className="w-3.5 h-3.5 text-gray-400" />
                </div>
                <select
                  id="chit"
                  className="w-full border border-gray-200 rounded-lg pl-9 pr-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
                  value={selectedChitId}
                  onChange={(e) => setSelectedChitId(e.target.value)}
                  required
                >
                  <option value="">Select Chit</option>
                  {chits.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="ticket" className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                Ticket
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaTicketAlt className="w-3.5 h-3.5 text-gray-400" />
                </div>
                <select
                  id="ticket"
                  className="w-full border border-gray-200 rounded-lg pl-9 pr-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
                  value={selectedTicketNumber}
                  onChange={(e) => setSelectedTicketNumber(e.target.value)}
                  required
                  disabled={tickets.length === 0}
                >
                  <option value="">Select Ticket</option>
                  {tickets.map((t) => (
                    <option key={t.ticket_number} value={t.ticket_number}>
                      Token {t.ticket_number} {t.agent_name ? `(Assigned to ${t.agent_name})` : '(Unassigned)'}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="balance" className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                Opening Balance (₹)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaDollarSign className="w-3.5 h-3.5 text-gray-400" />
                </div>
                <input
                  id="balance"
                  type="number"
                  placeholder="e.g., 5000"
                  className="w-full border border-gray-200 rounded-lg pl-9 pr-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={openingBalance}
                  onChange={(e) => setOpeningBalance(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="flex items-end">
              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-1.5 rounded-lg transition flex items-center justify-center space-x-2 h-9"
                disabled={loading}
              >
                <FaSave className="w-3.5 h-3.5" />
                <span>{loading ? 'Saving...' : 'Set Opening Balance'}</span>
              </button>
            </div>
          </form>
          {error && <p className="text-red-600 text-xs mt-2">{error}</p>}
          {message && <p className="text-green-600 text-xs mt-2">{message}</p>}
        </div>

        {/* Table with Search */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-sm font-semibold text-gray-800">Current Opening Balances</h2>
            <div className="flex items-center gap-3 flex-wrap">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaSearch className="w-3.5 h-3.5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search agent, chit, or ticket..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-48 sm:w-60 border border-gray-200 rounded-lg pl-9 pr-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <button
                onClick={fetchBalances}
                className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-lg transition flex items-center space-x-1"
              >
                <FaSync className="w-3 h-3" />
                <span>Refresh</span>
              </button>
            </div>
          </div>
          <div className="max-h-80 overflow-y-auto">
            <table className="w-full text-xs">
              <thead className="bg-gray-50 text-gray-600 uppercase tracking-wider sticky top-0 z-10">
                <tr><th className="px-4 py-2 text-left">Chit</th>
                  <th className="px-4 py-2 text-left">Ticket</th>
                  <th className="px-4 py-2 text-left">Agent</th>
                  <th className="px-4 py-2 text-right">Opening Balance (₹)</th>
                  <th className="px-4 py-2 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredBalances.length === 0 ? (
                  <tr><td colSpan="5" className="px-4 py-4 text-center text-gray-400 text-xs">
                    {searchTerm ? 'No matching records found.' : 'No opening balances set.'}
                  </td></tr>
                ) : (
                  filteredBalances.map((b) => (
                    <tr key={b.id} className="hover:bg-gray-50 transition">
                      <td className="px-4 py-2.5 font-medium text-gray-800">{b.chit_name}</td>
                      <td className="px-4 py-2.5 text-gray-700">Token {b.ticket_number}</td>
                      <td className="px-4 py-2.5 text-gray-700">{b.agent_name || 'Unassigned'}</td>
                      <td className="px-4 py-2.5 text-right font-medium text-gray-800">
                        ₹{parseFloat(b.opening_balance).toLocaleString()}
                      </td>
                      <td className="px-4 py-2.5 text-center">
                        <div className="flex items-center justify-center space-x-1">
                          <button
                            onClick={() => openEditModal(b)}
                            className="text-blue-600 hover:text-blue-800 transition p-1 rounded hover:bg-blue-50"
                            title="Edit"
                          >
                            <FaEdit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(b.id)}
                            className="text-red-600 hover:text-red-800 transition p-1 rounded hover:bg-red-50"
                            title="Reset to 0"
                          >
                            <FaTrash className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {editModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 relative">
            <button
              onClick={closeEditModal}
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 transition"
            >
              <FaTimes className="w-4 h-4" />
            </button>
            <h2 className="text-sm font-semibold text-gray-900 mb-1">Edit Opening Balance</h2>
            <p className="text-xs text-gray-500 mb-4">
              {editingItem?.chit_name} – Token {editingItem?.ticket_number}
              {editingItem?.agent_name && ` (Assigned to ${editingItem.agent_name})`}
            </p>
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                  Opening Balance (₹)
                </label>
                <input
                  type="number"
                  className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={editAmount}
                  onChange={(e) => setEditAmount(e.target.value)}
                  required
                />
              </div>
              {editError && <p className="text-red-600 text-xs">{editError}</p>}
              <div className="flex space-x-3 pt-2">
                <button
                  type="button"
                  onClick={closeEditModal}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium px-4 py-1.5 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-1.5 rounded-lg transition"
                  disabled={editLoading}
                >
                  {editLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}