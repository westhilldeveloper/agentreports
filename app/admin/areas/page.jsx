'use client';
import { useState, useEffect } from 'react';
import { FaPlus, FaEdit, FaTrash, FaTimes, FaFilter, FaSyncAlt } from 'react-icons/fa';

export default function AreasPage() {
  const [areas, setAreas] = useState([]);
  const [regions, setRegions] = useState([]);
  const [filterRegionId, setFilterRegionId] = useState('');
  const [form, setForm] = useState({ region_id: '', name: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  // Edit modal
  const [editing, setEditing] = useState(null);
  const [editForm, setEditForm] = useState({ region_id: '', name: '' });
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState('');

  const fetchRegions = async () => {
    const res = await fetch('/api/admin/regions');
    const data = await res.json();
    if (data.success) setRegions(data.data);
  };

  const fetchAreas = async (regionId = '') => {
    const url = regionId ? `/api/admin/areas?regionId=${regionId}` : '/api/admin/areas';
    const res = await fetch(url);
    const data = await res.json();
    if (data.success) setAreas(data.data);
  };

  useEffect(() => {
    fetchRegions();
    fetchAreas();
  }, []);

  useEffect(() => {
    fetchAreas(filterRegionId);
  }, [filterRegionId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');
    try {
      const res = await fetch('/api/admin/areas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) {
        setForm({ region_id: '', name: '' });
        fetchAreas(filterRegionId);
        setMessage('Area added successfully!');
        setTimeout(() => setMessage(''), 3000);
      } else setError(data.message);
    } catch (err) {
      setError('Failed to create');
    }
    setLoading(false);
  };

  const openEdit = (area) => {
    setEditing(area);
    setEditForm({ region_id: area.region_id, name: area.name });
    setEditError('');
  };
  const closeEdit = () => {
    setEditing(null);
    setEditForm({ region_id: '', name: '' });
    setEditError('');
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setEditLoading(true);
    setEditError('');
    try {
      const res = await fetch(`/api/admin/areas/${editing.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      });
      const data = await res.json();
      if (data.success) {
        closeEdit();
        fetchAreas(filterRegionId);
        setMessage('Area updated successfully!');
        setTimeout(() => setMessage(''), 3000);
      } else setEditError(data.message);
    } catch (err) {
      setEditError('Failed to update');
    }
    setEditLoading(false);
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this area?')) return;
    const res = await fetch(`/api/admin/areas/${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (data.success) {
      fetchAreas(filterRegionId);
      setMessage('Area deleted successfully!');
      setTimeout(() => setMessage(''), 3000);
    } else alert(data.message);
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-light text-gray-900">Manage Areas</h1>
          <p className="text-sm text-gray-500 mt-1">Organise areas by region for agent assignments</p>
        </div>

        {/* Filter and Add Form */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8">
          <div className="flex flex-wrap items-end gap-4">
            {/* Filter */}
            <div className="flex-1 min-w-[180px]">
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">Filter by Region</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaFilter className="w-3.5 h-3.5 text-gray-400" />
                </div>
                <select
                  className="w-full border border-gray-200 rounded-xl pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent bg-gray-50 appearance-none"
                  value={filterRegionId}
                  onChange={(e) => setFilterRegionId(e.target.value)}
                >
                  <option value="">All Regions</option>
                  {regions.map((r) => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Add Form */}
            <form onSubmit={handleSubmit} className="flex-1 flex flex-wrap items-end gap-3">
              <div className="flex-1 min-w-[160px]">
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">Region</label>
                <select
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent bg-gray-50 appearance-none"
                  value={form.region_id}
                  onChange={(e) => setForm({ ...form, region_id: e.target.value })}
                  required
                >
                  <option value="">Select Region</option>
                  {regions.map((r) => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex-1 min-w-[140px]">
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">Area Name</label>
                <input
                  type="text"
                  placeholder="e.g., Downtown"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent bg-gray-50"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-5 py-2.5 rounded-xl transition shadow-sm hover:shadow flex items-center gap-2 h-11"
                disabled={loading}
              >
                <FaPlus className="w-3.5 h-3.5" />
                {loading ? 'Adding...' : 'Add Area'}
              </button>
            </form>
          </div>

          {error && <p className="text-red-600 text-sm mt-3">{error}</p>}
          {message && <p className="text-green-600 text-sm mt-3">{message}</p>}
        </div>

        {/* Areas Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto max-h-[480px] overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50/80 text-gray-500 text-xs uppercase tracking-wider sticky top-0 z-10 backdrop-blur-sm">
                <tr>
                  <th className="px-5 py-3.5 text-left font-medium">Region</th>
                  <th className="px-5 py-3.5 text-left font-medium">Area</th>
                  <th className="px-5 py-3.5 text-center font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {areas.length === 0 ? (
                  <tr>
                    <td colSpan="3" className="px-5 py-8 text-center text-gray-400">
                      {filterRegionId ? 'No areas found for this region.' : 'No areas added yet.'}
                    </td>
                  </tr>
                ) : (
                  areas.map((a) => {
                    const region = regions.find((r) => r.id === a.region_id);
                    return (
                      <tr key={a.id} className="hover:bg-gray-50/60 transition-colors">
                        <td className="px-5 py-3.5 text-gray-700">{region?.name || '—'}</td>
                        <td className="px-5 py-3.5 font-medium text-gray-800">{a.name}</td>
                        <td className="px-5 py-3.5 text-center">
                          <div className="flex items-center justify-center space-x-1.5">
                            <button
                              onClick={() => openEdit(a)}
                              className="p-1.5 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition"
                              title="Edit"
                            >
                              <FaEdit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(a.id)}
                              className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                              title="Delete"
                            >
                              <FaTrash className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {editing && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 relative animate-fadeInUp">
            <button
              onClick={closeEdit}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition"
            >
              <FaTimes className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-light text-gray-900 mb-1">Edit Area</h2>
            <p className="text-sm text-gray-500 mb-5">Update the area details</p>
            <form onSubmit={handleUpdate} className="space-y-5">
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">Region</label>
                <select
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent bg-gray-50 appearance-none"
                  value={editForm.region_id}
                  onChange={(e) => setEditForm({ ...editForm, region_id: e.target.value })}
                  required
                >
                  <option value="">Select Region</option>
                  {regions.map((r) => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">Area Name</label>
                <input
                  type="text"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent bg-gray-50"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  required
                />
              </div>
              {editError && <p className="text-red-600 text-sm">{editError}</p>}
              <div className="flex space-x-3 pt-2">
                <button
                  type="button"
                  onClick={closeEdit}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium px-4 py-2.5 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2.5 rounded-xl transition shadow-sm disabled:opacity-60"
                  disabled={editLoading}
                >
                  {editLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeInUp {
          animation: fadeInUp 0.2s ease-out;
        }
      `}</style>
    </div>
  );
}