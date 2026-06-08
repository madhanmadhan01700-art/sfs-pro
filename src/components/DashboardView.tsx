import React, { useState, useEffect } from "react";
import { Shield, ShieldAlert, Activity, CheckCircle, Ban, RefreshCw, Layers, Plus } from "lucide-react";
import { DashboardSummary, TrafficLog } from "../types";
import { getDashboardSummary, toggleFirewallStatus, generateTraffic } from "../services/api";

interface DashboardViewProps {
  onNavigate: (page: string) => void;
}

export default function DashboardView({ onNavigate }: DashboardViewProps) {
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSummary = async () => {
    try {
      setLoading(true);
      const summary = await getDashboardSummary();
      setData(summary);
      setError(null);
    } catch (err: any) {
      setError(err.message || "Something went wrong connection...");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, []);

  const handleToggleFirewall = async () => {
    try {
      const active = await toggleFirewallStatus();
      if (data) {
        setData({ ...data, status: active });
      }
    } catch (err: any) {
      alert("Error toggling firewall: " + err.message);
    }
  };

  const handleGenerateTraffic = async (count: number) => {
    try {
      setGenerating(true);
      await generateTraffic(count);
      await fetchSummary();
    } catch (err: any) {
      alert("Error generating traffic: " + err.message);
    } finally {
      setGenerating(false);
    }
  };

  if (loading && !data) {
    return (
      <div className="flex flex-col items-center justify-center p-20 text-blue-400 space-y-4">
        <RefreshCw className="w-12 h-12 animate-spin text-cyan-400" />
        <p className="font-mono text-sm tracking-widest text-slate-300">INTERCEPTING PORT LOGS...</p>
      </div>
    );
  }

  const status = data?.status ?? true;

  return (
    <div className="space-y-8 animate-fade-in" id="dashboard-container">
      {/* Top Banner / Firewall Status */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 sleek-card shadow-xl">
        <div>
          <h1 className="text-2xl font-bold font-sans tracking-tight text-white flex items-center gap-2">
            <Activity className="text-[#38bdf8] w-6 h-6 animate-pulse" />
            Security Dashboard
          </h1>
          <p className="text-[#94a3b8] text-sm mt-1">
            Network surveillance and packet filtering active.
          </p>
        </div>

        <div className="flex items-center gap-4">
          {/* Quick Generator dropdown */}
          <div className="relative inline-block text-left">
            <button
              onClick={() => handleGenerateTraffic(15)}
              disabled={generating}
              className="px-4 py-2 text-xs font-sans font-medium rounded-lg text-[#f1f5f9] bg-slate-800/80 hover:bg-slate-700/80 border border-white/10 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${generating ? 'animate-spin' : ''}`} />
              {generating ? "Injecting Logs..." : "Inject 15 Test Packets"}
            </button>
          </div>

          <div
            onClick={handleToggleFirewall}
            className="bg-slate-800/80 border border-white/10 rounded-full py-1.5 px-4 flex items-center gap-2 text-xs font-semibold cursor-pointer hover:bg-slate-700/80 transition-all text-[#f1f5f9]"
          >
            <div className={`w-2 h-2 rounded-full ${status ? 'bg-[#22c55e] shadow-[0_0_8px_#22c55e]' : 'bg-[#ef4444] shadow-[0_0_8px_#ef4444]'}`} />
            {status ? "FIREWALL ACTIVE" : "FIREWALL INACTIVE"}
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-[#ef4444]/10 border border-[#ef4444]/30 rounded-xl text-rose-350 font-mono text-xs">
          [SYSTEM CRITICAL ERROR]: {error}
        </div>
      )}

      {/* Grid Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Card Status */}
        <div className="p-5 sleek-card shadow-lg relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-3 text-slate-850 group-hover:text-cyan-950/20 transition-colors">
            {status ? <Shield className="w-16 h-16 opacity-5" /> : <ShieldAlert className="w-16 h-16 opacity-5" />}
          </div>
          <p className="text-[#94a3b8] text-xs font-sans tracking-wide uppercase">FIREWALL STATE</p>
          <div className="flex items-center gap-1.5 mt-3">
            <div className={`w-3 h-3 rounded-full ${status ? 'bg-[#22c55e] shadow-[0_0_8px_#22c55e]' : 'bg-[#ef4444] shadow-[0_0_8px_#ef4444]'}`} />
            <h3 className="text-lg font-bold font-mono tracking-tight text-white leading-none">
              {status ? "ACTIVE" : "BYPASSED"}
            </h3>
          </div>
          <p className="text-[10px] text-[#94a3b8] mt-3">Priority: BLOCK &gt; ALLOW</p>
        </div>

        {/* Card total requests */}
        <div className="p-5 sleek-card shadow-lg relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-3 text-cyan-950/20">
            <Activity className="w-16 h-16 opacity-5" />
          </div>
          <p className="text-[#94a3b8] text-xs font-sans tracking-wide uppercase">TOTAL TRAFFIC</p>
          <h3 className="text-2xl font-bold font-sans text-white mt-1">
            {(data?.total ?? 0).toLocaleString()}
          </h3>
          <p className="text-[10px] text-[#22c55e] mt-3">↑ 12% vs last hour</p>
        </div>

        {/* Card Allowed requests */}
        <div className="p-5 sleek-card shadow-lg relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-3 text-emerald-950/20">
            <CheckCircle className="w-16 h-16 opacity-5" />
          </div>
          <p className="text-[#94a3b8] text-xs font-sans tracking-wide uppercase">ALLOWED</p>
          <h3 className="text-2xl font-bold font-sans text-white mt-1">
            {(data?.allowed ?? 0).toLocaleString()}
          </h3>
          {/* Spark Bar mockup chart */}
          <div className="display flex items-end gap-1 mt-3 h-[18px]">
            <div className="flex-1 bg-[#38bdf8] opacity-30 rounded-t-[2px] h-[30%]"></div>
            <div className="flex-1 bg-[#38bdf8] opacity-30 rounded-t-[2px] h-[50%]"></div>
            <div className="flex-1 bg-[#38bdf8] opacity-30 rounded-t-[2px] h-[40%]"></div>
            <div className="flex-1 bg-[#38bdf8] opacity-80 rounded-t-[2px] h-[80%]"></div>
            <div className="flex-1 bg-[#38bdf8] opacity-30 rounded-t-[2px] h-[60%]"></div>
          </div>
        </div>

        {/* Card Blocked requests */}
        <div className="p-5 sleek-card shadow-lg relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-3 text-rose-950/20">
            <Ban className="w-16 h-16 opacity-5" />
          </div>
          <p className="text-[#94a3b8] text-xs font-sans tracking-wide uppercase">BLOCKED</p>
          <h3 className="text-2xl font-bold font-sans text-[#ef4444] mt-1">
            {(data?.blocked ?? 0).toLocaleString()}
          </h3>
          {/* Blocked spark column chart */}
          <div className="display flex items-end gap-1 mt-3 h-[18px]">
            <div className="flex-1 bg-[#ef4444] opacity-40 rounded-t-[2px] h-[70%]"></div>
            <div className="flex-1 bg-[#ef4444] opacity-80 rounded-t-[2px] h-[90%]"></div>
            <div className="flex-1 bg-[#ef4444] opacity-40 rounded-t-[2px] h-[60%]"></div>
            <div className="flex-1 bg-[#ef4444] opacity-40 rounded-t-[2px] h-[40%]"></div>
            <div className="flex-1 bg-[#ef4444] opacity-30 rounded-t-[2px] h-[30%]"></div>
          </div>
        </div>

        {/* Card Active rules */}
        <div className="p-5 sleek-card shadow-lg relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-3 text-blue-950/20">
            <Layers className="w-16 h-16 opacity-5" />
          </div>
          <p className="text-[#94a3b8] text-xs font-sans tracking-wide uppercase">ACTIVE RULES</p>
          <h3 className="text-2xl font-bold font-sans text-white mt-1">
            {data?.rulesCount ?? 0}
          </h3>
          <p className="text-[10px] text-[#94a3b8] mt-3">{data?.rulesCount ? "4 critical blocks" : "0 active blocks"}</p>
        </div>
      </div>

      {/* Main split sections of dashboard */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Recent logs - columns 7/12 */}
        <div className="lg:col-span-8 p-6 sleek-card shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
              <div>
                <h2 className="text-base font-semibold tracking-tight text-white flex items-center gap-2">
                  <span>Real-time Traffic Logs</span>
                </h2>
              </div>
              <button
                onClick={() => onNavigate("Logs")}
                className="text-xs font-semibold text-[#38bdf8] hover:text-[#0ea5e9] transition-colors cursor-pointer"
              >
                View All
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left font-sans text-xs">
                <thead>
                  <tr className="text-[#94a3b8] border-b border-white/10 pb-3 text-[11px] uppercase tracking-wider">
                    <th className="font-semibold py-3 px-2">Timestamp</th>
                    <th className="font-semibold py-3 px-2">Source IP</th>
                    <th className="font-semibold py-3 px-2">Port</th>
                    <th className="font-semibold py-3 px-2">Protocol</th>
                    <th className="font-semibold py-3 px-2">Decision</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-slate-300">
                  {data?.recentLogs && data.recentLogs.length > 0 ? (
                    data.recentLogs.slice(0, 7).map((log) => (
                      <tr key={log.id} className="hover:bg-white/5 transition-colors">
                        <td className="py-3 px-2 text-[#94a3b8]">
                          {new Date(log.timestamp).toLocaleTimeString("en-US", { hour12: false })}
                        </td>
                        <td className="py-3 px-2 font-mono text-[#f1f5f9]">{log.source_ip}</td>
                        <td className="py-3 px-2">
                          <span className="px-1.5 py-0.5 rounded bg-slate-900/60 text-[#38bdf8] border border-white/5 font-mono text-[11px]">
                            {log.destination_port === "Any" || log.destination_port === "0" ? "*" : log.destination_port}
                          </span>
                        </td>
                        <td className="py-3 px-2 text-[#94a3b8] uppercase font-mono">{log.protocol}</td>
                        <td className="py-3 px-2">
                          <span
                            className={`badge px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              log.decision === "Allowed"
                                ? "badge-allow sleek-badge-allow"
                                : "badge-block sleek-badge-block"
                            }`}
                          >
                            {log.decision === "Allowed" ? "Allow" : "Block"}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="py-12 px-2 text-center text-[#94a3b8]">
                        No packet inspection entries recorded yet. Send test packets in the Simulator tab!
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-white/10 flex justify-between items-center text-[10px] text-[#94a3b8] font-mono">
            <span>SOCKET DECODER STATUS: NORMAL</span>
            <span>AUTOMATIC LOG ROTATION ACTIVE (MAX 1000)</span>
          </div>
        </div>

        {/* Quick action / Tips section - columns 4/12 */}
        <div className="lg:col-span-4 space-y-6">
          {/* Quick interactive sandbox card */}
          <div className="p-6 sleek-card shadow-xl space-y-4">
            <h3 className="text-sm font-semibold tracking-wide text-white uppercase border-b border-white/10 pb-3">Packet Simulator</h3>
            <p className="text-xs text-[#94a3b8] leading-relaxed">
              Our firewall system parses incoming TCP & UDP frames. Try adding customized block rules (e.g., blocking port 8080) in the Rules view, and test them live.
            </p>
            <div className="p-4 rounded-lg bg-black/20 border border-white/10 font-mono text-[11px] text-[#94a3b8] space-y-2">
              <div className="flex justify-between">
                <span>Default Inbound Action:</span>
                <span className="text-[#22c55e]">ALLOW</span>
              </div>
              <div className="flex justify-between">
                <span>Rule Precedence:</span>
                <span className="text-[#38bdf8]">BLOCK PRIORITY</span>
              </div>
              <div className="flex justify-between">
                <span>DPI Parsing Depth:</span>
                <span className="text-slate-400">L4 Stack Header</span>
              </div>
            </div>
            <button
              onClick={() => onNavigate("Traffic Simulator")}
              className="w-full py-2.5 rounded-lg text-xs font-semibold text-[#0f172a] sleek-button-primary transition-colors font-bold flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Launch Packet Generator
            </button>
          </div>

          {/* Quick System Telemetry info block */}
          <div className="p-6 sleek-card shadow-xl">
            <h3 className="text-[#94a3b8] text-xs font-semibold tracking-widest uppercase mb-4 border-b border-white/10 pb-3">SYSTEM TELEMETRY</h3>
            <ul className="space-y-3.5 text-xs font-mono">
              <li className="flex justify-between text-[#f1f5f9]">
                <span className="text-[#94a3b8]">Node JS Port:</span>
                <span>3000 (Forward to Proxy)</span>
              </li>
              <li className="flex justify-between text-[#f1f5f9]">
                <span className="text-[#94a3b8]">Database Engine:</span>
                <span>In-Memory JSON Server</span>
              </li>
              <li className="flex justify-between text-[#f1f5f9]">
                <span className="text-[#94a3b8]">Engine Language:</span>
                <span>TypeScript 5.8 (Strict Node)</span>
              </li>
              <li className="flex justify-between text-[#f1f5f9]">
                <span className="text-[#94a3b8]">Inspected Frames:</span>
                <span className="text-[#38bdf8] animate-pulse">Running</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
