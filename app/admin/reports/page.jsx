'use client';
import { useState, useEffect } from 'react';
import { FaFileExcel, FaFilePdf, FaFilter, FaDownload } from 'react-icons/fa';
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

  useEffect(() => {
    fetchReport();
  }, [selectedAgentId, selectedChitId, selectedMonth]);

  // Export to Excel
  const exportExcel = () => {
    if (reportData.length === 0) {
      alert('No data to export');
      return;
    }
    const wsData = reportData.map((row) => ({
      Date: new Date(row.date).toLocaleDateString('en-GB'),
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

    // Title
    doc.setFontSize(18);
    doc.text('Coinplus – Agent Performance Report', pageWidth / 2, 15, { align: 'center' });

    // Subtitle with filters
    doc.setFontSize(10);
    let filterText = `Month: ${selectedMonth || 'All'}`;
    if (selectedAgentId) {
      const agent = agents.find(a => a.id === parseInt(selectedAgentId));
      filterText += ` | Agent: ${agent?.name || ''}`;
    }
    if (selectedChitId) {
      const chit = chits.find(c => c.id === parseInt(selectedChitId));
      filterText += ` | Chit: ${chit?.name || ''}`;
    }
    doc.text(filterText, pageWidth / 2, 22, { align: 'center' });

    // Table
    const tableData = reportData.map((row) => [
      new Date(row.date).toLocaleDateString('en-GB'),
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
      foot: [['', '', '', '', 'Total', 
        reportData.reduce((s, r) => s + (r.target || 0), 0),
        reportData.reduce((s, r) => s + (r.collected || 0), 0),
        reportData.reduce((s, r) => s + (r.balance || 0), 0)
      ]],
      footStyles: { fillColor: [240, 240, 240], fontStyle: 'bold' },
    });

    // Footer
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
    <div>
      <h1 className="text-3xl font-bold mb-6">Detailed Report</h1>

      {/* Filters */}
      <div className="bg-white p-4 rounded shadow mb-6">
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
              Agent
            </label>
            <select
              className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-48"
              value={selectedAgentId}
              onChange={(e) => setSelectedAgentId(e.target.value)}
            >
              <option value="">All Agents</option>
              {agents.map((a) => (
                <option key={a.id} value={a.id}>{a.name} ({a.agent_code})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
              Chit
            </label>
            <select
              className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-48"
              value={selectedChitId}
              onChange={(e) => setSelectedChitId(e.target.value)}
            >
              <option value="">All Chits</option>
              {chits.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
              Month
            </label>
            <input
              type="month"
              className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
            />
          </div>
          <button
            onClick={fetchReport}
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-1.5 rounded-lg transition flex items-center space-x-2 h-9"
          >
            <FaFilter className="w-3.5 h-3.5" />
            <span>Apply Filters</span>
          </button>
          <div className="flex space-x-2 ml-auto">
            <button
              onClick={exportExcel}
              className="bg-green-600 hover:bg-green-700 text-white text-sm px-4 py-1.5 rounded-lg transition flex items-center space-x-2 h-9"
            >
              <FaFileExcel className="w-3.5 h-3.5" />
              <span>Excel</span>
            </button>
            <button
              onClick={exportPDF}
              className="bg-red-600 hover:bg-red-700 text-white text-sm px-4 py-1.5 rounded-lg transition flex items-center space-x-2 h-9"
            >
              <FaFilePdf className="w-3.5 h-3.5" />
              <span>PDF</span>
            </button>
          </div>
        </div>
        {error && <p className="text-red-600 text-xs mt-2">{error}</p>}
      </div>

      {/* Table */}
      <div className="bg-white rounded shadow border border-gray-100 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-800">
            Report Results
            <span className="ml-2 text-xs font-normal text-gray-500">
              ({reportData.length} records)
            </span>
          </h2>
          <span className="text-xs text-gray-400">
            {loading ? 'Loading...' : `${reportData.length} rows`}
          </span>
        </div>
        <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
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
                  <td colSpan="8" className="px-4 py-4 text-center text-gray-400">
                    Loading...
                  </td>
                </tr>
              ) : reportData.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-4 py-4 text-center text-gray-400">
                    No records found.
                  </td>
                </tr>
              ) : (
                reportData.map((row, idx) => (
                  <tr key={idx} className="hover:bg-gray-50 transition">
                    <td className="px-4 py-2.5 text-gray-700">
                      {new Date(row.date).toLocaleDateString('en-GB')}
                    </td>
                    <td className="px-4 py-2.5 text-gray-800 font-medium">{row.agent_name}</td>
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
              <tfoot className="bg-gray-50 font-semibold">
                <tr>
                  <td colSpan="5" className="px-4 py-3 text-right text-gray-700">
                    Totals:
                  </td>
                  <td className="px-4 py-3 text-right text-gray-800">
                    ₹{reportData.reduce((s, r) => s + (r.target || 0), 0).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right text-green-700">
                    ₹{reportData.reduce((s, r) => s + (r.collected || 0), 0).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right text-red-700">
                    ₹{reportData.reduce((s, r) => s + (r.balance || 0), 0).toLocaleString()}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
}