'use client';
import { useState, useEffect } from 'react';
import { FaPlus, FaEdit, FaTrash, FaTimes, FaMapMarkerAlt } from 'react-icons/fa';

export default function RegionsPage() {
  const [regions, setRegions] = useState([]);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const [editing, setEditing] = useState(null);
  const [editName, setEditName] = useState('');
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState('');

  const fetchRegions = async () => {
    const res = await fetch('/api/admin/regions');
    const data = await res.json();
    if (data.success) setRegions(data.data);
  };

  useEffect(() => {
    fetchRegions();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');
    try {
      const res = await fetch('/api/admin/regions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      const data = await res.json();
      if (data.success) {
        setName('');
        fetchRegions();
        setMessage('Region added successfully!');
        setTimeout(() => setMessage(''), 3000);
      } else setError(data.message);
    } catch (err) {
      setError('Failed to create');
    }
    setLoading(false);
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this region?')) return;
    const res = await fetch(`/api/admin/regions/${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (data.success) {
      fetchRegions();
      setMessage('Region deleted successfully!');
      setTimeout(() => setMessage(''), 3000);
    } else alert(data.message);
  };

  const openEdit = (region) => {
    setEditing(region);
    setEditName(region.name);
    setEditError('');
  };

  const closeEdit = () => {
    setEditing(null);
    setEditName('');
    setEditError('');
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setEditLoading(true);
    setEditError('');
    try {
      const res = await fetch(`/api/admin/regions/${editing.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editName }),
      });
      const data = await res.json();
      if (data.success) {
        closeEdit();
        fetchRegions();
        setMessage('Region updated successfully!');
        setTimeout(() => setMessage(''), 3000);
      } else setEditError(data.message);
    } catch (err) {
      setEditError('Failed to update');
    }
    setEditLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Page Header */}
        <div className="flex items-center space-x-3 mb-6">
          <FaMapMarkerAlt className="w-5 h-5 text-blue-600" />
          <h1 className="text-xl font-semibold text-gray-900">Manage Regions</h1>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 mb-6">
          <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3">
            <div className="flex-1 min-w-[200px]">
              <label htmlFor="regionName" className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                Region Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaMapMarkerAlt className="w-3.5 h-3.5 text-gray-400" />
                </div>
                <input
                  id="regionName"
                  type="text"
                  placeholder="e.g., North District"
                  className="w-full border border-gray-200 rounded-lg pl-9 pr-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={name}
                  onChange={(e) => setName(e.target.value.toUpperCase())}
                  required
                />
              </div>
            </div>
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-1.5 rounded-lg transition flex items-center space-x-2 h-9"
              disabled={loading}
            >
              <FaPlus className="w-3.5 h-3.5" />
              <span>{loading ? 'Adding...' : 'Add Region'}</span>
            </button>
          </form>
          {error && <p className="text-red-600 text-xs mt-2">{error}</p>}
          {message && <p className="text-green-600 text-xs mt-2">{message}</p>}
        </div>

        {/* Regions Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-800">All Regions</h2>
            <span className="text-xs text-gray-500">{regions.length} total</span>
          </div>
          <div className="overflow-x-auto overflow-y-auto max-h-80">
            <table className="w-full text-xs">
              <thead className="bg-gray-50 text-gray-600 uppercase tracking-wider sticky top-0 z-10 shadow-sm">
                <tr>
                  <th className="px-4 py-2 text-left font-medium">Region Name</th>
                  <th className="px-4 py-2 text-center font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {regions.length === 0 ? (
                  <tr>
                    <td colSpan="2" className="px-4 py-4 text-center text-gray-400 text-xs">
                      No regions added yet.
                    </td>
                  </tr>
                ) : (
                  regions.map((r) => (
                    <tr key={r.id} className="hover:bg-gray-50 transition">
                      <td className="px-4 py-2.5 font-medium text-gray-800">{r.name}</td>
                      <td className="px-4 py-2.5 text-center">
                        <div className="flex items-center justify-center space-x-2">
                          <button
                            onClick={() => openEdit(r)}
                            className="text-blue-600 hover:text-blue-800 transition p-1 rounded hover:bg-blue-50"
                            title="Edit"
                          >
                            <FaEdit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(r.id)}
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
      {editing && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 relative">
            <button
              onClick={closeEdit}
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 transition"
            >
              <FaTimes className="w-5 h-5" />
            </button>
            <h2 className="text-sm font-semibold text-gray-900 mb-1">Edit Region</h2>
            <p className="text-xs text-gray-500 mb-4">Update the region name</p>
            <form onSubmit={handleUpdate} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                  Region Name
                </label>
                <input
                  type="text"
                  className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  required
                />
              </div>
              {editError && <p className="text-red-600 text-xs">{editError}</p>}
              <div className="flex space-x-3 pt-2">
                <button
                  type="button"
                  onClick={closeEdit}
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