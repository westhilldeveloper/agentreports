'use client';
import { use, useState, useRef, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Image from 'next/image'; // ✅ import Image
import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
} from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import { FaBullseye, FaMoneyBillWave, FaClock } from 'react-icons/fa';
import FlowerExplosion from '@/components/FlowerExplosion';

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend, ArcElement, PointElement, LineElement);

export default function AgentDashboard({ params }) {
  const { id } = use(params);
  const router = useRouter();
  const { data: session } = useSession();
  const [selectedChitId, setSelectedChitId] = useState('');
  const [chitOptions, setChitOptions] = useState([]);
   const [showExplosion, setShowExplosion] = useState(false);
  const lastTriggeredMonth = useRef('');

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  useEffect(() => {
    if (data && data.breakdown) {
      const monthKey = selectedMonth;
      if (lastTriggeredMonth.current === monthKey) return;

      const hasCompleted = data.breakdown.some((b) => {
        const target = b.target || 0;
        const collected = b.collected || 0;
        return target > 0 && collected >= target;
      });

      if (hasCompleted) {
        setShowExplosion(true);
        lastTriggeredMonth.current = monthKey;
        setTimeout(() => setShowExplosion(false), 3500);
      }
    }
  }, [data, selectedMonth]);

  useEffect(() => {
    if (data && data.breakdown) {
      const options = data.breakdown.map(b => ({ id: b.chitId, name: b.chitName }));
      setChitOptions(options);
      if (options.length > 0 && !selectedChitId) {
        setSelectedChitId(options[0].id);
      }
    }
  }, [data]);

  useEffect(() => {
    if (session && session.user.id !== parseInt(id)) {
      router.push('/signin');
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await fetch(`/api/agent/${id}/dashboard?month=${selectedMonth}`);
        const result = await res.json();
        if (result.success) {
          setData(result.data);
        } else {
          setError('Failed to load data');
        }
      } catch (err) {
        setError('Network error');
      }
      setLoading(false);
    };

    if (session) fetchData();
    else setLoading(false);
  }, [session, id, router, selectedMonth]);

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-2xl shadow-lg text-center">
          <p className="text-gray-700 text-sm">Please log in to continue.</p>
          <a href="/signin" className="mt-4 inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition text-sm">
            Sign In
          </a>
        </div>
      </div>
    );
  }

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center">
          <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-3 text-sm text-gray-600">Loading your dashboard…</p>
        </div>
      </div>
    );

  if (error)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-3 rounded-xl text-sm">
          {error}
        </div>
      </div>
    );

  if (!data)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-6 py-3 rounded-xl text-sm">
          No data available. Please contact admin.
        </div>
      </div>
    );

  const { 
    summary = { totalTarget: 0, totalCollected: 0, totalPending: 0 }, 
    breakdown = [], 
    monthlyTrend = [], 
    dailyTrend = [], 
    history = [] 
  } = data;
  const { totalTarget, totalCollected, totalPending } = summary;

  // Chart Data: Daily trend (bar chart)
  const dailyLabels = dailyTrend.map(d => {
    const parts = d.date.split('-');
    return `${parts[2]}/${parts[1]}`; // DD/MM
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

  // Chit-wise breakdown (aggregated per chit)
  const barLabels = breakdown.map((b) => b.chitName);
  const barCollected = breakdown.map((b) => b.collected);
  const barPending = breakdown.map((b) => b.pending);

  const barChartData = {
    labels: barLabels,
    datasets: [
      { label: 'Collected', data: barCollected, backgroundColor: '#2563EB' },
      { label: 'Pending', data: barPending, backgroundColor: '#DC2626' },
    ],
  };

  const doughnutData = {
    labels: ['Collected', 'Pending'],
    datasets: [{ data: [totalCollected, totalPending], backgroundColor: ['#2563EB', '#DC2626'] }],
  };

  // Monthly trend (previous months) – optional
  const trendLabels = monthlyTrend.map((t) => t.month_label);
  const trendCollected = monthlyTrend.map((t) => t.total_collected);
  const trendPending = monthlyTrend.map((t) => t.total_pending);

  const trendData = {
    labels: trendLabels,
    datasets: [
      { label: 'Collected', data: trendCollected, backgroundColor: '#2563EB' },
      { label: 'Pending', data: trendPending, backgroundColor: '#F59E0B' },
    ],
  };

  // Flatten breakdown for detailed table
  const ticketDetails = breakdown.flatMap((b) =>
    b.tickets.map((t) => ({
      chitName: b.chitName,
      ticketNumber: t.ticketNumber,
      auctionDate: b.auctionDate,
      target: t.target,
      collected: t.collected,
      pending: t.pending,
      progress: t.target > 0 ? Math.round((t.collected / t.target) * 100) : 0,
    }))
  );

  return (
    <>
      <FlowerExplosion active={showExplosion} />
    <div className="min-h-screen bg-gray-50 font-sans">
      {/* Top Navigation */}
      <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {/* ✅ Logo added here */}
            <Image 
              src="/fn_logo.png" 
              alt="Coinplus Logo" 
              width={32} 
              height={32} 
              className="rounded"
              priority
            />
            <span className="text-xl font-bold text-blue-700">Chit</span>
            <span className="text-xl font-light text-gray-600">Manager</span>
          </div>
          <div className="flex items-center space-x-3">
            <span className="text-xs text-gray-700 hidden sm:inline">
              Welcome, {session.user.name || 'Agent'}
            </span>
            <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-medium">
              {session.user.name ? session.user.name.charAt(0).toUpperCase() : 'A'}
            </div>
            <button
              onClick={() => signOut({ callbackUrl: '/signin' })}
              className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-lg transition"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Page Title & Month Picker */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Agent Dashboard</h1>
            <p className="text-xs text-gray-500">Overview of your collections and performance</p>
          </div>
          <div className="mt-2 sm:mt-0">
            <label htmlFor="monthPicker" className="sr-only">Select Month</label>
            <input
              type="month"
              id="monthPicker"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-100 hover:shadow-md transition">
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
          <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-100 hover:shadow-md transition">
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
          <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-100 hover:shadow-md transition">
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

        {/* Charts Row: Daily Trend + Doughnut */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-100">
            <h3 className="text-sm font-semibold text-gray-800 mb-3">Daily Collection Trend</h3>
            {dailyTrend.length === 0 ? (
              <div className="h-52 flex items-center justify-center text-xs text-gray-400">
                No updates for this month.
              </div>
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

        {/* Detailed Breakdown Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-800">Detailed Breakdown (by Ticket)</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-gray-50 text-gray-600 uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-2 text-left">Chit</th>
                  <th className="px-4 py-2 text-left">Ticket</th>
                  <th className="px-4 py-2 text-left">Auction Date</th>
                  <th className="px-4 py-2 text-right">Target (₹)</th>
                  <th className="px-4 py-2 text-right">Collected (₹)</th>
                  <th className="px-4 py-2 text-right">Pending (₹)</th>
                  <th className="px-4 py-2 text-right">Progress</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {ticketDetails.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-4 py-3 text-center text-gray-400 text-xs">
                      No tickets assigned yet.
                    </td>
                  </tr>
                ) : (
                  ticketDetails.map((t, idx) => (
                    <tr key={idx} className="hover:bg-gray-50 transition">
                      <td className="px-4 py-2.5 font-medium text-gray-800">{t.chitName}</td>
                      <td className="px-4 py-2.5 text-gray-600">Token {t.ticketNumber}</td>
                      <td className="px-4 py-2.5 text-gray-600">
                        {t.auctionDate ? new Date(t.auctionDate).toLocaleString('en-GB', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        }) : '-'}
                      </td>
                      <td className="px-4 py-2.5 text-right text-gray-600">₹{t.target.toLocaleString()}</td>
                      <td className="px-4 py-2.5 text-right text-green-600 font-medium">₹{t.collected.toLocaleString()}</td>
                      <td className="px-4 py-2.5 text-right text-red-600 font-medium">₹{t.pending.toLocaleString()}</td>
                      <td className="px-4 py-2.5">
                        <div className="flex items-center justify-end gap-2">
                          <div className="w-20 bg-gray-200 rounded-full h-1.5">
                            <div
                              className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                              style={{ width: `${t.progress}%` }}
                            ></div>
                          </div>
                          <span className="text-xs font-medium text-gray-600 w-8 text-right">{t.progress}%</span>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Monthly Statement */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden mt-6">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-gray-800">Monthly Statement</h3>
              <p className="text-xs text-gray-500">Transaction history for the selected month</p>
            </div>
            <span className="text-xs text-gray-500">{history.length} transactions</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-gray-50 text-gray-600 uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-2 text-left">Date</th>
                  <th className="px-4 py-2 text-left">Chit</th>
                  <th className="px-4 py-2 text-left">Ticket</th>
                  <th className="px-4 py-2 text-right">Collected (₹)</th>
                  <th className="px-4 py-2 text-right">Balance (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {history.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-4 py-3 text-center text-gray-400 text-xs">
                      No transactions for this month.
                    </td>
                  </tr>
                ) : (
                  history.map((h, idx) => (
                    <tr key={idx} className="hover:bg-gray-50 transition">
                      <td className="px-4 py-2.5 text-gray-700">
                        {new Date(h.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                      </td>
                      <td className="px-4 py-2.5 text-gray-700">{h.chit_name}</td>
                      <td className="px-4 py-2.5 text-gray-700">Token {h.ticket_number}</td>
                      <td className="px-4 py-2.5 text-right text-green-600 font-medium">
                        ₹{parseFloat(h.daily_collected).toLocaleString()}
                      </td>
                      <td className="px-4 py-2.5 text-right text-red-600 font-medium">
                        ₹{parseFloat(h.balance).toLocaleString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-10 border-t border-gray-200 pt-4 text-center text-xs text-gray-400">
          &copy; {new Date().getFullYear()} ChitManager. All rights reserved.
        </footer>
      </main>
    </div>
    </>
  );
}