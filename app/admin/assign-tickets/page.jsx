'use client';
import { useState, useEffect } from 'react';
import { FaEdit, FaTrash, FaTimes, FaSyncAlt } from 'react-icons/fa';

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
        }),
      });
      const data = await res.json();
      if (data.success) {
        setMessage(`Ticket ${ticketNumber} assigned successfully!`);
        setTicketNumber('');
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
    setEditError('');
    setEditModalOpen(true);
  };

  const closeEditModal = () => {
    setEditModalOpen(false);
    setEditingAssignment(null);
    setEditAgentId('');
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
        body: JSON.stringify({ agentId: editAgentId }),
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

  // Filter assignments by agent name or code
  const filteredAssignments = assignments.filter((a) => {
    const search = filterText.toLowerCase();
    return (
      a.agent_name?.toLowerCase().includes(search) ||
      a.agent_code?.toLowerCase().includes(search) ||
      a.chit_name?.toLowerCase().includes(search)
    );
  });

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 font-sans text-gray-800">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-light tracking-tight text-gray-900">Assign Tickets</h1>
        <p className="text-sm text-gray-500 mt-1">Allocate tickets to agents for collection</p>
      </div>

      {/* Assignment Form Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8 mb-10 transition-all hover:shadow-md">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">
                Agent
              </label>
              <select
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition bg-gray-50"
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

            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">
                Chit
              </label>
              <select
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition bg-gray-50"
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

            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">
                Ticket Number
              </label>
              <select
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition bg-gray-50"
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
                <p className="text-xs text-amber-600 mt-1.5">No unassigned tickets left for this chit.</p>
              )}
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2.5 rounded-xl text-sm">
              {error}
            </div>
          )}
          {message && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-2.5 rounded-xl text-sm">
              {message}
            </div>
          )}

          <div className="flex items-center space-x-4 pt-2">
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-8 py-2.5 rounded-xl transition shadow-sm hover:shadow focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed"
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
                setUnassignedTickets([]);
                setError('');
                setMessage('');
              }}
              className="text-sm text-gray-400 hover:text-gray-600 transition"
            >
              Clear all
            </button>
          </div>
        </form>
      </div>

      {/* Assigned Tickets Section */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <h2 className="text-xl font-light text-gray-800">Assigned Tickets</h2>
          <div className="flex items-center gap-3">
            <input
              type="text"
              placeholder="Filter by agent or chit..."
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              className="border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition bg-gray-50 w-full sm:w-56"
            />
            <button
              onClick={fetchAssignments}
              className="inline-flex items-center gap-1.5 text-sm bg-gray-100 hover:bg-gray-200 text-gray-600 px-4 py-2 rounded-xl transition"
              disabled={fetchingAssignments}
            >
              <FaSyncAlt className={`w-3.5 h-3.5 ${fetchingAssignments ? 'animate-spin' : ''}`} />
              {fetchingAssignments ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto max-h-[480px] overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50/80 text-gray-500 text-xs uppercase tracking-wider sticky top-0 z-10 backdrop-blur-sm">
                <tr>
                  <th className="px-5 py-3.5 text-left font-medium">Agent</th>
                  <th className="px-5 py-3.5 text-left font-medium">Agent Code</th>
                  <th className="px-5 py-3.5 text-left font-medium">Chit</th>
                  <th className="px-5 py-3.5 text-left font-medium">Ticket</th>
                  <th className="px-5 py-3.5 text-left font-medium">Assigned Date</th>
                  <th className="px-5 py-3.5 text-center font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {fetchingAssignments ? (
                  <tr>
                    <td colSpan="6" className="px-5 py-8 text-center text-gray-400">
                      Loading assignments...
                    </td>
                  </tr>
                ) : filteredAssignments.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-5 py-8 text-center text-gray-400">
                      {filterText ? 'No matching assignments found.' : 'No tickets assigned yet.'}
                    </td>
                  </tr>
                ) : (
                  filteredAssignments.map((a) => (
                    <tr key={a.id} className="hover:bg-gray-50/60 transition-colors">
                      <td className="px-5 py-3.5 font-medium text-gray-800">{a.agent_name}</td>
                      <td className="px-5 py-3.5 text-gray-500">{a.agent_code}</td>
                      <td className="px-5 py-3.5 text-gray-700">{a.chit_name}</td>
                      <td className="px-5 py-3.5 text-gray-700">Token {a.ticket_number}</td>
                      <td className="px-5 py-3.5 text-gray-500 text-xs">{a.assigned_date}</td>
                      <td className="px-5 py-3.5 text-center">
                        <div className="flex items-center justify-center space-x-1.5">
                          <button
                            onClick={() => openEditModal(a)}
                            className="p-1.5 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition"
                            title="Reassign"
                          >
                            <FaEdit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(a.id)}
                            className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                            title="Unassign"
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
      {editModalOpen && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 relative animate-fadeInUp">
            <button
              onClick={closeEditModal}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition"
            >
              <FaTimes className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-light text-gray-900 mb-1">Reassign Ticket</h2>
            <p className="text-sm text-gray-500 mb-5">
              Ticket <span className="font-medium text-gray-700">#{editingAssignment?.ticket_number}</span> from{' '}
              <span className="font-medium text-gray-700">{editingAssignment?.chit_name}</span>
              <br />
              Currently assigned to <span className="font-medium text-gray-700">{editingAssignment?.agent_name}</span>
            </p>
            <form onSubmit={handleEditSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">
                  New Agent
                </label>
                <select
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition bg-gray-50"
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
                  {editLoading ? 'Reassigning...' : 'Reassign'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Tailwind animation (add to global CSS if not present) */}
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