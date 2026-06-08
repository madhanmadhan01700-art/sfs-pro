import React, { useState, useEffect } from "react";
import { Download, Search, Table, RefreshCw, Calendar, Trash2, Filter } from "lucide-react";
import { TrafficLog } from "../types";
import { getLogs } from "../services/api";

export default function LogsView() {
  const [logs, setLogs] = useState<TrafficLog[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filtering States
  const [search, setSearch] = useState("");
  const [decisionFilter, setDecisionFilter] = useState("All");
  const [protocolFilter, setProtocolFilter] = useState("All");
  const [dateFilter, setDateFilter] = useState("");

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const data = await getLogs({
        search: search.trim(),
        decision: decisionFilter,
        protocol: protocolFilter,
        date: dateFilter
      });
      setLogs(data);
    } catch (err: any) {
      alert("Error loading logs: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [search, decisionFilter, protocolFilter, dateFilter]);

  const handleClearFilters = () => {
    setSearch("");
    setDecisionFilter("All");
    setProtocolFilter("All");
    setDateFilter("");
  };

  return (
    <div className="space-y-6 animate-fade-in" id="logs-view-container">
      {/* Logs View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 sleek-card shadow-xl">
        <div>
          <h1 className="text-xl font-bold font-sans text-white flex items-center gap-2">
            <Table className="text-[#38bdf8] w-5 h-5" />
            Audit Logs
          </h1>
          <p className="text-[#94a3b8] text-xs mt-1">
            Historical records containing packet decisions parsed by the Security Operations Center (SOC).
          </p>
        </div>

        {/* CSV export button */}
        <button
          onClick={() => {
            const headers = ["Timestamp", "Source IP", "Destination Port", "Protocol", "Decision", "Matched Rule"];
            const rows = logs.map(l => [
              l.timestamp,
              l.source_ip,
              l.destination_port,
              l.protocol,
              l.decision,
              l.matched_rule
            ]);
            
            // Build CSV content in proper encoding
            const csvContent = "data:text/csv;charset=utf-8," 
              + [headers.join(","), ...rows.map(e => e.map(val => `"${val.replace(/"/g, '""')}"`).join(","))].join("\n");
            
            const encodedUri = encodeURI(csvContent);
            const link = document.createElement("a");
            link.setAttribute("href", encodedUri);
            link.setAttribute("download", `sfs_firewall_audit_logs_${Date.now()}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
          }}
          className="px-4 py-2 text-xs font-sans font-bold rounded-lg text-[#0f172a] sleek-button-primary shadow-lg flex items-center justify-center gap-1.5 cursor-pointer self-start sm:self-auto"
        >
          <Download className="w-3.5 h-3.5" />
          Export to CSV
        </button>
      </div>

      {/* Advanced Filter Panel */}
      <div className="p-6 sleek-card shadow-xl space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Search text input */}
          <div className="space-y-1 font-sans text-xs">
            <label className="block text-[#94a3b8] font-semibold uppercase tracking-wider text-[10px]">Text Lookup</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-3 flex items-center text-slate-500">
                <Search className="w-3.5 h-3.5" />
              </span>
              <input
                type="text"
                placeholder="IP address, rule name, port..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-950 text-white rounded-md sleek-input font-sans text-xs"
              />
            </div>
          </div>

          {/* Action Decision filter */}
          <div className="space-y-1 font-sans text-xs">
            <label className="block text-[#94a3b8] font-semibold uppercase tracking-wider text-[10px]">Filter Result</label>
            <select
              value={decisionFilter}
              onChange={(e) => setDecisionFilter(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 text-white rounded-md sleek-input font-sans text-xs"
            >
              <option value="All">All Actions (Allowed & Blocked)</option>
              <option value="Allowed">Allowed Logs only</option>
              <option value="Blocked">Blocked Attack Logs only</option>
            </select>
          </div>

          {/* Protocol filter */}
          <div className="space-y-1 font-sans text-xs">
            <label className="block text-[#94a3b8] font-semibold uppercase tracking-wider text-[10px]">Filter Protocol</label>
            <select
              value={protocolFilter}
              onChange={(e) => setProtocolFilter(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 text-white rounded-md sleek-input font-sans text-xs"
            >
              <option value="All">All Protocols (TCP & UDP)</option>
              <option value="TCP">TCP</option>
              <option value="UDP">UDP</option>
            </select>
          </div>

          {/* Calendar Day picker */}
          <div className="space-y-1 font-sans text-xs">
            <label className="block text-[#94a3b8] font-semibold uppercase tracking-wider text-[10px]">Filter Date</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-3 flex items-center text-slate-500">
                <Calendar className="w-3.5 h-3.5" />
              </span>
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-950 text-white rounded-md sleek-input font-sans text-xs"
              />
            </div>
          </div>
        </div>

        {/* Action button bar */}
        <div className="flex gap-4 justify-end items-center border-t border-white/15 pt-4 text-xs font-sans">
          {(search || decisionFilter !== "All" || protocolFilter !== "All" || dateFilter) && (
            <button
              onClick={handleClearFilters}
              className="text-slate-400 hover:text-slate-250 transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5 text-[#ef4444]" /> Clear active filters
            </button>
          )}

          <button
            onClick={fetchLogs}
            className="px-4 py-2 rounded bg-slate-800 hover:bg-slate-700/80 border border-white/10 text-[#f1f5f9] transition-all cursor-pointer flex items-center gap-1.5 text-[11px] font-semibold"
          >
            <RefreshCw className="w-3 h-3 text-[#38bdf8]" />
            Reload Registry
          </button>
        </div>

        {/* Data Table rendering */}
        {loading ? (
          <div className="flex items-center justify-center py-20 text-[#38bdf8] font-sans text-xs">
            <RefreshCw className="w-6 h-6 animate-spin text-[#38bdf8] mr-2" />
            FILTERING AUDITING SYSTEM LOGS...
          </div>
        ) : logs.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left font-sans text-xs">
              <thead className="bg-[#0f172a]/40 border-b border-white/15 text-[#94a3b8] text-[11px] uppercase tracking-wider select-none">
                <tr>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Source IP</th>
                  <th className="py-3 px-4">Dest Port</th>
                  <th className="py-3 px-4">Protocol</th>
                  <th className="py-3 px-4">Decision</th>
                  <th className="py-3 px-4">Matched Rule</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-slate-300">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-white/5 transition-colors">
                    <td className="py-3 px-4 text-[#94a3b8] whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleDateString()} {new Date(log.timestamp).toLocaleTimeString("en-US", { hour12: false })}
                    </td>
                    <td className="py-3 px-4 font-bold font-mono text-[#f1f5f9]">{log.source_ip}</td>
                    <td className="py-3 px-4 font-mono">
                      <span className="px-1.5 py-0.5 rounded bg-slate-900 border border-white/5 text-[#38bdf8] uppercase text-[10px]">
                        {log.destination_port === "Any" || log.destination_port === "0" ? "ANY" : log.destination_port}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-[#94a3b8] uppercase font-mono">{log.protocol}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`badge px-2.5 py-0.5 rounded text-[10px] font-bold uppercase inline-block ${
                          log.decision === "Allowed"
                            ? "badge-allow sleek-badge-allow"
                            : "badge-block sleek-badge-block"
                        }`}
                      >
                        {log.decision}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-200 font-semibold">{log.matched_rule}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-20 text-center text-[#94a3b8] font-sans text-xs border border-dashed border-white/15 rounded-xl">
            No connection packets match that specified search query. Keep modeling packets under the generator tab!
          </div>
        )}
      </div>
    </div>
  );
}
