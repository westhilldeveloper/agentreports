'use client';
import { useState, useEffect } from 'react';
import { FaUserPlus, FaUser, FaPhone, FaEnvelope, FaIdBadge, FaEdit, FaTrash, FaTimes } from 'react-icons/fa';

export default function AgentsPage() {
  const [agents, setAgents] = useState([]);
  const [form, setForm] = useState({ agent_code: '', name: '', phone: '', email: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // For edit modal
  const [editingAgent, setEditingAgent] = useState(null);
  const [editForm, setEditForm] = useState({ agent_code: '', name: '', phone: '', email: '' });
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState('');

  const fetchAgents = async () => {
    const res = await fetch('/api/admin/agents');
    const data = await res.json();
    if (data.success) setAgents(data.data);
  };

  useEffect(() => { fetchAgents(); }, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) {
        setForm({ agent_code: '', name: '', phone: '', email: '' });
        fetchAgents();
      } else {
        setError(data.message);
      }
    } catch (err) { setError('Failed to create agent'); }
    setLoading(false);
  };

  // Open edit modal
  const openEditModal = (agent) => {
    setEditingAgent(agent);
    setEditForm({
      agent_code: agent.agent_code,
      name: agent.name,
      phone: agent.phone,
      email: agent.email,
    });
    setEditError('');
  };

  const closeEditModal = () => {
    setEditingAgent(null);
    setEditForm({ agent_code: '', name: '', phone: '', email: '' });
    setEditError('');
  };

  const handleEditChange = (e) => {
    setEditForm({ ...editForm, [e.target.name]: e.target.value });
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setEditLoading(true);
    setEditError('');
    try {
      const res = await fetch(`/api/admin/agents/${editingAgent.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      });
      const data = await res.json();
      if (data.success) {
        closeEditModal();
        fetchAgents();
      } else {
        setEditError(data.message);
      }
    } catch (err) {
      setEditError('Failed to update agent');
    }
    setEditLoading(false);
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this agent? This will also remove all their ticket assignments.')) return;
    try {
      const res = await fetch(`/api/admin/agents/${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        fetchAgents();
      } else {
        alert(data.message || 'Failed to delete agent');
      }
    } catch (err) {
      alert('Network error');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-center space-x-3 mb-6">
          <FaUserPlus className="w-5 h-5 text-blue-600" />
          <h1 className="text-xl font-semibold text-gray-900">Manage Agents</h1>
        </div>

        {/* Create Form */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 mb-6">
          <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <label htmlFor="agent_code" className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                Agent Code
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaIdBadge className="w-3.5 h-3.5 text-gray-400" />
                </div>
                <input
                  id="agent_code"
                  name="agent_code"
                  type="text"
                  placeholder="e.g., AG-001"
                  className="w-full border border-gray-200 rounded-lg pl-9 pr-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={form.agent_code}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
            <div>
              <label htmlFor="name" className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                Full Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaUser className="w-3.5 h-3.5 text-gray-400" />
                </div>
                <input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="John Doe"
                  className="w-full border border-gray-200 rounded-lg pl-9 pr-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={form.name}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
            <div>
              <label htmlFor="phone" className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                Phone
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaPhone className="w-3.5 h-3.5 text-gray-400" />
                </div>
                <input
                  id="phone"
                  name="phone"
                  type="text"
                  placeholder="+91 98765 43210"
                  className="w-full border border-gray-200 rounded-lg pl-9 pr-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={form.phone}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
            <div>
              <label htmlFor="email" className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaEnvelope className="w-3.5 h-3.5 text-gray-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="john@example.com"
                  className="w-full border border-gray-200 rounded-lg pl-9 pr-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={form.email}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
            <div className="sm:col-span-2 lg:col-span-4 flex items-center space-x-4">
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-1.5 rounded-lg transition flex items-center space-x-2 h-9"
                disabled={loading}
              >
                <FaUserPlus className="w-3.5 h-3.5" />
                <span>{loading ? 'Creating...' : 'Create Agent'}</span>
              </button>
              {error && <p className="text-red-600 text-xs">{error}</p>}
            </div>
          </form>
        </div>

        {/* Agents Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-800">All Agents</h2>
            <span className="text-xs text-gray-500">{agents.length} total</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-gray-50 text-gray-600 uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-2 text-left font-medium">Code</th>
                  <th className="px-4 py-2 text-left font-medium">Name</th>
                  <th className="px-4 py-2 text-left font-medium">Phone</th>
                  <th className="px-4 py-2 text-left font-medium">Email</th>
                  <th className="px-4 py-2 text-center font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {agents.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-4 py-4 text-center text-gray-400 text-xs">
                      No agents created yet.
                    </td>
                  </tr>
                ) : (
                  agents.map((agent) => (
                    <tr key={agent.id} className="hover:bg-gray-50 transition">
                      <td className="px-4 py-2.5 font-medium text-gray-800">{agent.agent_code}</td>
                      <td className="px-4 py-2.5 text-gray-700">{agent.name}</td>
                      <td className="px-4 py-2.5 text-gray-700">{agent.phone}</td>
                      <td className="px-4 py-2.5 text-gray-700">{agent.email}</td>
                      <td className="px-4 py-2.5 text-center">
                        <div className="flex items-center justify-center space-x-2">
                          <button
                            onClick={() => openEditModal(agent)}
                            className="text-blue-600 hover:text-blue-800 transition p-1 rounded hover:bg-blue-50"
                            title="Edit"
                          >
                            <FaEdit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(agent.id)}
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
      {editingAgent && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 relative">
            <button
              onClick={closeEditModal}
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 transition"
            >
              <FaTimes className="w-5 h-5" />
            </button>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Edit Agent</h2>
            <form onSubmit={handleUpdate} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                  Agent Code
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaIdBadge className="w-3.5 h-3.5 text-gray-400" />
                  </div>
                  <input
                    name="agent_code"
                    type="text"
                    className="w-full border border-gray-200 rounded-lg pl-9 pr-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={editForm.agent_code}
                    onChange={handleEditChange}
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaUser className="w-3.5 h-3.5 text-gray-400" />
                  </div>
                  <input
                    name="name"
                    type="text"
                    className="w-full border border-gray-200 rounded-lg pl-9 pr-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={editForm.name}
                    onChange={handleEditChange}
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                  Phone
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaPhone className="w-3.5 h-3.5 text-gray-400" />
                  </div>
                  <input
                    name="phone"
                    type="text"
                    className="w-full border border-gray-200 rounded-lg pl-9 pr-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={editForm.phone}
                    onChange={handleEditChange}
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                  Email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaEnvelope className="w-3.5 h-3.5 text-gray-400" />
                  </div>
                  <input
                    name="email"
                    type="email"
                    className="w-full border border-gray-200 rounded-lg pl-9 pr-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={editForm.email}
                    onChange={handleEditChange}
                    required
                  />
                </div>
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