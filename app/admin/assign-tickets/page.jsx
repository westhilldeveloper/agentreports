'use client';
import { useState, useEffect } from 'react';
import { FaUser, FaList, FaTicketAlt, FaPlus } from 'react-icons/fa';

export default function AssignTickets() {
  const [agents, setAgents] = useState([]);
  const [chits, setChits] = useState([]);
  const [selectedAgentId, setSelectedAgentId] = useState('');
  const [selectedChitId, setSelectedChitId] = useState('');
  const [ticketNumber, setTicketNumber] = useState('');
  const [unassignedTickets, setUnassignedTickets] = useState([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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

  // Fetch tickets and filter unassigned when chit changes
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
      } else {
        setError(data.message || 'Assignment failed');
      }
    } catch (err) {
      setError('Network error');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Page Header */}
        <div className="flex items-center space-x-3 mb-6">
          <FaTicketAlt className="w-5 h-5 text-blue-600" />
          <h1 className="text-xl font-semibold text-gray-900">Assign Tickets to Agents</h1>
        </div>

        {/* Assignment Form */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
          <form onSubmit={handleSubmit} className="space-y-4">
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

            <div>
              <label htmlFor="ticket" className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                Ticket Number
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaTicketAlt className="w-3.5 h-3.5 text-gray-400" />
                </div>
                <select
                  id="ticket"
                  className="w-full border border-gray-200 rounded-lg pl-9 pr-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
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
              </div>
              {selectedChitId && unassignedTickets.length === 0 && (
                <p className="text-xs text-amber-600 mt-1">
                  No unassigned tickets left for this chit.
                </p>
              )}
            </div>

            {error && <p className="text-red-600 text-xs">{error}</p>}
            {message && <p className="text-green-600 text-xs">{message}</p>}

            <div>
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-1.5 rounded-lg transition flex items-center space-x-2 h-9"
                disabled={loading || !ticketNumber}
              >
                <FaPlus className="w-3.5 h-3.5" />
                <span>{loading ? 'Assigning...' : 'Assign Ticket'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}