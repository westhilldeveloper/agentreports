'use client';
import { useState, useEffect } from 'react';
import { FaEdit, FaTrash, FaTimes, FaSyncAlt, FaUser, FaTag, FaPhone, FaIdBadge } from 'react-icons/fa';

export default function AssignTickets() {
  const [agents, setAgents] = useState([]);
  const [chits, setChits] = useState([]);
  const [selectedAgentId, setSelectedAgentId] = useState('');
  const [selectedChitId, setSelectedChitId] = useState('');
  const [ticketNumber, setTicketNumber] = useState('');
  const [unassignedTickets, setUnassignedTickets] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [filterText, setFilterText] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetchingAssignments, setFetchingAssignments] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [editCustomerName, setEditCustomerName] = useState('');
  const [editCustomerPhone, setEditCustomerPhone] = useState('');

  // Edit modal state
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState(null);
  const [editAgentId, setEditAgentId] = useState('');
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState('');

  // Fetch agents and chits on mount
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

  // Fetch assignments on mount and after each successful assignment
  const fetchAssignments = async () => {
    setFetchingAssignments(true);
    try {
      const res = await fetch('/api/admin/assign-tickets');
      const data = await res.json();
      if (data.success) {
        setAssignments(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch assignments:', err);
    }
    setFetchingAssignments(false);
  };

  useEffect(() => {
    fetchAssignments();
  }, []);

  // Fetch unassigned tickets when chit changes
  const fetchUnassignedTickets = async (chitId) => {
    if (!chitId) {
      setUnassignedTickets([]);
      return;
    }
    const res = await fetch(`/api/admin/daily-update?chitId=${chitId}`);
    const data = await res.json();
    if (data.success) {
      const unassigned = data.data.tickets
        .filter(t => !t.isAssigned)
        .map(t => t.ticketNumber);
      setUnassignedTickets(unassigned);
    }
  };

  const handleChitChange = (e) => {
    const chitId = e.target.value;
    setSelectedChitId(chitId);
    setTicketNumber('');
    fetchUnassignedTickets(chitId);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');
    try {
      const res = await fetch('/api/admin/assign-tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentId: selectedAgentId,
          chitId: selectedChitId,
          ticketNumber: parseInt(ticketNumber),
          customer_name: customerName,
          customer_phone: customerPhone,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setMessage(`Ticket ${ticketNumber} assigned successfully!`);
        setTicketNumber('');
        setCustomerName('');
        setCustomerPhone('');
        fetchUnassignedTickets(selectedChitId);
        fetchAssignments();
        setTimeout(() => setMessage(''), 3000);
      } else {
        setError(data.message || 'Assignment failed');
      }
    } catch (err) {
      setError('Network error');
    }
    setLoading(false);
  };

  // Edit handlers
  const openEditModal = (assignment) => {
    setEditingAssignment(assignment);
    setEditAgentId(assignment.agent_id);
    setEditCustomerName(assignment.customer_name || '');
    setEditCustomerPhone(assignment.customer_phone || '');
    setEditError('');
    setEditModalOpen(true);
  };

  const closeEditModal = () => {
    setEditModalOpen(false);
    setEditingAssignment(null);
    setEditAgentId('');
    setEditCustomerName('');
    setEditCustomerPhone('');
    setEditError('');
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setEditLoading(true);
    setEditError('');
    try {
      const res = await fetch(`/api/admin/assign-tickets/${editingAssignment.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentId: editAgentId,
          customer_name: editCustomerName,
          customer_phone: editCustomerPhone,
        }),
      });
      const data = await res.json();
      if (data.success) {
        closeEditModal();
        fetchAssignments();
        setMessage('Ticket reassigned successfully!');
        setTimeout(() => setMessage(''), 3000);
      } else {
        setEditError(data.message);
      }
    } catch (err) {
      setEditError('Network error');
    }
    setEditLoading(false);
  };

  // Delete handler
  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to unassign this ticket? This cannot be undone if there are no collections.')) return;
    try {
      const res = await fetch(`/api/admin/assign-tickets/${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        fetchAssignments();
        setMessage('Ticket unassigned successfully!');
        setTimeout(() => setMessage(''), 3000);
      } else {
        alert(data.message || 'Failed to unassign ticket');
      }
    } catch (err) {
      alert('Network error');
    }
  };

  // Filter assignments by agent name, code, chit, or customer details
  const filteredAssignments = assignments.filter((a) => {
    const search = filterText.toLowerCase();
    return (
      a.agent_name?.toLowerCase().includes(search) ||
      a.agent_code?.toLowerCase().includes(search) ||
      a.chit_name?.toLowerCase().includes(search) ||
      a.customer_name?.toLowerCase().includes(search) ||
      a.customer_phone?.toLowerCase().includes(search)
    );
  });

  return (
     <div suppressHydrationWarning className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 font-sans text-gray-800">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-light tracking-tight text-gray-900">Assign Tickets</h1>
        <p className="text-xs text-gray-500 mt-0.5">Allocate tickets to agents for collection</p>
      </div>

      {/* Form Card */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 sm:p-6 mb-8 transition-shadow hover:shadow-md">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Agent */}
            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                Agent
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaUser className="w-4 h-4 text-gray-400" />
                </div>
                <select
                  className="w-full border border-gray-200 rounded-lg pl-10 pr-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition bg-gray-50 appearance-none"
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

            {/* Chit */}
            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                Chit
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaTag className="w-4 h-4 text-gray-400" />
                </div>
                <select
                  className="w-full border border-gray-200 rounded-lg pl-10 pr-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition bg-gray-50 appearance-none"
                  value={selectedChitId}
                  onChange={handleChitChange}
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

            {/* Ticket */}
            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                Ticket
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaIdBadge className="w-4 h-4 text-gray-400" />
                </div>
                <select
                  className="w-full border border-gray-200 rounded-lg pl-10 pr-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition bg-gray-50 appearance-none"
                  value={ticketNumber}
                  onChange={(e) => setTicketNumber(e.target.value)}
                  required
                  disabled={unassignedTickets.length === 0}
                >
                  <option value="">Select Ticket</option>
                  {unassignedTickets.map((num) => (
                    <option key={num} value={num}>
                      Token {num}
                    </option>
                  ))}
                </select>
                {selectedChitId && unassignedTickets.length === 0 && (
                  <p className="text-xs text-amber-600 mt-1">No unassigned tickets left for this chit.</p>
                )}
              </div>
            </div>

            {/* Customer Name */}
            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                Customer Name
              </label>
              <input
                type="text"
                placeholder="Enter customer name"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition bg-gray-50"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                suppressHydrationWarning
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Customer Phone */}
            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                Customer Phone
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaPhone className="w-4 h-4 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Enter customer phone"
                  className="w-full border border-gray-200 rounded-lg pl-10 pr-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition bg-gray-50"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  suppressHydrationWarning
                />
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-xs">
              {error}
            </div>
          )}
          {message && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-3 py-2 rounded-lg text-xs">
              {message}
            </div>
          )}

          <div className="flex items-center space-x-3 pt-1">
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-2 rounded-lg transition shadow-sm hover:shadow focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed text-xs"
              disabled={loading || !ticketNumber}
            >
              {loading ? 'Assigning...' : 'Assign Ticket'}
            </button>
            <button
              type="button"
              onClick={() => {
                setSelectedAgentId('');
                setSelectedChitId('');
                setTicketNumber('');
                setCustomerName('');
                setCustomerPhone('');
                setUnassignedTickets([]);
                setError('');
                setMessage('');
              }}
              className="text-xs text-gray-400 hover:text-gray-600 transition"
            >
              Clear all
            </button>
          </div>
        </form>
      </div>

      {/* Assigned Tickets Section */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
          <h2 className="text-base font-light text-gray-800">Assigned Tickets</h2>
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Filter by agent, chit, or customer..."
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition bg-gray-50 w-full sm:w-48"
              suppressHydrationWarning
            />
            <button
              onClick={fetchAssignments}
              className="inline-flex items-center gap-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-600 px-3 py-1.5 rounded-lg transition"
              disabled={fetchingAssignments}
            >
              <FaSyncAlt className={`w-3 h-3 ${fetchingAssignments ? 'animate-spin' : ''}`} />
              {fetchingAssignments ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto max-h-[420px] overflow-y-auto">
            <table className="w-full text-xs">
              <thead className="bg-gray-50/80 text-gray-500 uppercase tracking-wider sticky top-0 z-10 backdrop-blur-sm">
                <tr>
                  <th className="px-3 py-2 text-left font-medium">Agent</th>
                  <th className="px-3 py-2 text-left font-medium">Code</th>
                  <th className="px-3 py-2 text-left font-medium">Chit</th>
                  <th className="px-3 py-2 text-left font-medium">Ticket</th>
                  <th className="px-3 py-2 text-left font-medium">Customer</th>
                  <th className="px-3 py-2 text-left font-medium">Phone</th>
                  <th className="px-3 py-2 text-left font-medium">Assigned</th>
                  <th className="px-3 py-2 text-center font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {fetchingAssignments ? (
                  <tr>
                    <td colSpan="8" className="px-3 py-4 text-center text-gray-400 text-xs">
                      Loading assignments...
                    </td>
                  </tr>
                ) : filteredAssignments.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="px-3 py-4 text-center text-gray-400 text-xs">
                      {filterText ? 'No matching assignments found.' : 'No tickets assigned yet.'}
                    </td>
                  </tr>
                ) : (
                  filteredAssignments.map((a) => (
                    <tr key={a.id} className="hover:bg-gray-50/60 transition-colors">
                      <td className="px-3 py-2 font-medium text-gray-800">{a.agent_name}</td>
                      <td className="px-3 py-2 text-gray-500">{a.agent_code}</td>
                      <td className="px-3 py-2 text-gray-700">{a.chit_name}</td>
                      <td className="px-3 py-2 text-gray-700">Token {a.ticket_number}</td>
                      <td className="px-3 py-2 text-gray-700">{a.customer_name || '—'}</td>
                      <td className="px-3 py-2 text-gray-700">{a.customer_phone || '—'}</td>
                      <td className="px-3 py-2 text-gray-500 text-xs">{a.assigned_date}</td>
                      <td className="px-3 py-2 text-center">
                        <div className="flex items-center justify-center space-x-1">
                          <button
                            onClick={() => openEditModal(a)}
                            className="p-1 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded transition"
                            title="Reassign"
                          >
                            <FaEdit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(a.id)}
                            className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition"
                            title="Unassign"
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
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 relative animate-fadeInUp">
            <button
              onClick={closeEditModal}
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 transition"
            >
              <FaTimes className="w-4 h-4" />
            </button>
            <h2 className="text-lg font-light text-gray-900 mb-1">Reassign Ticket</h2>
            <p className="text-xs text-gray-500 mb-4">
              Ticket <span className="font-medium text-gray-700">#{editingAssignment?.ticket_number}</span> from{' '}
              <span className="font-medium text-gray-700">{editingAssignment?.chit_name}</span>
              <br />
              Currently assigned to <span className="font-medium text-gray-700">{editingAssignment?.agent_name}</span>
            </p>
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                  New Agent
                </label>
                <select
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition bg-gray-50 appearance-none"
                  value={editAgentId}
                  onChange={(e) => setEditAgentId(e.target.value)}
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

              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                  Customer Name
                </label>
                <input
                  type="text"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition bg-gray-50"
                  value={editCustomerName}
                  onChange={(e) => setEditCustomerName(e.target.value)}
                  suppressHydrationWarning
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                  Customer Phone
                </label>
                <input
                  type="text"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition bg-gray-50"
                  value={editCustomerPhone}
                  onChange={(e) => setEditCustomerPhone(e.target.value)}
                  suppressHydrationWarning
                />
              </div>

              {editError && <p className="text-red-600 text-xs">{editError}</p>}

              <div className="flex space-x-3 pt-2">
                <button
                  type="button"
                  onClick={closeEditModal}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-medium px-3 py-2 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium px-3 py-2 rounded-lg transition shadow-sm disabled:opacity-60"
                  disabled={editLoading}
                >
                  {editLoading ? 'Reassigning...' : 'Reassign'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}