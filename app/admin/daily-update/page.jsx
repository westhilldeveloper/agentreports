'use client';
import { useState, useEffect } from 'react';
import { FaUser, FaCalendarAlt, FaList, FaTicketAlt, FaDollarSign, FaSave } from 'react-icons/fa';

export default function DailyUpdate() {
  const [agents, setAgents] = useState([]);
  const [chits, setChits] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [selectedAgentId, setSelectedAgentId] = useState('');
  const [selectedChitId, setSelectedChitId] = useState('');
  const [selectedTicketNumber, setSelectedTicketNumber] = useState('');
  const [monthYear, setMonthYear] = useState('');
  const [pendingAmount, setPendingAmount] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Fetch agents and chits on mount
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

  // Fetch tickets when chit or agent changes
  useEffect(() => {
    if (!selectedChitId) {
      setTickets([]);
      return;
    }
    const fetchTickets = async () => {
      const url = `/api/admin/daily-update?chitId=${selectedChitId}${selectedAgentId ? `&agentId=${selectedAgentId}` : ''}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setTickets(data.data.tickets);
      }
    };
    fetchTickets();
  }, [selectedChitId, selectedAgentId]);

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
          monthYear: monthYear + '-01',
          pendingAmount: parseFloat(pendingAmount),
        }),
      });
      const data = await res.json();
      if (data.success) {
        setMessage('Collection updated successfully!');
        setPendingAmount('');
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

  const selectedTicket = tickets.find(t => t.ticketNumber === parseInt(selectedTicketNumber));

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Page Header */}
        <div className="flex items-center space-x-3 mb-6">
          <FaCalendarAlt className="w-5 h-5 text-blue-600" />
          <h1 className="text-xl font-semibold text-gray-900">Daily Collection Update</h1>
        </div>

        {/* Form */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Agent */}
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
                    <option key={a.id} value={a.id}>{a.name} ({a.agent_code})</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Month */}
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
                  value={monthYear}
                  onChange={(e) => setMonthYear(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Chit */}
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
                    <option key={c.id} value={c.id}>{c.name} ({c.total_tickets} tickets)</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Ticket */}
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
                      if (t.isAssignedToSelected) {
                        label += ' (Assigned to you)';
                      } else {
                        label += ` (Assigned to ${t.assignedToAgentName})`;
                      }
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
              {selectedTicket && (
                <p className="text-xs mt-1 text-gray-500">
                  {selectedTicket.isAssignedToSelected
                    ? '✓ You can update pending for this ticket.'
                    : '✗ This ticket is not assigned to the selected agent. Please select a different ticket or assign it first.'}
                </p>
              )}
            </div>

            {/* Pending Amount */}
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
                  disabled={!selectedTicket || !selectedTicket.isAssignedToSelected}
                />
              </div>
            </div>

            {error && <p className="text-red-600 text-xs">{error}</p>}
            {message && <p className="text-green-600 text-xs">{message}</p>}

            <div>
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-1.5 rounded-lg transition flex items-center space-x-2 h-9"
                disabled={loading || !selectedTicketNumber || !pendingAmount || !monthYear}
              >
                <FaSave className="w-3.5 h-3.5" />
                <span>{loading ? 'Updating...' : 'Update Collection'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}