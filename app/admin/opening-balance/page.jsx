'use client';
import { useState, useEffect } from 'react';
import { FaList, FaTicketAlt, FaDollarSign, FaSave, FaTimes } from 'react-icons/fa';

export default function OpeningBalancePage() {
  const [chits, setChits] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [selectedChitId, setSelectedChitId] = useState('');
  const [selectedTicketNumber, setSelectedTicketNumber] = useState('');
  const [openingBalance, setOpeningBalance] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [allBalances, setAllBalances] = useState([]);

  // Fetch chits on mount
  useEffect(() => {
    fetch('/api/admin/chits')
      .then(res => res.json())
      .then(data => { if (data.success) setChits(data.data); });
  }, []);

  // Fetch tickets when chit changes
  useEffect(() => {
    if (!selectedChitId) {
      setTickets([]);
      return;
    }
    fetch(`/api/admin/agent-tickets?chitId=${selectedChitId}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setTickets(data.data);
        }
      });
  }, [selectedChitId]);

  // Fetch all opening balances for the table
  const fetchBalances = async () => {
    const res = await fetch('/api/admin/opening-balance');
    const data = await res.json();
    if (data.success) setAllBalances(data.data);
  };

  useEffect(() => {
    fetchBalances();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');
    try {
      const res = await fetch('/api/admin/opening-balance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chitId: selectedChitId,
          ticketNumber: parseInt(selectedTicketNumber),
          openingBalance: parseFloat(openingBalance),
        }),
      });
      const data = await res.json();
      if (data.success) {
        setMessage('Opening balance updated successfully!');
        setOpeningBalance('');
        fetchBalances();
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('Network error');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Page Header */}
        <div className="flex items-center space-x-3 mb-6">
          <FaDollarSign className="w-5 h-5 text-blue-600" />
          <h1 className="text-xl font-semibold text-gray-900">Set Opening Balance</h1>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 mb-6">
          <form onSubmit={handleSubmit} className="space-y-4">
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
                  {chits.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
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
                  {tickets.map(t => (
                    <option key={t.ticket_number} value={t.ticket_number}>
                      Token {t.ticket_number} {t.agent_name ? `(Assigned to ${t.agent_name})` : '(Unassigned)'}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="balance" className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                Opening Balance (₹)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaDollarSign className="w-3.5 h-3.5 text-gray-400" />
                </div>
                <input
                  id="balance"
                  type="number"
                  placeholder="e.g., 5000"
                  className="w-full border border-gray-200 rounded-lg pl-9 pr-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={openingBalance}
                  onChange={(e) => setOpeningBalance(e.target.value)}
                  required
                />
              </div>
            </div>

            {error && <p className="text-red-600 text-xs">{error}</p>}
            {message && <p className="text-green-600 text-xs">{message}</p>}

            <div>
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-1.5 rounded-lg transition flex items-center space-x-2 h-9"
                disabled={loading}
              >
                <FaSave className="w-3.5 h-3.5" />
                <span>{loading ? 'Saving...' : 'Save Opening Balance'}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Table – Fixed height, scrollable */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-800">Current Opening Balances</h2>
            <span className="text-xs text-gray-500">{allBalances.length} total</span>
          </div>
          <div className="max-h-80 overflow-y-auto">
            <table className="w-full text-xs">
              <thead className="bg-gray-50 text-gray-600 uppercase tracking-wider sticky top-0 z-10">
                <tr>
                  <th className="px-4 py-2 text-left font-medium">Chit</th>
                  <th className="px-4 py-2 text-left font-medium">Ticket</th>
                  <th className="px-4 py-2 text-left font-medium">Agent</th>
                  <th className="px-4 py-2 text-right font-medium">Opening Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {allBalances.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="px-4 py-4 text-center text-gray-400 text-xs">
                      No opening balances set.
                    </td>
                  </tr>
                ) : (
                  allBalances.map((b) => (
                    <tr key={b.id} className="hover:bg-gray-50 transition">
                      <td className="px-4 py-2.5 font-medium text-gray-800">{b.chit_name}</td>
                      <td className="px-4 py-2.5 text-gray-700">Token {b.ticket_number}</td>
                      <td className="px-4 py-2.5 text-gray-700">{b.agent_name || 'Unassigned'}</td>
                      <td className="px-4 py-2.5 text-right font-medium text-gray-800">
                        ₹{parseFloat(b.opening_balance).toLocaleString()}
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
  );
}