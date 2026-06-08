import React, { useState, useEffect } from "react";
import { BarChart3, Activity, Ban, ShieldAlert, CheckCircle, RefreshCw, Layers } from "lucide-react";
import { AnalyticsStats, DailyTrafficTrend, BlockedIP, BlockedPort } from "../types";

export default function AnalyticsView() {
  const [stats, setStats] = useState<AnalyticsStats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/analytics/stats");
      if (!res.ok) throw new Error("Could not acquire analytics dashboard data");
      const data = await res.json();
      setStats(data);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 text-blue-400 space-y-4">
        <RefreshCw className="w-12 h-12 animate-spin text-cyan-400" />
        <p className="font-mono text-sm tracking-widest text-slate-300">QUERYING TELEMETRY STACK...</p>
      </div>
    );
  }

  // Calculate percentages
  const allowed = stats?.allowed ?? 0;
  const blocked = stats?.blocked ?? 0;
  const total = allowed + blocked;
  const allowedPercent = total ? Math.round((allowed / total) * 100) : 0;
  const blockedPercent = total ? Math.round((blocked / total) * 100) : 0;

  // Pie chart variables
  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  const strokeOffsetAllowed = circumference - (allowedPercent / 100) * circumference;

  // Find max daily count to scale Area chart beautifully
  const dailyTrends: DailyTrafficTrend[] = stats?.dailyTraffic ?? [];
  const maxTrafficVal = Math.max(
    ...dailyTrends.map(d => Math.max(d.Allowed, d.Blocked)),
    5 // fallback minimum ceiling
  );

  return (
    <div className="space-y-6 animate-fade-in" id="analytics-panel">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 sleek-card shadow-xl">
        <div>
          <h1 className="text-xl font-bold font-sans text-white flex items-center gap-2">
            <BarChart3 className="text-[#38bdf8] w-5 h-5" />
            Security Analytics
          </h1>
          <p className="text-[#94a3b8] text-xs mt-1">
            Aggregated metrics for traffic decision ratios, target port vectors, and blacklisted host trackers.
          </p>
        </div>

        <button
          onClick={fetchStats}
          className="px-4 py-2 text-xs font-sans font-semibold rounded-lg text-[#f1f5f9] bg-slate-800/80 hover:bg-slate-700/80 border border-white/5 transition-all flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5 text-[#38bdf8]" />
          Refresh Stats
        </button>
      </div>

      {/* Main Grid: 2 columns top, 2 columns bottom */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* Chart 1: Donut Ratio Block vs Allow */}
        <div className="md:col-span-4 p-6 sleek-card shadow-xl flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-semibold text-[#94a3b8] uppercase tracking-wider mb-2">TRAFFIC MIX</h3>
            <p className="text-[11px] text-[#94a3b8] mb-4">Ratio of permitted frames vs rejected threats</p>
            
            <div className="relative flex justify-center items-center py-6">
              {/* SVG concentric circles */}
              <svg className="w-40 h-40 transform -rotate-90">
                {/* Background Ring */}
                <circle
                  cx="80"
                  cy="80"
                  r={radius}
                  fill="transparent"
                  stroke="#1e293b"
                  strokeWidth="12"
                />
                {/* Blocked Arc (Whole circle first) */}
                <circle
                  cx="80"
                  cy="80"
                  r={radius}
                  fill="transparent"
                  stroke="#ef4444"
                  strokeWidth="12"
                  strokeDasharray={circumference}
                  strokeDashoffset={0}
                />
                {/* Allowed Arc overlay */}
                <circle
                  cx="80"
                  cy="80"
                  r={radius}
                  fill="transparent"
                  stroke="#22c55e"
                  strokeWidth="12"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeOffsetAllowed}
                  strokeLinecap="round"
                />
              </svg>

              {/* Text indicator in the visual hole */}
              <div className="absolute flex flex-col items-center">
                <span className="text-2xl font-bold font-mono text-white">{total}</span>
                <span className="text-[9px] text-[#94a3b8] font-sans font-semibold tracking-wider">TOTAL PACKETS</span>
              </div>
            </div>
          </div>

          <div className="space-y-4 border-t border-white/10 pt-4 text-xs font-sans">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                <CheckCircle className="w-3.5 h-3.5 text-[#22c55e]" /> Passed Traffic
              </span>
              <span className="font-bold text-white font-mono">{allowed} ({allowedPercent}%)</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-rose-400 font-semibold">
                <Ban className="w-3.5 h-3.5 text-[#ef4444]" /> Security Blocks
              </span>
              <span className="font-bold text-white font-mono">{blocked} ({blockedPercent}%)</span>
            </div>
          </div>
        </div>

        {/* Chart 2: 7-Day Trend Area charts */}
        <div className="md:col-span-8 p-6 sleek-card shadow-xl flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-semibold text-[#94a3b8] uppercase tracking-wider mb-2">7-DAY TRAFFIC TREND</h3>
            <p className="text-[11px] text-[#94a3b8] mb-4">Inspection timelines tracking Allowed and Blocked connection attempts</p>

            {/* Line / Area rendering natively via SVG */}
            {dailyTrends.length > 0 ? (
              <div className="relative">
                {/* Chart Grid */}
                <div className="h-44 w-full flex flex-col justify-between absolute inset-0 text-[10px] text-slate-600 font-sans select-none pointer-events-none z-0">
                  <div className="border-b border-white/5 w-full text-right pr-2">Ceiling</div>
                  <div className="border-b border-white/5 w-full text-right pr-2">Average</div>
                  <div className="border-b border-white/5 w-full text-right pr-2">Base</div>
                </div>

                <svg className="w-full h-44 relative z-10" viewBox="0 0 700 180" preserveAspectRatio="none">
                  {/* Generate Area Allowed path polygons */}
                  <polygon
                    fill="url(#allowedGlowGradient)"
                    opacity="0.15"
                    points={`
                      -10,180
                      ${dailyTrends.map((d, index) => {
                        const x = (index / (dailyTrends.length - 1)) * 720 - 10;
                        const y = 180 - (d.Allowed / maxTrafficVal) * 140;
                        return `${x},${y}`;
                      }).join(" ")}
                      710,180
                    `}
                  />

                  {/* Allowed Trend line */}
                  <polyline
                    fill="none"
                    stroke="#22c55e"
                    strokeWidth="3"
                    strokeLinecap="round"
                    points={dailyTrends.map((d, index) => {
                      const x = (index / (dailyTrends.length - 1)) * 720 - 10;
                      const y = 180 - (d.Allowed / maxTrafficVal) * 140;
                      return `${x},${y}`;
                    }).join(" ")}
                  />

                  {/* Generate Area Blocked path polygons */}
                  <polygon
                    fill="url(#blockedGlowGradient)"
                    opacity="0.15"
                    points={`
                      -10,180
                      ${dailyTrends.map((d, index) => {
                        const x = (index / (dailyTrends.length - 1)) * 720 - 10;
                        const y = 180 - (d.Blocked / maxTrafficVal) * 140;
                        return `${x},${y}`;
                      }).join(" ")}
                      710,180
                    `}
                  />

                  {/* Blocked Trend line */}
                  <polyline
                    fill="none"
                    stroke="#ef4444"
                    strokeWidth="3"
                    strokeLinecap="round"
                    points={dailyTrends.map((d, index) => {
                      const x = (index / (dailyTrends.length - 1)) * 720 - 10;
                      const y = 180 - (d.Blocked / maxTrafficVal) * 140;
                      return `${x},${y}`;
                    }).join(" ")}
                  />

                  {/* Interactive Dot checkpoints */}
                  {dailyTrends.map((d, index) => {
                    const x = (index / (dailyTrends.length - 1)) * 720 - 10;
                    const allowY = 180 - (d.Allowed / maxTrafficVal) * 140;
                    const blockY = 180 - (d.Blocked / maxTrafficVal) * 140;
                    return (
                      <g key={index}>
                        <circle cx={x} cy={allowY} r="4" fill="#22c55e" />
                        <circle cx={x} cy={blockY} r="4" fill="#ef4444" />
                      </g>
                    );
                  })}

                  {/* Color Gradients definitions */}
                  <defs>
                    <linearGradient id="allowedGlowGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#22c55e" />
                      <stop offset="100%" stopColor="#22c55e" stopOpacity="0" />
                    </linearGradient>
                    <linearGradient id="blockedGlowGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#ef4444" />
                      <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>
            ) : (
              <div className="h-44 flex items-center justify-center font-sans text-[10px] text-slate-600">
                NO TRENDS TO RENDER
              </div>
            )}
          </div>

          {/* Timeframe bottom labels */}
          <div className="flex justify-between items-center bg-[#0f172a]/40 border border-white/5 px-4 py-2.5 rounded-xl mt-4 font-sans text-[10px]">
            {dailyTrends.map((d, index) => (
              <span key={index} className="text-[#94a3b8] text-center font-semibold uppercase">{d.DateLabel}</span>
            ))}
          </div>
        </div>

      </div>

      {/* Grid: Most blocked target ports / blacklisted IPs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Card 3: Most Blocked IP vector tables */}
        <div className="p-6 sleek-card shadow-xl space-y-4">
          <div>
            <h3 className="text-xs font-semibold text-rose-400 flex items-center gap-1.5 tracking-wider uppercase">
              <ShieldAlert className="w-4 h-4 text-[#ef4444]" /> Targeted Attack Vectors
            </h3>
            <p className="text-[11px] text-[#94a3b8] mt-0.5">Top blacklisted IP addresses causing connection mitigations</p>
          </div>

          <div className="space-y-3 font-sans text-xs">
            {stats?.blockedIPs && stats.blockedIPs.length > 0 ? (
              stats.blockedIPs.map((ipObj, idx) => {
                const maxCount = stats.blockedIPs[0]?.count || 1;
                const percentage = Math.round((ipObj.count / maxCount) * 100);
                return (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="font-bold font-mono text-white block">{ipObj.ip}</span>
                      <span className="text-[#94a3b8] font-semibold">{ipObj.count} hits blocked</span>
                    </div>
                    {/* Visual Bar inside the matrix */}
                    <div className="h-2 w-full rounded bg-[#0f172a] overflow-hidden relative border border-white/5">
                      <div 
                        className="h-full rounded bg-gradient-to-r from-rose-500/70 to-rose-400/90 block transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="py-8 text-center text-slate-600 italic">No packet blocks logged. Add custom blocks and dispatch random simulated vectors.</div>
            )}
          </div>
        </div>

        {/* Card 4: Most Blocked Port target vectors */}
        <div className="p-6 sleek-card shadow-xl space-y-4">
          <div>
            <h3 className="text-xs font-semibold text-[#38bdf8] flex items-center gap-1.5 tracking-wider uppercase">
              <Layers className="w-4 h-4 text-[#38bdf8]" /> Vulnerability Vector Port Targets
            </h3>
            <p className="text-[11px] text-[#94a3b8] mt-0.5">Ports most frequently blocked by targeted packet probes</p>
          </div>

          <div className="space-y-3 font-sans text-xs">
            {stats?.blockedPorts && stats.blockedPorts.length > 0 ? (
              stats.blockedPorts.map((portObj, idx) => {
                const maxCount = stats.blockedPorts[0]?.count || 1;
                const percentage = Math.round((portObj.count / maxCount) * 100);
                return (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="font-semibold text-white text-[#38bdf8] block">Port {portObj.port}</span>
                      <span className="text-[#94a3b8] font-semibold">{portObj.count} rejections</span>
                    </div>
                    {/* Visual Bar inside grid */}
                    <div className="h-2 w-full rounded bg-[#0f172a] overflow-hidden relative border border-white/5">
                      <div 
                        className="h-full rounded bg-gradient-to-r from-sky-500/70 to-sky-400/90 block transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="py-8 text-center text-slate-600 italic">No targeted port records blocked. Inject some packets.</div>
            )}
          </div>
        </div>

      </div>

      <div className="p-4 bg-slate-900/10 rounded-xl border border-white/5 text-center font-mono text-[10px] text-slate-600 uppercase select-none">
        Telemetry auditing stream synced with server-side JSON database logs
      </div>
    </div>
  );
}
