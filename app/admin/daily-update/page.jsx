'use client';
import { useState, useEffect } from 'react';
import { FaEdit, FaTrash, FaTimes, FaUser, FaCalendarAlt, FaList, FaTicketAlt, FaDollarSign, FaFilter, FaSyncAlt } from 'react-icons/fa';

export default function DailyUpdate() {
  const [agents, setAgents] = useState([]);
  const [chits, setChits] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [selectedAgentId, setSelectedAgentId] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [selectedChitId, setSelectedChitId] = useState('');
  const [selectedTicketNumber, setSelectedTicketNumber] = useState('');
  const [pendingAmount, setPendingAmount] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // List state
  const [allCollections, setAllCollections] = useState([]);
  const [filterAgentId, setFilterAgentId] = useState('');
  const [filterChitId, setFilterChitId] = useState('');
  const [filterMonth, setFilterMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  // Edit modal
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingCollection, setEditingCollection] = useState(null);
  const [editPendingAmount, setEditPendingAmount] = useState('');
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState('');

  // Fetch dropdowns
  useEffect(() => {
    const fetchDropdowns = async () => {
      const res = await fetch('/api/admin/daily-update');
      const data = await res.json();
      if (data.success) {
        setAgents(data.data.agents);
        setChits(data.data.chits);
      }
    };
    fetchDropdowns();
  }, []);

  // Fetch tickets
  useEffect(() => {
    if (!selectedChitId) {
      setTickets([]);
      return;
    }
    const fetchTickets = async () => {
      const url = `/api/admin/daily-update?chitId=${selectedChitId}${selectedAgentId ? `&agentId=${selectedAgentId}` : ''}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) setTickets(data.data.tickets);
    };
    fetchTickets();
  }, [selectedChitId, selectedAgentId]);

  // Fetch list
  const fetchCollections = async () => {
    const params = new URLSearchParams();
    params.append('list', 'true');
    if (filterAgentId) params.append('agentId', filterAgentId);
    if (filterChitId) params.append('chitId', filterChitId);
    if (filterMonth) params.append('month', filterMonth);
    const res = await fetch(`/api/admin/daily-update?${params.toString()}`);
    const data = await res.json();
    if (data.success) setAllCollections(data.data);
  };

  useEffect(() => {
    fetchCollections();
  }, [filterAgentId, filterChitId, filterMonth]);

  // Submit new
  const handleSubmit = async (e) => {
    e.preventDefault();
    const ticket = tickets.find(t => t.ticketNumber === parseInt(selectedTicketNumber));
    if (!ticket || !ticket.isAssignedToSelected) {
      setError('You can only update pending for tickets assigned to this agent.');
      return;
    }
    setLoading(true);
    setMessage('');
    setError('');
    try {
      const res = await fetch('/api/admin/daily-update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentId: selectedAgentId,
          chitId: selectedChitId,
          ticketNumber: parseInt(selectedTicketNumber),
          monthYear: selectedMonth + '-01',
          pendingAmount: parseFloat(pendingAmount),
        }),
      });
      const data = await res.json();
      if (data.success) {
        setMessage('Collection updated successfully!');
        setPendingAmount('');
        fetchCollections();
        // Refresh tickets
        const url = `/api/admin/daily-update?chitId=${selectedChitId}${selectedAgentId ? `&agentId=${selectedAgentId}` : ''}`;
        const refreshRes = await fetch(url);
        const refreshData = await refreshRes.json();
        if (refreshData.success) setTickets(refreshData.data.tickets);
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('Network error');
    }
    setLoading(false);
  };

  // Edit handlers
  const openEditModal = (col) => {
    setEditingCollection(col);
    setEditPendingAmount(col.pending_amount);
    setEditModalOpen(true);
  };
  const closeEditModal = () => {
    setEditModalOpen(false);
    setEditingCollection(null);
    setEditPendingAmount('');
    setEditError('');
  };
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setEditLoading(true);
    setEditError('');
    try {
      const res = await fetch(`/api/admin/daily-update?id=${editingCollection.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pendingAmount: parseFloat(editPendingAmount) }),
      });
      const data = await res.json();
      if (data.success) {
        closeEditModal();
        fetchCollections();
        setMessage('Pending amount updated!');
        setTimeout(() => setMessage(''), 3000);
      } else {
        setEditError(data.message);
      }
    } catch (err) {
      setEditError('Network error');
    }
    setEditLoading(false);
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this entry?')) return;
    try {
      const res = await fetch(`/api/admin/daily-update?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        fetchCollections();
        setMessage('Entry deleted!');
        setTimeout(() => setMessage(''), 3000);
      } else {
        alert(data.message || 'Failed to delete');
      }
    } catch (err) {
      alert('Network error');
    }
  };

  const clearFilters = () => {
    setFilterAgentId('');
    setFilterChitId('');
    setFilterMonth('');
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-light text-gray-900">Daily Collection Update</h1>
          <p className="text-sm text-gray-500 mt-1">Record and manage daily collections for assigned tickets</p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">Agent</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaUser className="w-3.5 h-3.5 text-gray-400" />
                  </div>
                  <select
                    className="w-full border border-gray-200 rounded-xl pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent bg-gray-50 appearance-none"
                    value={selectedAgentId}
                    onChange={(e) => setSelectedAgentId(e.target.value)}
                    required
                  >
                    <option value="">Select Agent</option>
                    {agents.map(a => <option key={a.id} value={a.id}>{a.name} ({a.agent_code})</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">Month</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaCalendarAlt className="w-3.5 h-3.5 text-gray-400" />
                  </div>
                  <input
                    type="month"
                    className="w-full border border-gray-200 rounded-xl pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent bg-gray-50"
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">Chit</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaList className="w-3.5 h-3.5 text-gray-400" />
                  </div>
                  <select
                    className="w-full border border-gray-200 rounded-xl pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent bg-gray-50 appearance-none"
                    value={selectedChitId}
                    onChange={(e) => setSelectedChitId(e.target.value)}
                    required
                  >
                    <option value="">Select Chit</option>
                    {chits.map(c => <option key={c.id} value={c.id}>{c.name} ({c.total_tickets} tickets)</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">Ticket</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaTicketAlt className="w-3.5 h-3.5 text-gray-400" />
                  </div>
                  <select
                    className="w-full border border-gray-200 rounded-xl pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent bg-gray-50 appearance-none"
                    value={selectedTicketNumber}
                    onChange={(e) => setSelectedTicketNumber(e.target.value)}
                    required
                    disabled={tickets.length === 0}
                  >
                    <option value="">Select Ticket</option>
                    {tickets.map(t => {
                      let label = `Token ${t.ticketNumber}`;
                      if (t.isAssigned) {
                        label += t.isAssignedToSelected ? ' (Assigned)' : ` (Assigned to ${t.assignedToAgentName})`;
                      } else {
                        label += ' (Unassigned)';
                      }
                      return <option key={t.ticketNumber} value={t.ticketNumber} disabled={!t.isAssignedToSelected}>{label}</option>;
                    })}
                  </select>
                </div>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">Pending Amount (₹)</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaDollarSign className="w-3.5 h-3.5 text-gray-400" />
                </div>
                <input
                  type="number"
                  placeholder="e.g., 3000"
                  className="w-full border border-gray-200 rounded-xl pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent bg-gray-50"
                  value={pendingAmount}
                  onChange={(e) => setPendingAmount(e.target.value)}
                  required
                  disabled={!selectedTicketNumber || !tickets.find(t => t.ticketNumber === parseInt(selectedTicketNumber))?.isAssignedToSelected}
                />
              </div>
            </div>
            {error && <p className="text-red-600 text-sm">{error}</p>}
            {message && <p className="text-green-600 text-sm">{message}</p>}
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-6 py-2.5 rounded-xl transition shadow-sm hover:shadow disabled:opacity-60 disabled:cursor-not-allowed"
              disabled={loading || !selectedTicketNumber || !pendingAmount}
            >
              {loading ? 'Updating...' : 'Update Collection'}
            </button>
          </form>
        </div>

        {/* List Section */}
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <h2 className="text-xl font-light text-gray-800">All Collection Entries</h2>
            <div className="flex flex-wrap items-center gap-3">
              <select
                className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-gray-50"
                value={filterAgentId}
                onChange={(e) => setFilterAgentId(e.target.value)}
              >
                <option value="">All Agents</option>
                {agents.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
              <select
                className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-gray-50"
                value={filterChitId}
                onChange={(e) => setFilterChitId(e.target.value)}
              >
                <option value="">All Chits</option>
                {chits.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <input
                type="month"
                className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-gray-50"
                value={filterMonth}
                onChange={(e) => setFilterMonth(e.target.value)}
              />
              <button
                onClick={clearFilters}
                className="text-sm text-gray-500 hover:text-gray-700 px-3 py-2 rounded-xl border border-gray-200 hover:border-gray-300 transition"
              >
                Clear Filters
              </button>
              <button
                onClick={fetchCollections}
                className="text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-xl transition flex items-center gap-1.5"
              >
                <FaSyncAlt className="w-3.5 h-3.5" /> Refresh
              </button>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto max-h-96 overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50/80 text-gray-500 text-xs uppercase tracking-wider sticky top-0 z-10 backdrop-blur-sm">
                  <tr>
                    <th className="px-5 py-3.5 text-left font-medium">Agent</th>
                    <th className="px-5 py-3.5 text-left font-medium">Chit</th>
                    <th className="px-5 py-3.5 text-left font-medium">Ticket</th>
                    <th className="px-5 py-3.5 text-left font-medium">Month</th>
                    <th className="px-5 py-3.5 text-left font-medium">Pending (₹)</th>
                    <th className="px-5 py-3.5 text-center font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {allCollections.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="px-5 py-8 text-center text-gray-400">
                        No entries found.
                      </td>
                    </tr>
                  ) : (
                    allCollections.map(col => (
                      <tr key={col.id} className="hover:bg-gray-50/60 transition-colors">
                        <td className="px-5 py-3 font-medium text-gray-800">{col.agent_name}</td>
                        <td className="px-5 py-3 text-gray-700">{col.chit_name}</td>
                        <td className="px-5 py-3 text-gray-700">Token {col.ticket_number}</td>
                        <td className="px-5 py-3 text-gray-500">
                          {new Date(col.month_year).toLocaleString('en-GB', { month: 'short', year: 'numeric' })}
                        </td>
                        <td className="px-5 py-3 text-red-600 font-medium">
                          ₹{parseFloat(col.pending_amount).toLocaleString()}
                        </td>
                        <td className="px-5 py-3 text-center">
                          <div className="flex items-center justify-center space-x-1.5">
                            <button
                              onClick={() => openEditModal(col)}
                              className="p-1.5 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition"
                              title="Edit"
                            >
                              <FaEdit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(col.id)}
                              className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
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
      </div>

      {/* Edit Modal */}
      {editModalOpen && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 relative animate-fadeInUp">
            <button
              onClick={closeEditModal}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition"
            >
              <FaTimes className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-light text-gray-900 mb-1">Update Pending Amount</h2>
            <p className="text-sm text-gray-500 mb-5">
              {editingCollection?.agent_name} – {editingCollection?.chit_name} – Token {editingCollection?.ticket_number}
            </p>
            <form onSubmit={handleEditSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">
                  Pending Amount (₹)
                </label>
                <input
                  type="number"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent bg-gray-50"
                  value={editPendingAmount}
                  onChange={(e) => setEditPendingAmount(e.target.value)}
                  required
                />
              </div>
              {editError && <p className="text-red-600 text-sm">{editError}</p>}
              <div className="flex space-x-3 pt-2">
                <button
                  type="button"
                  onClick={closeEditModal}
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