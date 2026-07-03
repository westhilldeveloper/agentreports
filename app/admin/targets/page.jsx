'use client';
import { useState, useEffect,useMemo } from 'react';
import { FaBullseye, FaCalendarAlt, FaDollarSign, FaPlus, FaList, FaEdit, FaTrash, FaTimes } from 'react-icons/fa';

export default function TargetsPage() {
  const [targets, setTargets] = useState([]);
  const [chits, setChits] = useState([]);
  const [form, setForm] = useState({ chit_id: '', month_year: '', target_amount: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  // For edit modal
  const [editingTarget, setEditingTarget] = useState(null);
  const [editForm, setEditForm] = useState({ chit_id: '', month_year: '', target_amount: '' });
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState('');

  const fetchData = async () => {
    const [targetsRes, chitsRes] = await Promise.all([
      fetch('/api/admin/targets'),
      fetch('/api/admin/chits'),
    ]);
    const targetsData = await targetsRes.json();
    const chitsData = await chitsRes.json();
    if (targetsData.success) setTargets(targetsData.data);
    if (chitsData.success) setChits(chitsData.data);
  };

  useEffect(() => { fetchData(); }, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const formattedMonthYear = form.month_year + '-01';
      const res = await fetch('/api/admin/targets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chit_id: form.chit_id,
          month_year: formattedMonthYear,
          target_amount: form.target_amount,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setForm({ chit_id: '', month_year: '', target_amount: '' });
        fetchData();
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('Failed to set target');
    }
    setLoading(false);
  };

  // Open edit modal
  const openEditModal = (target) => {
    // Convert month_year from '2026-06-01' to '2026-06' for input[type="month"]
    const monthValue = target.month_year.slice(0, 7); // YYYY-MM
    setEditingTarget(target);
    setEditForm({
      chit_id: target.chit_id,
      month_year: monthValue,
      target_amount: target.target_amount,
    });
    setEditError('');
  };

  const closeEditModal = () => {
    setEditingTarget(null);
    setEditForm({ chit_id: '', month_year: '', target_amount: '' });
    setEditError('');
  };

  const filteredTargets = useMemo(() => {
  if (!searchTerm.trim()) return targets;
  const term = searchTerm.toLowerCase().trim();
  return targets.filter(t => 
    t.chit_name.toLowerCase().includes(term)
  );
}, [targets, searchTerm]);

  const handleEditChange = (e) => {
    setEditForm({ ...editForm, [e.target.name]: e.target.value });
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setEditLoading(true);
    setEditError('');
    try {
      // Convert month_year to full date
      const formattedMonth = editForm.month_year + '-01';
      const res = await fetch(`/api/admin/targets/${editingTarget.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chit_id: editForm.chit_id,
          month_year: formattedMonth,
          target_amount: editForm.target_amount,
        }),
      });
      const data = await res.json();
      if (data.success) {
        closeEditModal();
        fetchData();
      } else {
        setEditError(data.message);
      }
    } catch (err) {
      setEditError('Failed to update target');
    }
    setEditLoading(false);
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this target? Any collections for this chit and month will be affected.')) return;
    try {
      const res = await fetch(`/api/admin/targets/${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        fetchData();
      } else {
        alert(data.message || 'Failed to delete target');
      }
    } catch (err) {
      alert('Network error');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-center space-x-3 mb-6">
          <FaBullseye className="w-5 h-5 text-blue-600" />
          <h1 className="text-xl font-semibold text-gray-900">Monthly Targets</h1>
        </div>

        {/* Create Form */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 mb-6">
          <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <label htmlFor="chit_id" className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                Chit
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaList className="w-3.5 h-3.5 text-gray-400" />
                </div>
                <select
                  id="chit_id"
                  name="chit_id"
                  className="w-full border border-gray-200 rounded-lg pl-9 pr-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
                  value={form.chit_id}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select Chit</option>
                  {chits.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label htmlFor="month_year" className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                Month
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaCalendarAlt className="w-3.5 h-3.5 text-gray-400" />
                </div>
                <input
                  id="month_year"
                  type="month"
                  name="month_year"
                  className="w-full border border-gray-200 rounded-lg pl-9 pr-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={form.month_year}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
            <div>
              <label htmlFor="target_amount" className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                Target Amount (₹)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaDollarSign className="w-3.5 h-3.5 text-gray-400" />
                </div>
                <input
                  id="target_amount"
                  type="number"
                  name="target_amount"
                  placeholder="e.g., 50000"
                  className="w-full border border-gray-200 rounded-lg pl-9 pr-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={form.target_amount}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
            <div className="flex items-end">
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-1.5 rounded-lg transition flex items-center space-x-2 h-9"
                disabled={loading}
              >
                <FaPlus className="w-3.5 h-3.5" />
                <span>{loading ? 'Saving...' : 'Set Target'}</span>
              </button>
            </div>
            {error && <p className="text-red-600 text-xs col-span-full mt-1">{error}</p>}
          </form>
        </div>

        {/* Targets Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
  <div className="px-4 py-3 border-b border-gray-100 flex flex-wrap items-center justify-between gap-3">
    <h2 className="text-sm font-semibold text-gray-800">All Targets</h2>
    <div className="flex items-center gap-3 flex-wrap">
      <div className="relative">
        <input
          type="text"
          placeholder="Search by chit name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-48 sm:w-56 border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <span className="text-xs text-gray-500">{filteredTargets.length} / {targets.length}</span>
    </div>
  </div>
  <div className="overflow-x-auto overflow-y-auto max-h-64">
    <table className="w-full text-xs">
      <thead className="bg-gray-50 text-gray-600 uppercase tracking-wider sticky top-0 z-10 shadow-sm">
        <tr>
          <th className="px-4 py-2 text-left font-medium">Chit</th>
          <th className="px-4 py-2 text-left font-medium">Month</th>
          <th className="px-4 py-2 text-right font-medium">Target (₹)</th>
          <th className="px-4 py-2 text-center font-medium">Actions</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-100">
        {filteredTargets.length === 0 ? (
          <tr>
            <td colSpan="4" className="px-4 py-4 text-center text-gray-400 text-xs">
              {searchTerm ? 'No targets match your search.' : 'No targets set yet.'}
            </td>
          </tr>
        ) : (
          filteredTargets.map((t) => (
            <tr key={t.id} className="hover:bg-gray-50 transition">
              <td className="px-4 py-2.5 font-medium text-gray-800">{t.chit_name}</td>
              <td className="px-4 py-2.5 text-gray-700">
                {new Date(t.month_year).toLocaleString('en-GB', { month: 'long', year: 'numeric' })}
              </td>
              <td className="px-4 py-2.5 text-right font-medium text-gray-800">
                ₹{parseFloat(t.target_amount).toLocaleString()}
              </td>
              <td className="px-4 py-2.5 text-center">
                <div className="flex items-center justify-center space-x-2">
                  <button
                    onClick={() => openEditModal(t)}
                    className="text-blue-600 hover:text-blue-800 transition p-1 rounded hover:bg-blue-50"
                    title="Edit"
                  >
                    <FaEdit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(t.id)}
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
      {editingTarget && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 relative">
            <button
              onClick={closeEditModal}
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 transition"
            >
              <FaTimes className="w-5 h-5" />
            </button>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Edit Target</h2>
            <form onSubmit={handleUpdate} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                  Chit
                </label>
                <select
                  name="chit_id"
                  className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={editForm.chit_id}
                  onChange={handleEditChange}
                  required
                >
                  <option value="">Select Chit</option>
                  {chits.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                  Month
                </label>
                <input
                  type="month"
                  name="month_year"
                  className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={editForm.month_year}
                  onChange={handleEditChange}
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                  Target Amount (₹)
                </label>
                <input
                  type="number"
                  name="target_amount"
                  placeholder="e.g., 50000"
                  className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={editForm.target_amount}
                  onChange={handleEditChange}
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