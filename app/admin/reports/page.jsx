'use client';
import { useState, useEffect } from 'react';
import {
  FaFileExcel,
  FaFilePdf,
  FaFilter,
  FaDownload,
  FaUser,
  FaList,
  FaCalendarAlt,
  FaSync,
} from 'react-icons/fa';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function ReportsPage() {
  const [agents, setAgents] = useState([]);
  const [chits, setChits] = useState([]);
  const [selectedAgentId, setSelectedAgentId] = useState('');
  const [selectedChitId, setSelectedChitId] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [reportData, setReportData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Fetch dropdown options
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

  // Fetch report data
  const fetchReport = async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (selectedAgentId) params.append('agentId', selectedAgentId);
      if (selectedChitId) params.append('chitId', selectedChitId);
      if (selectedMonth) params.append('month', selectedMonth);

      const res = await fetch(`/api/admin/reports?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setReportData(data.data);
      } else {
        setError('Failed to load report');
      }
    } catch (err) {
      setError('Network error');
    }
    setLoading(false);
  };

  // Auto-fetch on filter change
  useEffect(() => {
    fetchReport();
  }, [selectedAgentId, selectedChitId, selectedMonth]);

  // Helper to format date (handles null)
  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    try {
      return new Date(dateStr).toLocaleDateString('en-GB');
    } catch {
      return '—';
    }
  };

  // Export to Excel
  const exportExcel = () => {
    if (reportData.length === 0) {
      alert('No data to export');
      return;
    }
    const wsData = reportData.map((row) => ({
      Date: row.date ? new Date(row.date).toLocaleDateString('en-GB') : '—',
      Agent: row.agent_name,
      'Agent Code': row.agent_code,
      Chit: row.chit_name,
      Ticket: `Token ${row.ticket_number}`,
      Target: row.target || 0,
      Collected: row.collected || 0,
      Balance: row.balance || 0,
    }));
    const ws = XLSX.utils.json_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Report');
    XLSX.writeFile(wb, `report_${selectedMonth || 'all'}.xlsx`);
  };

  // Export to PDF
  const exportPDF = () => {
    if (reportData.length === 0) {
      alert('No data to export');
      return;
    }

    const doc = new jsPDF('landscape', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();

    doc.setFontSize(18);
    doc.text('Coinplus – Agent Performance Report', pageWidth / 2, 15, { align: 'center' });

    doc.setFontSize(10);
    let filterText = `Month: ${selectedMonth || 'All'}`;
    if (selectedAgentId) {
      const agent = agents.find((a) => a.id === parseInt(selectedAgentId));
      filterText += ` | Agent: ${agent?.name || ''}`;
    }
    if (selectedChitId) {
      const chit = chits.find((c) => c.id === parseInt(selectedChitId));
      filterText += ` | Chit: ${chit?.name || ''}`;
    }
    doc.text(filterText, pageWidth / 2, 22, { align: 'center' });

    const tableData = reportData.map((row) => [
      row.date ? new Date(row.date).toLocaleDateString('en-GB') : '—',
      row.agent_name,
      row.agent_code,
      row.chit_name,
      `Token ${row.ticket_number}`,
      row.target || 0,
      row.collected || 0,
      row.balance || 0,
    ]);

    autoTable(doc, {
      head: [['Date', 'Agent', 'Code', 'Chit', 'Ticket', 'Target', 'Collected', 'Balance']],
      body: tableData,
      startY: 28,
      styles: { fontSize: 8, cellPadding: 1.5 },
      headStyles: { fillColor: [37, 99, 235], textColor: 255, fontSize: 9, fontStyle: 'bold' },
      columnStyles: {
        0: { cellWidth: 20 },
        1: { cellWidth: 30 },
        2: { cellWidth: 20 },
        3: { cellWidth: 25 },
        4: { cellWidth: 20 },
        5: { cellWidth: 20, halign: 'right' },
        6: { cellWidth: 20, halign: 'right' },
        7: { cellWidth: 20, halign: 'right' },
      },
      foot: [
        [
          '',
          '',
          '',
          '',
          'Total',
          reportData.reduce((s, r) => s + (r.target || 0), 0),
          reportData.reduce((s, r) => s + (r.collected || 0), 0),
          reportData.reduce((s, r) => s + (r.balance || 0), 0),
        ],
      ],
      footStyles: { fillColor: [240, 240, 240], fontStyle: 'bold' },
    });

    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.text(
        `Generated on ${new Date().toLocaleString()} | Page ${i} of ${pageCount}`,
        pageWidth / 2,
        doc.internal.pageSize.getHeight() - 5,
        { align: 'center' }
      );
    }

    doc.save(`report_${selectedMonth || 'all'}.pdf`);
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Page Header */}
        <div className="flex items-center space-x-3 mb-6">
          <FaDownload className="w-5 h-5 text-blue-600" />
          <h1 className="text-xl font-semibold text-gray-900">Detailed Report</h1>
        </div>

        {/* Filters Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-end">
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
                  className="w-full border border-gray-200 rounded-lg pl-9 pr-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
                  value={selectedAgentId}
                  onChange={(e) => setSelectedAgentId(e.target.value)}
                >
                  <option value="">All Agents</option>
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
                  className="w-full border border-gray-200 rounded-lg pl-9 pr-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
                  value={selectedChitId}
                  onChange={(e) => setSelectedChitId(e.target.value)}
                >
                  <option value="">All Chits</option>
                  {chits.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
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
                  className="w-full border border-gray-200 rounded-lg pl-9 pr-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                />
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={fetchReport}
                className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-1.5 rounded-lg transition flex items-center space-x-2 h-9"
              >
                <FaSync className="w-3.5 h-3.5" />
                <span>Refresh</span>
              </button>
              <button
                onClick={exportExcel}
                className="bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-3 py-1.5 rounded-lg transition flex items-center space-x-2 h-9"
              >
                <FaFileExcel className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Excel</span>
              </button>
              <button
                onClick={exportPDF}
                className="bg-red-600 hover:bg-red-700 text-white text-sm font-medium px-3 py-1.5 rounded-lg transition flex items-center space-x-2 h-9"
              >
                <FaFilePdf className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">PDF</span>
              </button>
            </div>
          </div>
          {error && <p className="text-red-600 text-xs mt-2">{error}</p>}
        </div>

        {/* Table Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-sm font-semibold text-gray-800">
              Report Results
              <span className="ml-2 text-xs font-normal text-gray-500">
                ({reportData.length} records)
              </span>
            </h2>
            <div className="flex items-center gap-3">
              {loading && (
                <span className="text-xs text-gray-400">Loading...</span>
              )}
              <span className="text-xs text-gray-400">
                {!loading && `${reportData.length} rows`}
              </span>
            </div>
          </div>
          <div className="overflow-x-auto overflow-y-auto max-h-80">
            <table className="w-full text-xs">
              <thead className="bg-gray-50 text-gray-600 uppercase tracking-wider sticky top-0 z-10 shadow-sm">
                <tr>
                  <th className="px-4 py-2 text-left">Date</th>
                  <th className="px-4 py-2 text-left">Agent</th>
                  <th className="px-4 py-2 text-left">Code</th>
                  <th className="px-4 py-2 text-left">Chit</th>
                  <th className="px-4 py-2 text-left">Ticket</th>
                  <th className="px-4 py-2 text-right">Target (₹)</th>
                  <th className="px-4 py-2 text-right">Collected (₹)</th>
                  <th className="px-4 py-2 text-right">Balance (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td colSpan="8" className="px-4 py-4 text-center text-gray-400 text-xs">
                      Loading...
                    </td>
                  </tr>
                ) : reportData.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="px-4 py-4 text-center text-gray-400 text-xs">
                      No records found.
                    </td>
                  </tr>
                ) : (
                  reportData.map((row, idx) => (
                    <tr key={idx} className="hover:bg-gray-50 transition">
                      <td className="px-4 py-2.5 text-gray-700">
                        {formatDate(row.date)}
                      </td>
                      <td className="px-4 py-2.5 font-medium text-gray-800">{row.agent_name}</td>
                      <td className="px-4 py-2.5 text-gray-600">{row.agent_code}</td>
                      <td className="px-4 py-2.5 text-gray-700">{row.chit_name}</td>
                      <td className="px-4 py-2.5 text-gray-700">Token {row.ticket_number}</td>
                      <td className="px-4 py-2.5 text-right text-gray-700">
                        ₹{(row.target || 0).toLocaleString()}
                      </td>
                      <td className="px-4 py-2.5 text-right text-green-600 font-medium">
                        ₹{(row.collected || 0).toLocaleString()}
                      </td>
                      <td className="px-4 py-2.5 text-right text-red-600 font-medium">
                        ₹{(row.balance || 0).toLocaleString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              {!loading && reportData.length > 0 && (
                <tfoot className="bg-gray-50 font-semibold border-t border-gray-200">
                  <tr>
                    <td colSpan="5" className="px-4 py-2.5 text-right text-gray-700 text-xs">
                      Totals:
                    </td>
                    <td className="px-4 py-2.5 text-right text-gray-800 text-xs">
                      ₹{reportData.reduce((s, r) => s + (r.target || 0), 0).toLocaleString()}
                    </td>
                    <td className="px-4 py-2.5 text-right text-green-700 text-xs">
                      ₹{reportData.reduce((s, r) => s + (r.collected || 0), 0).toLocaleString()}
                    </td>
                    <td className="px-4 py-2.5 text-right text-red-700 text-xs">
                      ₹{reportData.reduce((s, r) => s + (r.balance || 0), 0).toLocaleString()}
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}