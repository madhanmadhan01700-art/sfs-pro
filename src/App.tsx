// SFS Pro Security Operations Center (SOC) Dashboard - Modern Client-Server Implementation
import React, { useState, useEffect } from "react";
import { ShieldAlert, ShieldCheck, Activity, ListOrdered, Play, FileText, BarChart, Settings, Menu, X, ShieldCheck as ShieldIcon } from "lucide-react";
import DashboardView from "./components/DashboardView";
import RulesView from "./components/RulesView";
import SimulatorView from "./components/SimulatorView";
import LogsView from "./components/LogsView";
import AnalyticsView from "./components/AnalyticsView";
import SettingsView from "./components/SettingsView";
import { getDashboardSummary } from "./services/api";

export default function App() {
  const [currentPage, setCurrentPage] = useState<string>("Dashboard");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [firewallStatus, setFirewallStatus] = useState<boolean>(true);

  // Poll firewall state on mount & page changes
  const checkStatus = async () => {
    try {
      const data = await getDashboardSummary();
      setFirewallStatus(data.status);
    } catch (e) {
      console.error("Status checks connection bypassed:", e);
    }
  };

  useEffect(() => {
    checkStatus();
    // Quick polling every 10 seconds to keep firewall status badge fresh
    const interval = setInterval(checkStatus, 10000);
    return () => clearInterval(interval);
  }, [currentPage]);

  // Sidebar Menu configuration matching Sleek Design labels exactly
  const menuItems = [
    { name: "Dashboard", label: "Dashboard", icon: Activity },
    { name: "Rules", label: "Firewall Rules", icon: ListOrdered },
    { name: "Traffic Simulator", label: "Traffic Simulator", icon: Play },
    { name: "Logs", label: "System Logs", icon: FileText },
    { name: "Analytics", label: "Analytics", icon: BarChart },
    { name: "Settings", label: "Access Control", icon: Settings },
  ];

  // Router viewport mapping helper
  const renderPage = () => {
    switch (currentPage) {
      case "Rules":
        return <RulesView />;
      case "Traffic Simulator":
        return <SimulatorView />;
      case "Logs":
        return <LogsView />;
      case "Analytics":
        return <AnalyticsView />;
      case "Settings":
        return <SettingsView />;
      case "Dashboard":
      default:
        return <DashboardView onNavigate={setCurrentPage} />;
    }
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-[#f1f5f9] flex flex-col md:flex-row antialiased select-none selection:bg-[#38bdf8] selection:text-slate-900">
      
      {/* Dynamic Background Mesh Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-40 pointer-events-none z-0" />

      {/* Mobile Top Header */}
      <header className="md:hidden w-full flex justify-between items-center px-5 py-4 bg-slate-950/90 border-b border-white/10 backdrop-blur-xl z-40 relative">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-[#38bdf8] rounded-lg flex items-center justify-center font-bold text-[#0f172a] text-sm">
            S
          </div>
          <span className="font-extrabold text-md tracking-wider text-white">
            SFS <span className="text-[#38bdf8]">PRO</span>
          </span>
        </div>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-1 px-2 rounded-lg bg-slate-900 hover:bg-slate-850 hover:text-[#38bdf8] text-[#94a3b8] transition-colors"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </header>

      {/* Sidebar Navigation */}
      <aside className={`fixed md:sticky top-0 left-0 w-64 md:w-68 h-screen bg-[#0f172a]/95 md:bg-[#0f172a]/90 border-r border-white/10 flex flex-col justify-between py-6 px-4 shrink-0 transition-transform duration-300 md:translate-x-0 z-40 ${
        mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
      }`}>
        
        {/* Brand Identification Logo */}
        <div className="space-y-6">
          <div className="flex items-center gap-3 px-2 border-b border-white/10 pb-5">
            <div className="w-8 h-8 bg-[#38bdf8] rounded-lg flex items-center justify-center font-bold text-[#0f172a] text-md">
              S
            </div>
            <div>
              <h2 className="text-md font-black text-white tracking-widest leading-none">
                SFS <span className="text-[#38bdf8]">PRO</span>
              </h2>
              <span className="text-[10px] text-[#94a3b8] font-semibold mt-1.5 block uppercase tracking-wide">FIREWALL SECURE</span>
            </div>
          </div>

          {/* Nav List */}
          <nav className="space-y-1 list-none">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPage === item.name;
              return (
                <li key={item.name}>
                  <button
                    onClick={() => {
                      setCurrentPage(item.name);
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-sans text-sm font-medium transition-all cursor-pointer ${
                      isActive
                        ? "bg-[#38bdf8]/10 text-[#38bdf8]"
                        : "text-[#94a3b8] hover:bg-white/5 hover:text-[#f1f5f9]"
                    }`}
                  >
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-[#38bdf8]' : 'text-[#94a3b8]'}`} />
                    {item.label}
                  </button>
                </li>
              );
            })}
          </nav>
        </div>

        {/* Global Protection HUD status badge */}
        <div>
          <div className="p-4 rounded-xl bg-slate-900/60 border border-white/10 backdrop-blur-md">
            <div className="flex items-center justify-between text-[11px] font-semibold mb-2">
              <span className="text-[#94a3b8] uppercase tracking-wider">HUD STATUS</span>
              <span className={firewallStatus ? 'text-[#22c55e] font-bold' : 'text-[#ef4444] font-bold'}>
                {firewallStatus ? "SHIELDED" : "UNSECURED"}
              </span>
            </div>
            <div className="h-1.5 w-full bg-slate-950/80 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-500 ${firewallStatus ? 'bg-[#22c55e]' : 'bg-[#ef4444]'}`}
                style={{ width: firewallStatus ? '100%' : '30%' }}
              />
            </div>
            <p className="text-[9px] text-[#94a3b8] mt-2 uppercase text-center leading-none">
              {firewallStatus ? "Deep Packet Filter Active" : "Rules Bypass Mode Active"}
            </p>
          </div>
          <div className="text-center mt-3 text-[10px] text-[#94a3b8] font-sans">
            v4.2.1 Stable Build
          </div>
        </div>

      </aside>

      {/* Main Viewport Container */}
      <main className="flex-1 px-4 sm:px-6 md:px-8 py-6 max-w-7xl mx-auto w-full z-10 relative overflow-y-auto">
        {renderPage()}
      </main>

    </div>
  );
}
