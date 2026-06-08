import React, { useState, useEffect } from "react";
import { Settings, Shield, ShieldAlert, ShieldCheck, Database, RefreshCw, Trash2, Power } from "lucide-react";

export default function SettingsView() {
  const [active, setActive] = useState(true);
  const [totalRules, setTotalRules] = useState(0);
  const [totalLogs, setTotalLogs] = useState(0);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  const fetchStatus = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/dashboard-summary");
      if (!res.ok) throw new Error("Could not fetch server setting summaries");
      const data = await res.json();
      setActive(data.status);
      setTotalRules(data.rulesCount);
      setTotalLogs(data.total);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleToggleState = async () => {
    try {
      setSyncing(true);
      const res = await fetch("/api/status/toggle", { method: "POST" });
      if (!res.ok) throw new Error("Server toggle request rejected");
      const data = await res.json();
      setActive(data.active);
    } catch (err: any) {
      alert("Error togling firewall: " + err.message);
    } finally {
      setSyncing(false);
    }
  };

  const handleResetSystem = async () => {
    if (
      !confirm(
        "WARNING: You are about to wipe all custom firewall rules and clear the connection logs database. Would you like to restore pre-production defaults?"
      )
    ) {
      return;
    }

    try {
      setSyncing(true);
      const res = await fetch("/api/reset", { method: "POST" });
      if (!res.ok) throw new Error("System re-indexing reject");
      await fetchStatus();
      alert("System returned to factory production defaults!");
    } catch (err: any) {
      alert("Error purging metrics: " + err.message);
    } finally {
      setSyncing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 text-blue-400 space-y-4">
        <RefreshCw className="w-12 h-12 animate-spin text-cyan-400" />
        <p className="font-mono text-sm tracking-widest text-slate-300">RETRIEVING SECURITY PROFILES...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in" id="settings-viewport">
      {/* Settings Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 sleek-card shadow-xl">
        <div>
          <h1 className="text-xl font-bold font-sans text-white flex items-center gap-2">
            <Settings className="text-[#38bdf8] w-5 h-5" />
            Access Control Settings
          </h1>
          <p className="text-[#94a3b8] text-xs mt-1">
            Global toggle controls, policy initialization parameters, and diagnostic metrics management.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Toggle Option Control Cards - columns 8/12 */}
        <div className="lg:col-span-8 p-6 sleek-card shadow-xl space-y-6">
          <div className="border-b border-white/10 pb-4 mb-4">
            <h2 className="text-md font-bold font-sans text-white">Administration Controls</h2>
            <p className="text-xs text-[#94a3b8] mt-0.5">Control the runtime of the firewall inspect system.</p>
          </div>

          {/* Interactive Toggle panel */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#0f172a]/40 p-5 rounded-2xl border border-white/5">
            <div className="space-y-1">
              <span className="flex items-center gap-1.5 font-sans text-xs font-bold text-white uppercase tracking-wider">
                <Power className="w-4 h-4 text-[#38bdf8]" /> State Engine Activity
              </span>
              <p className="text-xs text-[#94a3b8] leading-relaxed max-w-md">
                Toggling this switches off all active header rules evaluation. When inactive, ALL inbound packets bypass checks with status indicator "Allowed".
              </p>
            </div>

            <button
              onClick={handleToggleState}
              disabled={syncing}
              className={`px-5 py-3 rounded-lg text-xs font-sans font-bold tracking-wider transition-all cursor-pointer flex items-center gap-2 self-start sm:self-auto ${
                active
                  ? "bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30"
                  : "bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
              }`}
            >
              {active ? "SHUTDOWN STATE" : "BOOST SYSTEM"}
            </button>
          </div>

          {/* Factory reset panel */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-rose-950/5 p-5 rounded-2xl border border-rose-950/25 mt-4">
            <div className="space-y-1">
              <span className="flex items-center gap-1.5 font-sans text-xs font-bold text-rose-400 uppercase tracking-wider">
                <Database className="w-4 h-4 text-rose-400" /> Purge & Reconstruct System
              </span>
              <p className="text-xs text-[#94a3b8] leading-relaxed max-w-sm">
                Clears all custom firewall policies and historical packet connection trails. Restores the default demonstration rules and 75 audit logs.
              </p>
            </div>

            <button
              onClick={handleResetSystem}
              disabled={syncing}
              className="px-5 py-3 rounded-lg text-xs font-sans font-bold tracking-wider text-rose-400 bg-rose-950/20 hover:bg-rose-950/40 border border-rose-900/30 transition-all cursor-pointer flex items-center gap-1.5 self-start sm:self-auto"
            >
              <Trash2 className="w-4 h-4" /> Reset DB Metrics
            </button>
          </div>
        </div>

        {/* Database Audit Status - columns 4/12 */}
        <div className="lg:col-span-4 p-6 sleek-card shadow-xl flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-sans font-bold text-white uppercase tracking-widest mb-4 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-[#22c55e]" /> ENGINE DIAGNOSTICS
            </h3>

            <div className="space-y-4 font-sans text-xs">
              <div className="p-3 bg-black/40 border border-white/5 rounded-xl space-y-1.5">
                <span className="text-[10px] text-[#94a3b8] uppercase block font-semibold">State Machine Status:</span>
                <span className={`font-bold uppercase ${active ? 'text-[#22c55e]' : 'text-rose-400'}`}>
                  {active ? "ACTIVE & ROUTED" : "BYPASS (BYPASSED)"}
                </span>
              </div>

              <div className="p-3 bg-black/40 border border-white/5 rounded-xl space-y-1.5">
                <span className="text-[10px] text-[#94a3b8] uppercase block font-semibold">Memory Rules Indexed:</span>
                <span className="font-bold text-white font-mono uppercase">{totalRules} active</span>
              </div>

              <div className="p-3 bg-black/40 border border-white/5 rounded-xl space-y-1.5">
                <span className="text-[10px] text-[#94a3b8] uppercase block font-semibold">Logs Size In Bytes:</span>
                <span className="font-bold text-white font-mono uppercase">{(totalLogs * 184).toLocaleString()} bits</span>
              </div>
            </div>
          </div>

          <div className="text-[9px] text-[#94a3b8] font-sans mt-6 border-t border-white/10 pt-3 uppercase tracking-wider text-right">
            SFS-PRO-ENGINE-STABLE
          </div>
        </div>
      </div>
    </div>
  );
}
