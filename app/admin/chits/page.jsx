'use client';
import { useState, useEffect } from 'react';
import { FaPlus, FaList, FaCalendarAlt, FaEdit, FaTrash, FaTimes } from 'react-icons/fa';

export default function ChitsPage() {
  const [chits, setChits] = useState([]);
  const [name, setName] = useState('');
  const [totalTickets, setTotalTickets] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // For edit modal
  const [editingChit, setEditingChit] = useState(null); // null or chit object
  const [editName, setEditName] = useState('');
  const [editTotalTickets, setEditTotalTickets] = useState('');
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState('');

  const fetchChits = async () => {
    const res = await fetch('/api/admin/chits');
    const data = await res.json();
    if (data.success) setChits(data.data);
  };

  useEffect(() => { fetchChits(); }, []);

  // Create new chit
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/chits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, total_tickets: parseInt(totalTickets) }),
      });
      const data = await res.json();
      if (data.success) {
        setName('');
        setTotalTickets('');
        fetchChits();
      } else {
        setError(data.message);
      }
    } catch (err) { setError('Failed to create chit'); }
    setLoading(false);
  };

  // Open edit modal
  const openEditModal = (chit) => {
    setEditingChit(chit);
    setEditName(chit.name);
    setEditTotalTickets(chit.total_tickets);
    setEditError('');
  };

  // Close modal
  const closeEditModal = () => {
    setEditingChit(null);
    setEditName('');
    setEditTotalTickets('');
    setEditError('');
  };

  // Update chit
  const handleUpdate = async (e) => {
    e.preventDefault();
    setEditLoading(true);
    setEditError('');
    try {
      const res = await fetch(`/api/admin/chits/${editingChit.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editName,
          total_tickets: parseInt(editTotalTickets),
        }),
      });
      const data = await res.json();
      if (data.success) {
        closeEditModal();
        fetchChits();
      } else {
        setEditError(data.message);
      }
    } catch (err) {
      setEditError('Failed to update chit');
    }
    setEditLoading(false);
  };

  // Delete chit
  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this chit? This will also remove all its ticket assignments.')) return;
    try {
      const res = await fetch(`/api/admin/chits/${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        fetchChits();
      } else {
        alert(data.message || 'Failed to delete chit');
      }
    } catch (err) {
      alert('Network error');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-center space-x-3 mb-6">
          <FaList className="w-5 h-5 text-blue-600" />
          <h1 className="text-xl font-semibold text-gray-900">Manage Chits</h1>
        </div>

        {/* Create Form */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 mb-6">
          <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3">
            <div className="flex-1 min-w-[180px]">
              <label htmlFor="chitName" className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                Chit Name
              </label>
              <input
                id="chitName"
                type="text"
                placeholder="e.g., Coin-5"
                className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="w-36">
              <label htmlFor="totalTickets" className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                Total Tickets
              </label>
              <input
                id="totalTickets"
                type="number"
                placeholder="e.g., 10"
                className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={totalTickets}
                onChange={(e) => setTotalTickets(e.target.value)}
                required
              />
            </div>
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-1.5 rounded-lg transition flex items-center space-x-2 h-9"
              disabled={loading}
            >
              <FaPlus className="w-3.5 h-3.5" />
              <span>{loading ? 'Creating...' : 'Create Chit'}</span>
            </button>
            {error && <p className="text-red-600 text-xs w-full mt-1">{error}</p>}
          </form>
        </div>

        {/* Chits Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-800">All Chits</h2>
            <span className="text-xs text-gray-500">{chits.length} total</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-gray-50 text-gray-600 uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-2 text-left font-medium">ID</th>
                  <th className="px-4 py-2 text-left font-medium">Name</th>
                  <th className="px-4 py-2 text-left font-medium">Tickets</th>
                  <th className="px-4 py-2 text-left font-medium">Created</th>
                  <th className="px-4 py-2 text-center font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {chits.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-4 py-4 text-center text-gray-400 text-xs">
                      No chits created yet.
                    </td>
                  </tr>
                ) : (
                  chits.map((chit) => (
                    <tr key={chit.id} className="hover:bg-gray-50 transition">
                      <td className="px-4 py-2.5 font-medium text-gray-800">{chit.id}</td>
                      <td className="px-4 py-2.5 text-gray-700">{chit.name}</td>
                      <td className="px-4 py-2.5 text-gray-700">{chit.total_tickets}</td>
                      <td className="px-4 py-2.5 text-gray-500 flex items-center space-x-1">
                        <FaCalendarAlt className="w-3 h-3 text-gray-400" />
                        <span>{new Date(chit.created_at).toLocaleDateString('en-GB')}</span>
                      </td>
                      <td className="px-4 py-2.5 text-center">
                        <div className="flex items-center justify-center space-x-2">
                          <button
                            onClick={() => openEditModal(chit)}
                            className="text-blue-600 hover:text-blue-800 transition p-1 rounded hover:bg-blue-50"
                            title="Edit"
                          >
                            <FaEdit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(chit.id)}
                            className="text-red-600 hover:text-red-800 transition p-1 rounded hover:bg-red-50"
                            title="Delete"
                          >
                            <FaTrash className="w-4 h-4" />
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
      {editingChit && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 relative">
            <button
              onClick={closeEditModal}
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 transition"
            >
              <FaTimes className="w-5 h-5" />
            </button>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Edit Chit</h2>
            <form onSubmit={handleUpdate} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                  Chit Name
                </label>
                <input
                  type="text"
                  className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                  Total Tickets
                </label>
                <input
                  type="number"
                  className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={editTotalTickets}
                  onChange={(e) => setEditTotalTickets(e.target.value)}
                  required
                />
              </div>
              {editError && <p className="text-red-600 text-xs">{editError}</p>}
              <div className="flex space-x-3 pt-2">
                <button
                  type="button"
                  onClick={closeEditModal}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium px-4 py-2 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition"
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