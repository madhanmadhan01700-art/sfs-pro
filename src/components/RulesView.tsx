import React, { useState, useEffect } from "react";
import { Plus, Trash2, Search, Edit2, ShieldAlert, Activity, Filter, Info, X } from "lucide-react";
import { Rule } from "../types";
import { getRules, addRule, deleteRule } from "../services/api";

export default function RulesView() {
  const [rules, setRules] = useState<Rule[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("All");

  // Form Field States
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);

  const [ruleName, setRuleName] = useState("");
  const [sourceIP, setSourceIP] = useState("Any");
  const [port, setPort] = useState("Any");
  const [protocol, setProtocol] = useState("Any");
  const [action, setAction] = useState("Block");
  const [description, setDescription] = useState("");

  const fetchRules = async () => {
    try {
      setLoading(true);
      const data = await getRules();
      setRules(data);
    } catch (err: any) {
      alert("Error fetching rules: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRules();
  }, []);

  const handleOpenAddForm = () => {
    // Reset Form fields
    setEditingRuleId(null);
    setRuleName("");
    setSourceIP("Any");
    setPort("Any");
    setProtocol("Any");
    setAction("Block");
    setDescription("");
    setShowAddForm(true);
  };

  const handleOpenEditForm = (rule: Rule) => {
    setEditingRuleId(rule.id);
    setRuleName(rule.name);
    setSourceIP(rule.source_ip);
    setPort(rule.port);
    setProtocol(rule.protocol);
    setAction(rule.action);
    setDescription(rule.description);
    setShowAddForm(true);
  };

  const handleSubmitRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ruleName.trim()) {
      alert("Rule name is crucial.");
      return;
    }

    try {
      // If editing, delete first. Express backend only provides POST / DELETE for simplified code. 
      // To simulate editing, we can delete the previous rule first and post the updated one, 
      // or implement full updating! Let's delete the old rule id first if editing, then submit! 
      // This is a highly robust and simple way to support 'Edit Rule' in this filesystem DB model.
      if (editingRuleId) {
        await deleteRule(editingRuleId);
      }

      const rulePayload = {
        name: ruleName.trim(),
        source_ip: sourceIP.trim(),
        port: port.toString().trim(),
        protocol,
        action,
        description: description.trim()
      };

      await addRule(rulePayload);
      
      setShowAddForm(false);
      fetchRules();
    } catch (err: any) {
      alert("Error saving rule: " + err.message);
    }
  };

  const handleDeleteRule = async (id: string) => {
    if (!confirm("Are you sure you want to remove this firewall policy?")) return;
    try {
      await deleteRule(id);
      fetchRules();
    } catch (err: any) {
      alert("Error deleting rule: " + err.message);
    }
  };

  // Filter rules array locally for responsive feel in search box
  const filteredRules = rules.filter(r => {
    const matchesSearch = 
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.source_ip.toLowerCase().includes(search.toLowerCase()) ||
      r.port.toString().toLowerCase().includes(search.toLowerCase()) ||
      r.description.toLowerCase().includes(search.toLowerCase());

    const matchesAction = actionFilter === "All" || r.action === actionFilter;

    return matchesSearch && matchesAction;
  });

  return (
    <div className="space-y-6 animate-fade-in" id="rules-container">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 sleek-card shadow-xl">
        <div>
          <h1 className="text-xl font-bold font-sans text-white flex items-center gap-2">
            <ShieldAlert className="text-[#38bdf8] w-5 h-5" />
            Firewall Rules
          </h1>
          <p className="text-[#94a3b8] text-xs mt-1">
            Rules determine if packet payloads are Blocked (thrown out) or Allowed (bypassed). Default fallback is ALLOW.
          </p>
        </div>

        <button
          onClick={handleOpenAddForm}
          className="px-4 py-2 text-xs font-sans font-bold rounded-lg text-[#0f172a] sleek-button-primary shadow-lg flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Add Access Rule
        </button>
      </div>

      {/* Rules Controls / Table */}
      <div className="p-6 sleek-card shadow-xl space-y-4">
        {/* Search & Filter rails */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-[#0f172a]/40 p-3 rounded-lg border border-white/10">
          {/* Search bar */}
          <div className="relative w-full sm:max-w-md">
            <span className="absolute inset-y-0 left-3 flex items-center text-slate-500">
              <Search className="w-4 h-4" />
            </span>
            <input
              type="text"
              placeholder="Search policies by name, source IP, port, or status..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs font-sans placeholder:text-slate-500 sleek-input rounded-md"
            />
          </div>

          {/* Action Filter */}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <span className="text-[#94a3b8] font-sans text-[11px] uppercase tracking-wider flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-[#38bdf8]" /> Filter Action:
            </span>
            <div className="flex rounded-lg bg-black/20 p-1 border border-white/10 text-xs font-sans">
              {["All", "Block", "Allow"].map((opt) => (
                <button
                  key={opt}
                  onClick={() => setActionFilter(opt)}
                  className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                    actionFilter === opt
                      ? "bg-[#38bdf8]/10 text-[#38bdf8] font-bold"
                      : "text-[#94a3b8]"
                  }`}
                >
                  {opt === "All" ? "ALL" : opt.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Policies Table */}
        {loading ? (
          <div className="text-center py-12 text-[#94a3b8] font-sans text-xs">
            RETRIEVING FIREWALL ACCESS LOGS...
          </div>
        ) : filteredRules.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left font-sans text-xs">
              <thead>
                <tr className="text-[#94a3b8] border-b border-white/10 pb-2 bg-black/10 text-[11px] uppercase tracking-wider">
                  <th className="font-semibold py-3 px-4">Rule Name</th>
                  <th className="font-semibold py-3 px-4">Source IP</th>
                  <th className="font-semibold py-3 px-4">Port</th>
                  <th className="font-semibold py-3 px-4">Protocol</th>
                  <th className="font-semibold py-3 px-4">Action</th>
                  <th className="font-semibold py-3 px-4">Description</th>
                  <th className="font-semibold py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-slate-300">
                {filteredRules.map((rule) => (
                  <tr key={rule.id} className="hover:bg-white/5 transition-colors">
                    <td className="py-4 px-4 font-semibold text-white">
                      {rule.name}
                    </td>
                    <td className="py-4 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono ${rule.source_ip === "Any" ? "bg-slate-800 text-slate-400" : "bg-[#38bdf8]/10 text-[#38bdf8]"}`}>
                        {rule.source_ip}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-slate-200">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono ${rule.port === "Any" || rule.port === "0" ? "bg-slate-800 text-slate-400" : "bg-slate-800/80 text-slate-200 border border-white/5"}`}>
                        {rule.port === "Any" || rule.port === "0" ? "*" : rule.port}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-[#94a3b8] uppercase font-semibold font-mono">{rule.protocol}</td>
                    <td className="py-4 px-4">
                      <span
                        className={`badge px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          rule.action === "Allow"
                            ? "badge-allow sleek-badge-allow"
                            : "badge-block sleek-badge-block"
                        }`}
                      >
                        {rule.action}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-[#94a3b8] max-w-xs truncate" title={rule.description}>
                      {rule.description || <span className="text-slate-600 italic">No info</span>}
                    </td>
                    <td className="py-4 px-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleOpenEditForm(rule)}
                          className="p-1 px-1.5 rounded bg-slate-800/60 hover:bg-slate-700 hover:text-[#38bdf8] transition-colors text-slate-400 cursor-pointer"
                          title="Edit rule config"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteRule(rule.id)}
                          className="p-1 px-1.5 rounded bg-slate-800/60 hover:bg-[#ef4444]/20 hover:text-[#ef4444] transition-colors text-slate-400 cursor-pointer"
                          title="Purge policy"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-12 text-center text-[#94a3b8] font-sans text-xs border border-dashed border-white/10 rounded-xl">
            No firewall security matching the filter was found.
          </div>
        )}
      </div>

      {/* Slide-out Overlay / Modal styled manually & beautifully */}
      {showAddForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-lg overflow-hidden rounded-2xl bg-[#0f172a] border border-white/10 shadow-2xl p-6 space-y-4">
            {/* Modal Heading */}
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-base font-bold font-sans text-white flex items-center gap-1.5">
                <Activity className="text-[#38bdf8] w-4 h-4" />
                {editingRuleId ? "Configure Access Policy" : "New Access Policy"}
              </h3>
              <button
                onClick={() => setShowAddForm(false)}
                className="p-1 rounded text-slate-400 hover:bg-slate-800 hover:text-white transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Hint Box */}
            <div className="p-3 bg-[#38bdf8]/10 rounded-xl border border-[#38bdf8]/10 text-[11px] text-[#38bdf8] flex gap-2 leading-relaxed">
              <Info className="w-4 h-4 shrink-0 mt-0.5" />
              <span>
                <strong>Tip:</strong> Matching values of IP = <i>'Any'</i> or Port = <i>'Any'</i> will catch all inbound queries. The engine matches <strong>Block</strong> rules first.
              </span>
            </div>

            {/* Add Rule Form */}
            <form onSubmit={handleSubmitRule} className="space-y-4 font-sans text-xs">
              <div>
                <label className="block text-[#94a3b8] mb-1 font-semibold uppercase tracking-wider text-[10px]">Rule Identifier Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Block Tor Exit Nodes"
                  value={ruleName}
                  onChange={(e) => setRuleName(e.target.value)}
                  className="w-full px-3 py-2 sleek-input rounded-md"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[#94a3b8] mb-1 font-semibold uppercase tracking-wider text-[10px]">Source IP Address</label>
                  <input
                    type="text"
                    required
                    placeholder="Any or e.g., 185.120.45.6"
                    value={sourceIP}
                    onChange={(e) => setSourceIP(e.target.value)}
                    className="w-full px-3 py-2 sleek-input rounded-md font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[#94a3b8] mb-1 font-semibold uppercase tracking-wider text-[10px]">Port Number</label>
                  <input
                    type="text"
                    required
                    placeholder="Any or e.g., 80"
                    value={port}
                    onChange={(e) => setPort(e.target.value)}
                    className="w-full px-3 py-2 sleek-input rounded-md font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[#94a3b8] mb-1 font-semibold uppercase tracking-wider text-[10px]">Protocol Scope</label>
                  <select
                    value={protocol}
                    onChange={(e) => setProtocol(e.target.value)}
                    className="w-full px-3 py-2 sleek-input rounded-md"
                  >
                    <option value="Any">Any Protocol</option>
                    <option value="TCP">TCP</option>
                    <option value="UDP">UDP</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[#94a3b8] mb-1 font-semibold uppercase tracking-wider text-[10px]">Security Action</label>
                  <select
                    value={action}
                    onChange={(e) => setAction(e.target.value)}
                    className="w-full px-3 py-2 sleek-input rounded-md"
                  >
                    <option value="Block">Block (Drop Connections)</option>
                    <option value="Allow">Allow (Permit Access)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[#94a3b8] mb-1 font-semibold uppercase tracking-wider text-[10px]">Rule Description</label>
                <textarea
                  placeholder="Explain why this security configuration exists..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 sleek-input rounded-md"
                />
              </div>

              <div className="flex gap-3 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-4 py-2 text-xs font-sans font-semibold rounded-lg text-slate-300 bg-slate-800 hover:bg-slate-705 border border-white/10 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-sans font-bold rounded-lg text-[#0f172a] sleek-button-primary shadow-lg cursor-pointer"
                >
                  {editingRuleId ? "Update Policy" : "Add Policy Rule"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
