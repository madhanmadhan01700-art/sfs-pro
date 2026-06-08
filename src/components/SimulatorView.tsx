import React, { useState } from "react";
import { Terminal, Cpu, Info, ShieldAlert, CheckCircle, Ban, RefreshCw, Send, ShieldCheck } from "lucide-react";
import { simulatePacket } from "../services/api";

export default function SimulatorView() {
  const [ip, setIp] = useState("192.168.1.100");
  const [port, setPort] = useState("80");
  const [protocol, setProtocol] = useState("TCP");

  // Simulation Status States
  const [simulating, setSimulating] = useState(false);
  const [simStep, setSimStep] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);
  const [result, setResult] = useState<{
    decision: "Allowed" | "Blocked";
    matched_rule: string;
  } | null>(null);

  // Suggested demo packets helper
  const loadDemoPacket = (demoIp: string, demoPort: string, demoProto: string) => {
    setIp(demoIp);
    setPort(demoPort);
    setProtocol(demoProto);
    setResult(null);
    setSimStep(0);
    setLogs([]);
  };

  const handleSendPacket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ip.trim() || !port.trim()) return;

    setSimulating(true);
    setResult(null);
    setLogs([]);

    // Step 1: Encapsulate
    setSimStep(1);
    setLogs(prev => [...prev, `[INIT] Compiling Layer-3 IP Packet Header for ${ip}...`]);
    await new Promise(r => setTimeout(r, 650));

    // Step 2: Protocol Transport details
    setSimStep(2);
    setLogs(prev => [
      ...prev,
      `[HDR] Layer-4 socket connection initiated using transport layer protocol: ${protocol}`,
      `[HDR] Multiplexing frame destination address to Port: ${port}`
    ]);
    await new Promise(r => setTimeout(r, 650));

    // Step 3: Rule check
    setSimStep(3);
    setLogs(prev => [
      ...prev,
      `[DPI] Intercepting ethernet packet at Virtual Interface (vth0)...`,
      `[SOC] Fetching active firewall policies list...`,
      `[SOC] Running regex evaluation algorithms on packet metadata...`
    ]);
    await new Promise(r => setTimeout(r, 800));

    try {
      const data = await simulatePacket({
        source_ip: ip.trim(),
        destination_port: port.trim(),
        protocol
      });
      
      setResult({
        decision: data.decision,
        matched_rule: data.matched_rule
      });

      if (data.decision === "Allowed") {
        setLogs(prev => [
          ...prev,
          `[RULE MATCH]: "${data.matched_rule}"`,
          `[VERDICT]: SUCCESS (ALLOWED) - IP socket packets forwarded instantly to Server target.`
        ]);
      } else {
        setLogs(prev => [
          ...prev,
          `[RULE MATCH]: WARNING! "${data.matched_rule}" has explicit BLOCK configuration.`,
          `[VERDICT]: DROPPED (BLOCKED) - Packet rejected by rule action. Sent Connection Refused frame.`
        ]);
      }
    } catch (err: any) {
      setLogs(prev => [...prev, `[CRITICAL FATAL ERROR]: ${err.message}`]);
    } finally {
      setSimStep(4);
      setSimulating(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fade-in" id="simulator-container">
      {/* Simulation form - column 5/12 */}
      <div className="lg:col-span-5 space-y-6">
        <div className="p-6 sleek-card shadow-xl space-y-4">
          <div>
            <h2 className="text-lg font-bold font-sans text-white flex items-center gap-2">
              <Cpu className="text-[#38bdf8] w-5 h-5" />
              Packet Header Builder
            </h2>
            <p className="text-[#94a3b8] text-xs mt-1">
              Construct a simulated Level 3 IP packet from a remote host and dispatch it across the virtual firewall path.
            </p>
          </div>

          <form onSubmit={handleSendPacket} className="space-y-4 font-sans text-xs">
            <div>
              <label className="block text-[#94a3b8] mb-1 font-semibold uppercase tracking-wider text-[10px]">Source IP Address</label>
              <input
                type="text"
                required
                disabled={simulating}
                placeholder="e.g., 192.168.1.10"
                value={ip}
                onChange={(e) => setIp(e.target.value)}
                className="w-full px-3 py-2 sleek-input rounded-md font-mono disabled:opacity-50"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[#94a3b8] mb-1 font-semibold uppercase tracking-wider text-[10px]">Dest Port</label>
                <input
                  type="number"
                  required
                  disabled={simulating}
                  placeholder="e.g., 80"
                  value={port}
                  onChange={(e) => setPort(e.target.value)}
                  className="w-full px-3 py-2 sleek-input rounded-md font-mono disabled:opacity-50"
                />
              </div>
              <div>
                <label className="block text-[#94a3b8] mb-1 font-semibold uppercase tracking-wider text-[10px]">Protocol Layer</label>
                <select
                  value={protocol}
                  disabled={simulating}
                  onChange={(e) => setProtocol(e.target.value)}
                  className="w-full px-3 py-2 sleek-input rounded-md disabled:opacity-50"
                >
                  <option value="TCP">TCP</option>
                  <option value="UDP">UDP</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={simulating}
              className="w-full py-2.5 rounded-lg text-xs font-semibold text-[#0f172a] sleek-button-primary disabled:opacity-50 transition-colors shadow-lg cursor-pointer flex items-center justify-center gap-2"
            >
              {simulating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Transmitting...
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  Send Simulated Packet
                </>
              )}
            </button>
          </form>

          {/* Quick Sandbox Scenarios */}
          <div className="space-y-2 border-t border-white/10 pt-4">
            <h3 className="text-[#94a3b8] text-xs font-semibold tracking-wider uppercase mb-3">QUICK SANDBOX SCENARIOS</h3>
            <div className="grid grid-cols-1 gap-2">
              <button
                onClick={() => loadDemoPacket("198.51.100.42", "22", "TCP")}
                disabled={simulating}
                className="text-left px-3 py-2.5 rounded-lg bg-[#0f172a]/40 hover:bg-[#0f172a]/80 border border-white/5 transition-all text-xs font-sans flex flex-col cursor-pointer disabled:opacity-50"
              >
                <span className="text-[#ef4444] font-semibold text-[11px]">Malicious SSH Block Scenario</span>
                <span className="text-[10px] text-[#94a3b8] font-mono mt-0.5">Source: 198.51.100.42 | Port: 22 | TCP</span>
              </button>

              <button
                onClick={() => loadDemoPacket("192.168.1.15", "80", "TCP")}
                disabled={simulating}
                className="text-left px-3 py-2.5 rounded-lg bg-[#0f172a]/40 hover:bg-[#0f172a]/80 border border-white/5 transition-all text-xs font-sans flex flex-col cursor-pointer disabled:opacity-50"
              >
                <span className="text-[#22c55e] font-semibold text-[11px]">Standard Inbound Web Request</span>
                <span className="text-[10px] text-[#94a3b8] font-mono mt-0.5">Source: 192.168.1.15 | Port: 80 | TCP</span>
              </button>

              <button
                onClick={() => loadDemoPacket("8.8.8.8", "53", "UDP")}
                disabled={simulating}
                className="text-left px-3 py-2.5 rounded-lg bg-[#0f172a]/40 hover:bg-[#0f172a]/80 border border-white/5 transition-all text-xs font-sans flex flex-col cursor-pointer disabled:opacity-50"
              >
                <span className="text-[#38bdf8] font-semibold text-[11px]">Secure DNS Request Frame</span>
                <span className="text-[10px] text-[#94a3b8] font-mono mt-0.5">Source: 8.8.8.8 | Port: 53 | UDP</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Animation & Terminal logger - column 7/12 */}
      <div className="lg:col-span-7 space-y-6 flex flex-col justify-between">
        {/* Visual Animation Section */}
        <div className="p-6 sleek-card shadow-xl flex flex-col items-center justify-center min-h-[220px] relative overflow-hidden">
          <div className="absolute top-3 left-4 text-slate-500 font-sans text-[10px] tracking-widest uppercase">
            Schematic Layer Flow Visualizer
          </div>

          <div className="flex w-full max-w-md items-center justify-between relative py-6 mt-4">
            {/* Visual client laptop */}
            <div className="flex flex-col items-center z-10">
              <div className="p-3.5 rounded-2xl bg-black/45 border border-white/10 flex items-center justify-center text-slate-300">
                <Cpu className="w-6 h-6 text-[#94a3b8]" />
              </div>
              <span className="text-[10px] leading-none text-white mt-2 font-mono">{ip}</span>
              <span className="text-[9px] text-[#94a3b8] font-sans mt-0.5">REMOTE HOST</span>
            </div>

            {/* Simulated connect path with glowing dot moving */}
            <div className="absolute left-[54px] right-[54px] h-[2px] bg-white/5 rounded z-0 flex items-center justify-center">
              {simulating && (
                <div 
                  className={`w-3.5 h-3.5 rounded-full blur-[1px] animate-ping ${
                    simStep === 1 ? 'bg-[#38bdf8]' : simStep === 2 ? 'bg-[#38bdf8]' : 'bg-[#eab308]'
                  }`}
                  style={{
                    position: 'absolute',
                    left: `${simStep === 1 ? '10%' : simStep === 2 ? '50%' : '80%'}`
                  }}
                />
              )}
            </div>

            {/* Visual firewall gate */}
            <div className="flex flex-col items-center z-10 select-none">
              <div className={`p-4 rounded-full border flex items-center justify-center transition-all duration-300 ${
                simulating 
                  ? "bg-slate-950 border-[#38bdf8] text-[#38bdf8] animate-pulse ring-4 ring-[#38bdf8]/10" 
                  : result?.decision === "Allowed" 
                    ? "bg-[#22c55e]/10 border-[#22c55e] text-[#22c55e] ring-4 ring-[#22c55e]/10" 
                    : result?.decision === "Blocked" 
                      ? "bg-[#ef4444]/10 border-[#ef4444] text-[#ef4444] ring-4 ring-[#ef4444]/10 animate-shake" 
                      : "bg-[#0f172a] border-white/10 text-slate-500"
              }`}>
                {result?.decision === "Allowed" ? (
                  <ShieldCheck className="w-7 h-7" />
                ) : (
                  <ShieldAlert className="w-7 h-7" />
                )}
              </div>
              <span className="text-[10px] text-white mt-2 font-sans font-semibold">FIREWALL</span>
              <span className="text-[9px] text-[#94a3b8] font-sans">SOC POLICY</span>
            </div>

            {/* Visual target server */}
            <div className="flex flex-col items-center z-10">
              <div className={`p-3.5 rounded-2xl bg-black/45 border transition-all duration-300 ${
                result?.decision === "Allowed" 
                  ? "border-[#22c55e]/50 text-[#22c55e] bg-[#22c55e]/10" 
                  : "border-white/10 text-[#94a3b8]"
              }`}>
                <Terminal className="w-6 h-6 text-slate-400" />
              </div>
              <span className="text-[10px] text-white mt-2 font-mono">Localhost:{port}</span>
              <span className="text-[9px] text-[#94a3b8] font-sans mt-0.5">TARGET CONTAINER</span>
            </div>
          </div>

          {/* Decision badge panel overlay */}
          {result && (
            <div className={`mt-6 p-3 rounded-xl border flex items-center gap-3 w-full max-w-sm transition-all animate-bounce ${
              result.decision === "Allowed" 
                ? "bg-[#22c55e]/10 border-[#22c55e]/20 text-emerald-300" 
                : "bg-[#ef4444]/10 border-[#ef4444]/20 text-rose-300"
            }`}>
              <div className="shrink-0 animate-pulse">
                {result.decision === "Allowed" ? <CheckCircle className="w-5 h-5 text-[#22c55e]" /> : <Ban className="w-5 h-5 text-[#ef4444]" />}
              </div>
              <div>
                <p className="text-[11px] font-sans font-bold leading-none">
                  VERDICT: <span className={result.decision === "Allowed" ? "text-[#22c55e]" : "text-[#ef4444]"}>{result.decision.toUpperCase()}</span>
                </p>
                <p className="text-[10px] text-[#94a3b8] font-mono mt-1">
                  Rule Triggered: <strong>{result.matched_rule}</strong>
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Real-time Shell Terminal display logger */}
        <div className="p-5 rounded-2xl bg-black border border-white/5 shadow-2xl space-y-3 font-mono flex-1 min-h-[180px] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-white/5 pb-2 mb-2 text-[10px] text-slate-500">
              <span className="flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-[#38bdf8] animate-pulse" />
                ACTIVE SOC PACKET FILTER DUMP
              </span>
              <span>TTY0 (SURVEILLANCE)</span>
            </div>

            <div className="text-xs text-[#94a3b8] space-y-1.5 max-h-[140px] overflow-y-auto">
              {logs.length > 0 ? (
                logs.map((log, i) => (
                  <div 
                    key={i} 
                    className={`${
                      log.startsWith("[VERDICT]: SUCCESS") 
                        ? 'text-[#22c55e] font-bold' 
                        : log.startsWith("[VERDICT]: DROPPED") 
                          ? 'text-[#ef4444] font-bold animate-pulse' 
                          : log.startsWith("[RULE") 
                            ? 'text-yellow-400' 
                            : 'text-slate-300'
                    }`}
                  >
                    &gt; {log}
                  </div>
                ))
              ) : (
                <div className="text-slate-600 italic py-6 text-center text-[11px]">
                  Sniffer idle. Configure packet parameters on the left and click "Send Simulated Packet" to inspect transaction logs.
                </div>
              )}
            </div>
          </div>

          <div className="text-[9px] text-slate-700 text-right">
            PACKET INTAKE SYSTEM SECURE SHIELD ACTIVE
          </div>
        </div>
      </div>
    </div>
  );
}
