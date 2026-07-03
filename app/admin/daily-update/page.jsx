'use client';
import { useState, useEffect, useMemo } from 'react';
import {
  FaCalendarAlt,
  FaSave,
  FaUser,
  FaList,
  FaTicketAlt,
  FaDollarSign,
  FaEdit,
  FaTrash,
  FaTimes,
  FaSearch,
  FaSync,
} from 'react-icons/fa';

export default function DailyUpdate() {
  const [agents, setAgents] = useState([]);
  const [chits, setChits] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [selectedAgentId, setSelectedAgentId] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedChitId, setSelectedChitId] = useState('');
  const [selectedTicketNumber, setSelectedTicketNumber] = useState('');
  const [pendingAmount, setPendingAmount] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [allCollections, setAllCollections] = useState([]);
  const [filterAgentId, setFilterAgentId] = useState('');
  const [filterChitId, setFilterChitId] = useState('');
  const [filterMonth, setFilterMonth] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Edit modal state
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingCollection, setEditingCollection] = useState(null);
  const [editPendingAmount, setEditPendingAmount] = useState('');
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState('');

  // Set current month on client only
  useEffect(() => {
    const now = new Date();
    const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    setSelectedMonth(month);
    setFilterMonth(month);
  }, []);

  // Fetch agents and chits
  useEffect(() => {
    const fetchDropdowns = async () => {
      const [agentsRes, chitsRes] = await Promise.all([
        fetch('/api/admin/agents'),
        fetch('/api/admin/chits'),
      ]);
      const agentsData = await agentsRes.json();
      const chitsData = await chitsRes.json();
      if (agentsData.success) setAgents(agentsData.data);
      if (chitsData.success) setChits(chitsData.data);
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

  // Fetch collections
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
    if (filterMonth) fetchCollections();
  }, [filterAgentId, filterChitId, filterMonth]);

  // Submit new collection
  const handleSubmit = async (e) => {
    e.preventDefault();
    const ticket = tickets.find((t) => t.ticketNumber === parseInt(selectedTicketNumber));
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
    setSearchTerm('');
  };

  // Filter collections by search term
  const filteredCollections = useMemo(() => {
    if (!searchTerm.trim()) return allCollections;
    const term = searchTerm.toLowerCase().trim();
    return allCollections.filter(
      (col) =>
        col.agent_name?.toLowerCase().includes(term) ||
        col.chit_name?.toLowerCase().includes(term) ||
        col.ticket_number?.toString().includes(term)
    );
  }, [allCollections, searchTerm]);

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Page Header */}
        <div className="flex items-center space-x-3 mb-6">
          <FaCalendarAlt className="w-5 h-5 text-blue-600" />
          <h1 className="text-xl font-semibold text-gray-900">Daily Collection Update</h1>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 mb-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="agent" className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                  Agent
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaUser className="w-3.5 h-3.5 text-gray-400" />
                  </div>
                  <select
                    id="agent"
                    className="w-full border border-gray-200 rounded-lg pl-9 pr-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
                    value={selectedAgentId}
                    onChange={(e) => setSelectedAgentId(e.target.value)}
                    required
                  >
                    <option value="">Select Agent</option>
                    {agents.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name} ({a.agent_code})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label htmlFor="month" className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                  Month
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaCalendarAlt className="w-3.5 h-3.5 text-gray-400" />
                  </div>
                  <input
                    id="month"
                    type="month"
                    className="w-full border border-gray-200 rounded-lg pl-9 pr-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    required
                    suppressHydrationWarning
                  />
                </div>
              </div>
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
                        {c.name} ({c.total_tickets} tickets)
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
                    {tickets.map((t) => {
                      let label = `Token ${t.ticketNumber}`;
                      if (t.isAssigned) {
                        label += t.isAssignedToSelected
                          ? ' (Assigned)'
                          : ` (Assigned to ${t.assignedToAgentName})`;
                      } else {
                        label += ' (Unassigned)';
                      }
                      return (
                        <option key={t.ticketNumber} value={t.ticketNumber} disabled={!t.isAssignedToSelected}>
                          {label}
                        </option>
                      );
                    })}
                  </select>
                </div>
              </div>
            </div>
            <div>
              <label htmlFor="pending" className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                Pending Amount (₹)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaDollarSign className="w-3.5 h-3.5 text-gray-400" />
                </div>
                <input
                  id="pending"
                  type="number"
                  placeholder="e.g., 3000"
                  className="w-full border border-gray-200 rounded-lg pl-9 pr-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={pendingAmount}
                  onChange={(e) => setPendingAmount(e.target.value)}
                  required
                  disabled={
                    !selectedTicketNumber ||
                    !tickets.find((t) => t.ticketNumber === parseInt(selectedTicketNumber))?.isAssignedToSelected
                  }
                />
              </div>
            </div>
            {error && <p className="text-red-600 text-xs">{error}</p>}
            {message && <p className="text-green-600 text-xs">{message}</p>}
            <div>
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-1.5 rounded-lg transition flex items-center space-x-2 h-9"
                disabled={loading || !selectedTicketNumber || !pendingAmount}
              >
                <FaSave className="w-3.5 h-3.5" />
                <span>{loading ? 'Updating...' : 'Update Collection'}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Collection List */}
        <div className="mb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <h2 className="text-sm font-semibold text-gray-800">All Collection Entries</h2>
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaSearch className="w-3.5 h-3.5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search agent, chit, or ticket..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-40 sm:w-48 border border-gray-200 rounded-lg pl-9 pr-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <select
                className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={filterAgentId}
                onChange={(e) => setFilterAgentId(e.target.value)}
              >
                <option value="">All Agents</option>
                {agents.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
              <select
                className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={filterChitId}
                onChange={(e) => setFilterChitId(e.target.value)}
              >
                <option value="">All Chits</option>
                {chits.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <input
                type="month"
                className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={filterMonth}
                onChange={(e) => setFilterMonth(e.target.value)}
                suppressHydrationWarning
              />
              <button
                onClick={clearFilters}
                className="text-xs text-gray-500 hover:text-gray-700 px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
              >
                Clear Filters
              </button>
              <button
                onClick={fetchCollections}
                className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-lg transition flex items-center space-x-1"
              >
                <FaSync className="w-3 h-3" />
                <span>Refresh</span>
              </button>
              <span className="text-xs text-gray-500">
                {filteredCollections.length} / {allCollections.length}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto overflow-y-auto max-h-80">
            <table className="w-full text-xs">
              <thead className="bg-gray-50 text-gray-600 uppercase tracking-wider sticky top-0 z-10 shadow-sm">
                <tr>
                  <th className="px-4 py-2 text-left font-medium">Agent</th>
                  <th className="px-4 py-2 text-left font-medium">Chit</th>
                  <th className="px-4 py-2 text-left font-medium">Ticket</th>
                  <th className="px-4 py-2 text-left font-medium">Month</th>
                  <th className="px-4 py-2 text-right font-medium">Pending (₹)</th>
                  <th className="px-4 py-2 text-center font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredCollections.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-4 py-4 text-center text-gray-400 text-xs">
                      {searchTerm ? 'No entries match your search.' : 'No entries found.'}
                    </td>
                  </tr>
                ) : (
                  filteredCollections.map((col) => (
                    <tr key={col.id} className="hover:bg-gray-50 transition">
                      <td className="px-4 py-2.5 font-medium text-gray-800">{col.agent_name}</td>
                      <td className="px-4 py-2.5 text-gray-700">{col.chit_name}</td>
                      <td className="px-4 py-2.5 text-gray-700">Token {col.ticket_number}</td>
                      <td className="px-4 py-2.5 text-gray-700">
                        {col.month_year
                          ? new Date(col.month_year).toLocaleString('en-GB', { month: 'short', year: 'numeric' })
                          : '—'}
                      </td>
                      <td className="px-4 py-2.5 text-right text-red-600 font-medium">
                        ₹{parseFloat(col.pending_amount).toLocaleString()}
                      </td>
                      <td className="px-4 py-2.5 text-center">
                        <div className="flex items-center justify-center space-x-2">
                          <button
                            onClick={() => openEditModal(col)}
                            className="text-blue-600 hover:text-blue-800 transition p-1 rounded hover:bg-blue-50"
                            title="Edit"
                          >
                            <FaEdit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(col.id)}
                            className="text-red-600 hover:text-red-800 transition p-1 rounded hover:bg-red-50"
                            title="Delete"
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
            <h2 className="text-sm font-semibold text-gray-900 mb-1">Update Pending Amount</h2>
            <p className="text-xs text-gray-500 mb-4">
              {editingCollection?.agent_name} – {editingCollection?.chit_name} – Token {editingCollection?.ticket_number}
            </p>
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                  Pending Amount (₹)
                </label>
                <input
                  type="number"
                  className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={editPendingAmount}
                  onChange={(e) => setEditPendingAmount(e.target.value)}
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