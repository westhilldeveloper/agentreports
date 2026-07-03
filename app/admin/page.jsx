'use client';
import  React, { useState, useEffect } from 'react';
import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import { FaBullseye, FaMoneyBillWave, FaClock, FaUsers, FaList } from 'react-icons/fa';

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend, ArcElement);

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [selectedChitId, setSelectedChitId] = useState('');
  const [chitOptions, setChitOptions] = useState([]);
  const [extraStats, setExtraStats] = useState({ agents: 0, chits: 0 });

  const [expandedAgentId, setExpandedAgentId] = useState(null);
  const [agentTickets, setAgentTickets] = useState({});
  const [loadingTickets, setLoadingTickets] = useState({});

  // Fetch extra stats (total agents, chits)
  useEffect(() => {
    const fetchExtra = async () => {
      const [agentsRes, chitsRes] = await Promise.all([
        fetch('/api/admin/agents'),
        fetch('/api/admin/chits'),
      ]);
      const agentsData = await agentsRes.json();
      const chitsData = await chitsRes.json();
      if (agentsData.success) setExtraStats(prev => ({ ...prev, agents: agentsData.data.length }));
      if (chitsData.success) setExtraStats(prev => ({ ...prev, chits: chitsData.data.length }));
    };
    fetchExtra();
  }, []);

  const toggleAgentDetails = async (agentId) => {
  if (expandedAgentId === agentId) {
    setExpandedAgentId(null);
    return;
  }
  // Fetch tickets if not loaded
  if (!agentTickets[agentId]) {
    setLoadingTickets(prev => ({ ...prev, [agentId]: true }));
    try {
      const res = await fetch(`/api/admin/agent-tickets?agentId=${agentId}&month=${selectedMonth}`);
      const data = await res.json();
      if (data.success) {
        setAgentTickets(prev => ({ ...prev, [agentId]: data.data }));
      }
    } catch (err) {
      console.error('Failed to load tickets');
    }
    setLoadingTickets(prev => ({ ...prev, [agentId]: false }));
  }
  setExpandedAgentId(agentId);
};

  const fetchDashboard = async () => {
    setLoading(true);
    setError('');
    try {
      const url = `/api/admin/dashboard?month=${selectedMonth}${selectedChitId ? `&chitId=${selectedChitId}` : ''}`;
      const res = await fetch(url);
      const result = await res.json();
      if (result.success) {
        setData(result.data);
        if (result.data.breakdown && chitOptions.length === 0) {
          setChitOptions(result.data.breakdown.map(b => ({ id: b.chitId, name: b.chitName })));
        }
      } else {
        setError('Failed to load data');
      }
    } catch (err) {
      setError('Network error');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchDashboard();
  }, [selectedMonth, selectedChitId]);

  if (loading) {
  return (
    <div>
      {/* Header & Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <div className="h-7 w-48 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-4 w-64 bg-gray-200 rounded mt-1 animate-pulse"></div>
        </div>
        <div className="mt-2 sm:mt-0 flex items-center gap-3">
          <div className="h-9 w-40 bg-gray-200 rounded-lg animate-pulse"></div>
          <div className="h-9 w-32 bg-gray-200 rounded-lg animate-pulse"></div>
          <div className="h-9 w-20 bg-gray-200 rounded-lg animate-pulse"></div>
        </div>
      </div>

      {/* 5 Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg shadow-sm p-4 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <div className="h-3 w-20 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-6 w-24 bg-gray-200 rounded mt-1 animate-pulse"></div>
              </div>
              <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse"></div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-100">
          <div className="h-4 w-40 bg-gray-200 rounded mb-3 animate-pulse"></div>
          <div className="h-52 bg-gray-200 rounded animate-pulse"></div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-100 flex flex-col items-center">
          <div className="h-4 w-32 bg-gray-200 rounded mb-3 animate-pulse"></div>
          <div className="w-40 h-40 bg-gray-200 rounded-full animate-pulse"></div>
          <div className="h-4 w-48 bg-gray-200 rounded mt-3 animate-pulse"></div>
        </div>
      </div>

      {/* Chit Breakdown */}
      <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-100 mb-6">
        <div className="h-4 w-40 bg-gray-200 rounded mb-3 animate-pulse"></div>
        <div className="h-52 bg-gray-200 rounded animate-pulse"></div>
      </div>

      {/* Agents Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden mb-6">
        <div className="px-4 py-3 border-b border-gray-100">
          <div className="h-4 w-32 bg-gray-200 rounded animate-pulse"></div>
        </div>
        <div className="overflow-x-auto max-h-64 overflow-y-auto">
          <table className="w-full text-xs">
            <thead className="bg-gray-50">
              <tr>
                {['Agent', 'Target', 'Collected', 'Pending', 'Progress'].map((_, i) => (
                  <th key={i} className="px-4 py-2 text-left">
                    <div className="h-3 w-16 bg-gray-200 rounded animate-pulse"></div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[...Array(5)].map((_, i) => (
                <tr key={i} className="border-t">
                  <td className="px-4 py-2"><div className="h-3 w-24 bg-gray-200 rounded animate-pulse"></div></td>
                  <td className="px-4 py-2"><div className="h-3 w-16 bg-gray-200 rounded ml-auto animate-pulse"></div></td>
                  <td className="px-4 py-2"><div className="h-3 w-16 bg-gray-200 rounded ml-auto animate-pulse"></div></td>
                  <td className="px-4 py-2"><div className="h-3 w-16 bg-gray-200 rounded ml-auto animate-pulse"></div></td>
                  <td className="px-4 py-2"><div className="h-3 w-20 bg-gray-200 rounded ml-auto animate-pulse"></div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

  if (error) {
    return <div className="text-red-600 text-center py-8">{error}</div>;
  }

  if (!data) {
    return <div className="text-center py-8">No data available.</div>;
  }

  const { summary, dailyTrend, breakdown, agentsBreakdown, monthlyTrend } = data;
  const { totalTarget, totalCollected, totalPending } = summary;
  console.log("daily trend=====>", dailyTrend)
  // Chart Data
  const dailyLabels = dailyTrend.map(d => {
    const parts = d.date.split('-');
    return `${parts[2]}/${parts[1]}`;
  });
  const dailyValues = dailyTrend.map(d => d.collected);

  const dailyChartData = {
    labels: dailyLabels,
    datasets: [
      {
        label: 'Daily Collection (₹)',
        data: dailyValues,
        backgroundColor: '#2563EB',
        borderRadius: 4,
      },
    ],
  };

  const chitLabels = breakdown.map(b => b.chitName);
  const chitCollected = breakdown.map(b => b.collected);
  const chitPending = breakdown.map(b => b.pending);

  const chitChartData = {
    labels: chitLabels,
    datasets: [
      { label: 'Collected', data: chitCollected, backgroundColor: '#10B981' },
      { label: 'Pending', data: chitPending, backgroundColor: '#DC2626' },
    ],
  };

  const doughnutData = {
    labels: ['Collected', 'Pending'],
    datasets: [{ data: [totalCollected, totalPending], backgroundColor: ['#2563EB', '#DC2626'] }],
  };

  const trendLabels = monthlyTrend.map(t => t.month_label);
  const trendCollected = monthlyTrend.map(t => parseFloat(t.total_collected) || 0);
  const trendPending = monthlyTrend.map(t => parseFloat(t.total_pending) || 0);

  const trendData = {
    labels: trendLabels,
    datasets: [
      { label: 'Collected', data: trendCollected, backgroundColor: '#3B82F6' },
      { label: 'Pending', data: trendPending, backgroundColor: '#F59E0B' },
    ],
  };

  return (
    <div>
      {/* Header & Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Admin Dashboard</h1>
          <p className="text-sm text-gray-500">Overview of all agents' collections</p>
        </div>
        <div className="mt-2 sm:mt-0 flex items-center gap-3">
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <select
            value={selectedChitId}
            onChange={(e) => setSelectedChitId(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Chits</option>
            {chitOptions.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <button
            onClick={fetchDashboard}
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-1.5 rounded-lg transition"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Total Agents</p>
              <p className="text-lg font-bold text-gray-900">{extraStats.agents}</p>
            </div>
            <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center text-blue-600">
              <FaUsers className="w-4 h-4" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Total Chits</p>
              <p className="text-lg font-bold text-gray-900">{extraStats.chits}</p>
            </div>
            <div className="w-10 h-10 bg-purple-50 rounded-full flex items-center justify-center text-purple-600">
              <FaList className="w-4 h-4" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Total Target</p>
              <p className="text-lg font-bold text-gray-900">₹{totalTarget.toLocaleString()}</p>
            </div>
            <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center text-blue-600">
              <FaBullseye className="w-4 h-4" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Total Collected</p>
              <p className="text-lg font-bold text-green-600">₹{totalCollected.toLocaleString()}</p>
            </div>
            <div className="w-10 h-10 bg-green-50 rounded-full flex items-center justify-center text-green-600">
              <FaMoneyBillWave className="w-4 h-4" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Total Pending</p>
              <p className="text-lg font-bold text-red-600">₹{totalPending.toLocaleString()}</p>
            </div>
            <div className="w-10 h-10 bg-red-50 rounded-full flex items-center justify-center text-red-600">
              <FaClock className="w-4 h-4" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-100">
          <h3 className="text-sm font-semibold text-gray-800 mb-3">Daily Collection Trend</h3>
          {dailyTrend.length === 0 ? (
            <div className="h-52 flex items-center justify-center text-xs text-gray-400">No updates for this month.</div>
          ) : (
            <div className="h-52">
              <Bar
                data={dailyChartData}
                options={{
                  maintainAspectRatio: false,
                  scales: {
                    y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.05)' } },
                    x: { grid: { display: false } },
                  },
                  plugins: { legend: { display: false } },
                }}
              />
            </div>
          )}
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-100 flex flex-col items-center">
          <h3 className="text-sm font-semibold text-gray-800 mb-3">Overall Progress</h3>
          <div className="w-40 h-40">
            <Doughnut data={doughnutData} />
          </div>
          <p className="mt-3 text-xs text-gray-600">
            Collected: <span className="font-medium text-green-600">₹{totalCollected.toLocaleString()}</span> &middot; Pending: <span className="font-medium text-red-600">₹{totalPending.toLocaleString()}</span>
          </p>
        </div>
      </div>

      {/* Chit Breakdown */}
      <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-100 mb-6">
        <h3 className="text-sm font-semibold text-gray-800 mb-3">Collection by Chit</h3>
        {breakdown.length === 0 ? (
          <div className="h-52 flex items-center justify-center text-xs text-gray-400">No chits with targets.</div>
        ) : (
          <div className="h-52">
            <Bar
              data={chitChartData}
              options={{
                maintainAspectRatio: false,
                scales: {
                  y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.05)' } },
                  x: { grid: { display: false } },
                },
                plugins: { legend: { position: 'top' } },
              }}
            />
          </div>
        )}
      </div>

      {/* Agents Breakdown Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden mb-6">
        <div className="px-4 py-3 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-800">Agent Performance</h3>
        </div>
        <div className="overflow-x-auto max-h-64 overflow-y-auto">
          <table className="w-full text-xs">
            <thead className="bg-gray-50 text-gray-600 uppercase tracking-wider sticky top-0 z-10 shadow-sm">
              <tr>
                <th className="px-4 py-2 text-left">Agent</th>
                <th className="px-4 py-2 text-right">Target (₹)</th>
                <th className="px-4 py-2 text-right">Collected (₹)</th>
                <th className="px-4 py-2 text-right">Pending (₹)</th>
                <th className="px-4 py-2 text-right">Progress</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
  {agentsBreakdown.length === 0 ? (
    <tr><td colSpan="5" className="px-4 py-4 text-center text-gray-400">No agents with collections.</td></tr>
  ) : (
    agentsBreakdown.map((agent) => (
      <React.Fragment key={agent.agentId}>
        <tr
          className="hover:bg-gray-50 cursor-pointer"
          onClick={() => toggleAgentDetails(agent.agentId)}
        >
          <td className="px-4 py-2 font-medium text-gray-800">{agent.agentName} ({agent.agentCode})</td>
          <td className="px-4 py-2 text-right text-gray-600">₹{agent.target.toLocaleString()}</td>
          <td className="px-4 py-2 text-right text-green-600 font-medium">₹{agent.collected.toLocaleString()}</td>
          <td className="px-4 py-2 text-right text-red-600 font-medium">₹{agent.pending.toLocaleString()}</td>
          <td className="px-4 py-2 text-right">
            <div className="flex items-center justify-end gap-2">
              <div className="w-16 bg-gray-200 rounded-full h-1.5">
                <div
                  className="bg-blue-600 h-1.5 rounded-full"
                  style={{ width: `${agent.target > 0 ? Math.round((agent.collected / agent.target) * 100) : 0}%` }}
                ></div>
              </div>
              <span className="text-xs font-medium text-gray-600">
                {agent.target > 0 ? Math.round((agent.collected / agent.target) * 100) : 0}%
              </span>
            </div>
          </td>
        </tr>
        {expandedAgentId === agent.agentId && (
  <tr>
    <td colSpan="5" className="px-4 py-2 bg-gray-50">
      <div className="pl-8">
        <h4 className="text-xs font-semibold text-gray-600 mb-2">Ticket Details</h4>
        {loadingTickets[agent.agentId] ? (
          <div className="text-xs text-gray-400">Loading...</div>
        ) : agentTickets[agent.agentId]?.length > 0 ? (
          <table className="w-full text-xs">
            <thead>
              <tr className="text-gray-500">
                <th className="px-2 py-1 text-left">Chit</th>
                <th className="px-2 py-1 text-left">Ticket</th>
                <th className="px-2 py-1 text-right">Monthly Target (₹)</th>
                <th className="px-2 py-1 text-right">Opening Balance (₹)</th>
                <th className="px-2 py-1 text-right">Total Target (₹)</th>
                <th className="px-2 py-1 text-right">Collected (₹)</th>
                <th className="px-2 py-1 text-right">Pending (₹)</th>
              </tr>
            </thead>
            <tbody>
              {agentTickets[agent.agentId].map((t, idx) => (
                <tr key={idx} className="border-t border-gray-200">
                  <td className="px-2 py-1">{t.chit_name}</td>
                  <td className="px-2 py-1">Token {t.ticket_number}</td>
                  <td className="px-2 py-1 text-right">₹{parseFloat(t.monthly_target || 0).toLocaleString()}</td>
                  <td className="px-2 py-1 text-right text-amber-600">₹{parseFloat(t.opening_balance || 0).toLocaleString()}</td>
                  <td className="px-2 py-1 text-right font-semibold">₹{parseFloat(t.total_target || 0).toLocaleString()}</td>
                  <td className="px-2 py-1 text-right text-green-600">₹{parseFloat(t.collected || 0).toLocaleString()}</td>
                  <td className="px-2 py-1 text-right text-red-600 font-semibold">₹{parseFloat(t.pending || 0).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="text-xs text-gray-400">No tickets assigned for this month.</div>
        )}
      </div>
    </td>
  </tr>
)}
      </React.Fragment>
    ))
  )}
</tbody>
          </table>
        </div>
      </div>

      {/* Monthly Trend */}
      {/* {monthlyTrend.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-100 mb-6">
          <h3 className="text-sm font-semibold text-gray-800 mb-3">Monthly Trend (Last 6 months)</h3>
          <div className="h-52">
            <Bar
              data={trendData}
              options={{
                maintainAspectRatio: false,
                scales: { y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.05)' } } },
                plugins: { legend: { position: 'top' } },
              }}
            />
          </div>
        </div>
      )} */}
    </div>
  );
}