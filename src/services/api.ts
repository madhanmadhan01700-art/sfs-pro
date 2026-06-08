import { Rule, TrafficLog, DashboardSummary, AnalyticsStats } from "../types";

// State persistence to remember server unreachable state for this session
let serverUnreachable = false;

// Default Rule Seed (matching server defaults exactly to maintain structural equivalence)
const DEFAULT_RULES: Rule[] = [
  {
    id: "rule_1",
    name: "Block SSH Intrusion",
    source_ip: "Any",
    port: "22",
    protocol: "TCP",
    action: "Block",
    description: "Block all remote terminal access on port 22",
    created_at: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString()
  },
  {
    id: "rule_2",
    name: "Block Malicious Host",
    source_ip: "198.51.100.42",
    port: "Any",
    protocol: "Any",
    action: "Block",
    description: "Known Command-&-Control node IP blocked globally",
    created_at: new Date(Date.now() - 4 * 24 * 3600 * 1000).toISOString()
  },
  {
    id: "rule_3",
    name: "Allow Web Services (HTTP)",
    source_ip: "Any",
    port: "80",
    protocol: "TCP",
    action: "Allow",
    description: "Accept typical inbound HTTP web queries",
    created_at: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString()
  },
  {
    id: "rule_4",
    name: "Allow Web Services (HTTPS)",
    source_ip: "Any",
    port: "443",
    protocol: "TCP",
    action: "Allow",
    description: "Secure terminal socket layer standard server port",
    created_at: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString()
  },
  {
    id: "rule_5",
    name: "Allow Shared DNS Queries",
    source_ip: "Any",
    port: "53",
    protocol: "UDP",
    action: "Allow",
    description: "Domain services lookup port permissions",
    created_at: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString()
  }
];

// Seed Logs Helper to generate rich visual traffic arrays in client mode
function generateSeededLogs(daysCount = 7, logsPerDay = 15): TrafficLog[] {
  const logs: TrafficLog[] = [];
  const testIPs = [
    "192.168.1.15", "10.0.0.8", "198.51.100.42", "185.220.101.5", 
    "8.8.8.8", "172.16.54.21", "192.168.1.102", "109.244.12.3", "45.138.22.4"
  ];
  const commonPorts = ["80", "443", "22", "53", "21", "3306", "8080"];
  const protocols = ["TCP", "UDP"];

  const baseTime = Date.now() - daysCount * 24 * 3600 * 1000;

  for (let i = 0; i < daysCount * logsPerDay; i++) {
    const elapsed = (i / (daysCount * logsPerDay)) * daysCount * 24 * 3600 * 1000;
    const itemTime = new Date(baseTime + elapsed);

    // Pick visual features at random
    const source_ip = testIPs[Math.floor(Math.random() * testIPs.length)];
    const destination_port = commonPorts[Math.floor(Math.random() * commonPorts.length)];
    const protocol = protocols[Math.floor(Math.random() * protocols.length)];

    let decision: "Allowed" | "Blocked" = "Allowed";
    let matched_rule = "Default Policy";

    // 1. Check Block Rules
    let matched = false;
    for (const rule of DEFAULT_RULES.filter(r => r.action === "Block")) {
      const ipMatch = rule.source_ip === "Any" || rule.source_ip === source_ip;
      const portMatch = rule.port === "Any" || rule.port === destination_port;
      const protoMatch = rule.protocol === "Any" || rule.protocol === protocol;

      if (ipMatch && portMatch && protoMatch) {
         decision = "Blocked";
         matched_rule = rule.name;
         matched = true;
         break;
      }
    }

    // 2. Check Allow Rules
    if (!matched) {
      for (const rule of DEFAULT_RULES.filter(r => r.action === "Allow")) {
        const ipMatch = rule.source_ip === "Any" || rule.source_ip === source_ip;
        const portMatch = rule.port === "Any" || rule.port === destination_port;
        const protoMatch = rule.protocol === "Any" || rule.protocol === protocol;

        if (ipMatch && portMatch && protoMatch) {
          decision = "Allowed";
          matched_rule = rule.name;
          matched = true;
          break;
        }
      }
    }

    logs.push({
      id: `log_seed_${i}`,
      source_ip,
      destination_port,
      protocol,
      decision,
      matched_rule,
      timestamp: itemTime.toISOString()
    });
  }

  return logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

// -----------------------------------------------------------------------------
// LOCAL STORAGE SYNCHRONIZATION INTERFACE
// -----------------------------------------------------------------------------
interface LocalDB {
  active: boolean;
  rules: Rule[];
  logs: TrafficLog[];
}

function getLocalDB(): LocalDB {
  const data = localStorage.getItem("sfs_db");
  if (!data) {
    const db: LocalDB = {
      active: true,
      rules: DEFAULT_RULES,
      logs: generateSeededLogs(7, 10)
    };
    saveLocalDB(db);
    return db;
  }
  try {
    return JSON.parse(data);
  } catch (e) {
    const db: LocalDB = {
      active: true,
      rules: DEFAULT_RULES,
      logs: []
    };
    saveLocalDB(db);
    return db;
  }
}

function saveLocalDB(db: LocalDB) {
  localStorage.setItem("sfs_db", JSON.stringify(db));
}

// Rule Engine Evaluator for client-side queries
function evaluateTrafficClient(
  ip: string, 
  port: string, 
  protocol: string, 
  rules: Rule[], 
  status: boolean
): { decision: "Allowed" | "Blocked"; matched_rule: string } {
  if (!status) {
    return { decision: "Allowed", matched_rule: "Firewall Disabled" };
  }

  // Iterate Block rules first (Security precedence)
  for (const rule of rules.filter(r => r.action === "Block")) {
    const ipMatch = rule.source_ip === "Any" || rule.source_ip.trim() === ip.trim();
    const portMatch = rule.port === "Any" || rule.port.toString().trim() === port.trim();
    const protoMatch = rule.protocol === "Any" || rule.protocol.toUpperCase().trim() === protocol.toUpperCase().trim();

    if (ipMatch && portMatch && protoMatch) {
      return { decision: "Blocked", matched_rule: rule.name };
    }
  }

  // Iterate Allow rules second
  for (const rule of rules.filter(r => r.action === "Allow")) {
    const ipMatch = rule.source_ip === "Any" || rule.source_ip.trim() === ip.trim();
    const portMatch = rule.port === "Any" || rule.port.toString().trim() === port.trim();
    const protoMatch = rule.protocol === "Any" || rule.protocol.toUpperCase().trim() === protocol.toUpperCase().trim();

    if (ipMatch && portMatch && protoMatch) {
      return { decision: "Allowed", matched_rule: rule.name };
    }
  }

  return { decision: "Allowed", matched_rule: "Default Policy (Allow)" };
}

// -----------------------------------------------------------------------------
// SECURED BACKEND COMMUNICATOR
// -----------------------------------------------------------------------------
async function apiFetch(url: string, options?: RequestInit) {
  if (serverUnreachable) {
    throw new Error("Server is marked as unreachable, falling back to local simulation.");
  }
  try {
    const res = await fetch(url, options);
    if (!res.ok) {
      throw new Error(`Server returned error status ${res.status}`);
    }
    const contentType = res.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      throw new Error("Response is not JSON encoded.");
    }
    return await res.json();
  } catch (err) {
    console.warn(`[SFS Backend Mode Unreachable] Query to ${url} failed. Directing to LocalStorage fallback.`, err);
    serverUnreachable = true;
    throw err;
  }
}

// -----------------------------------------------------------------------------
// PUBLIC MODULE INTERFACES (API WRAPPER COMPATIBILITY LAYER)
// -----------------------------------------------------------------------------

export async function getDashboardSummary(): Promise<DashboardSummary> {
  try {
    return await apiFetch("/api/dashboard-summary");
  } catch (err) {
    const db = getLocalDB();
    const total = db.logs.length;
    const allowed = db.logs.filter(l => l.decision === "Allowed").length;
    const blocked = db.logs.filter(l => l.decision === "Blocked").length;
    const rulesCount = db.rules.length;
    const recentLogs = db.logs.slice(0, 10);
    return {
      status: db.active,
      total,
      allowed,
      blocked,
      rulesCount,
      recentLogs
    };
  }
}

export async function toggleFirewallStatus(): Promise<boolean> {
  try {
    const res = await apiFetch("/api/status/toggle", { method: "POST" });
    return res.active;
  } catch (err) {
    const db = getLocalDB();
    db.active = !db.active;
    saveLocalDB(db);
    return db.active;
  }
}

export async function getRules(): Promise<Rule[]> {
  try {
    return await apiFetch("/api/rules");
  } catch (err) {
    const db = getLocalDB();
    return db.rules;
  }
}

export async function addRule(rulePayload: {
  name: string;
  source_ip: string;
  port: string;
  protocol: string;
  action: string;
  description: string;
}): Promise<Rule> {
  try {
    const res = await apiFetch("/api/rules", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(rulePayload)
    });
    return res.rule;
  } catch (err) {
    const db = getLocalDB();
    const newRule: Rule = {
      id: `rule_${Date.now()}`,
      name: rulePayload.name,
      source_ip: rulePayload.source_ip.trim(),
      port: rulePayload.port.toString().trim(),
      protocol: rulePayload.protocol,
      action: rulePayload.action,
      description: rulePayload.description || "",
      created_at: new Date().toISOString()
    };
    db.rules.push(newRule);
    saveLocalDB(db);
    return newRule;
  }
}

export async function deleteRule(id: string): Promise<boolean> {
  try {
    const res = await apiFetch(`/api/rules/${id}`, { method: "DELETE" });
    return res.success;
  } catch (err) {
    const db = getLocalDB();
    const index = db.rules.findIndex(r => r.id === id);
    if (index !== -1) {
      db.rules.splice(index, 1);
      saveLocalDB(db);
    }
    return true;
  }
}

export async function simulatePacket(payload: {
  source_ip: string;
  destination_port: string;
  protocol: string;
}): Promise<{ decision: "Allowed" | "Blocked"; matched_rule: string; log: TrafficLog }> {
  try {
    return await apiFetch("/api/simulate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
  } catch (err) {
    const db = getLocalDB();
    const evaluation = evaluateTrafficClient(
      payload.source_ip,
      payload.destination_port,
      payload.protocol,
      db.rules,
      db.active
    );
    const newLog: TrafficLog = {
      id: `log_${Date.now()}`,
      source_ip: payload.source_ip,
      destination_port: payload.destination_port.toString(),
      protocol: payload.protocol,
      decision: evaluation.decision,
      matched_rule: evaluation.matched_rule,
      timestamp: new Date().toISOString()
    };
    db.logs.unshift(newLog);
    saveLocalDB(db);
    return {
      decision: newLog.decision,
      matched_rule: newLog.matched_rule,
      log: newLog
    };
  }
}

export async function getLogs(filters: {
  search?: string;
  decision?: string;
  protocol?: string;
  date?: string;
}): Promise<TrafficLog[]> {
  try {
    const params = new URLSearchParams();
    if (filters.search) params.append("search", filters.search);
    if (filters.decision) params.append("decision", filters.decision);
    if (filters.protocol) params.append("protocol", filters.protocol);
    if (filters.date) params.append("date", filters.date);

    return await apiFetch(`/api/logs?${params.toString()}`);
  } catch (err) {
    const db = getLocalDB();
    let filtered = [...db.logs];

    if (filters.search) {
      const q = filters.search.toLowerCase();
      filtered = filtered.filter(l => 
        l.source_ip.toLowerCase().includes(q) ||
        l.destination_port.includes(q) ||
        l.matched_rule.toLowerCase().includes(q)
      );
    }

    if (filters.decision && filters.decision !== "All") {
      filtered = filtered.filter(l => l.decision === filters.decision);
    }

    if (filters.protocol && filters.protocol !== "All") {
      filtered = filtered.filter(l => l.protocol.toUpperCase() === filters.protocol!.toUpperCase());
    }

    if (filters.date) {
      filtered = filtered.filter(l => l.timestamp.startsWith(filters.date!));
    }

    return filtered;
  }
}

export async function generateTraffic(count: number): Promise<boolean> {
  try {
    const res = await apiFetch("/api/generate-traffic", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ count })
    });
    return res.success;
  } catch (err) {
    const db = getLocalDB();
    const testIPs = [
      "192.168.1.25", "10.0.0.15", "198.51.100.42", "185.220.101.5", 
      "8.8.8.8", "172.16.54.21", "192.168.1.102", "109.244.12.3", "45.138.22.4",
      "192.168.1.15", "185.244.15.6", "172.16.101.44"
    ];
    const commonPorts = ["80", "443", "22", "53", "21", "3306", "8080", "23", "445"];
    const protocols = ["TCP", "UDP"];

    const newLogs: TrafficLog[] = [];
    for (let i = 0; i < count; i++) {
      const ip = testIPs[Math.floor(Math.random() * testIPs.length)];
      const port = commonPorts[Math.floor(Math.random() * commonPorts.length)];
      const proto = protocols[Math.floor(Math.random() * protocols.length)];

      const evaluation = evaluateTrafficClient(ip, port, proto, db.rules, db.active);

      newLogs.push({
        id: `log_gen_${Date.now()}_${i}`,
        source_ip: ip,
        destination_port: port,
        protocol: proto,
        decision: evaluation.decision,
        matched_rule: evaluation.matched_rule,
        timestamp: new Date(Date.now() - Math.floor(Math.random() * 3 * 3600 * 1000)).toISOString()
      });
    }

    db.logs = [...newLogs, ...db.logs];
    saveLocalDB(db);
    return true;
  }
}

export async function resetDatabase(): Promise<boolean> {
  try {
    const res = await apiFetch("/api/reset", { method: "POST" });
    return res.success;
  } catch (err) {
    const initialDB: LocalDB = {
      active: true,
      rules: DEFAULT_RULES,
      logs: generateSeededLogs(7, 10)
    };
    saveLocalDB(initialDB);
    return true;
  }
}

export async function getAnalyticsStats(): Promise<AnalyticsStats> {
  try {
    return await apiFetch("/api/analytics/stats");
  } catch (err) {
    const db = getLocalDB();
    const logs = db.logs;

    const allowedCount = logs.filter(l => l.decision === "Allowed").length;
    const blockedCount = logs.filter(l => l.decision === "Blocked").length;

    const blockedPortsMap: Record<string, number> = {};
    logs.filter(l => l.decision === "Blocked").forEach(l => {
      blockedPortsMap[l.destination_port] = (blockedPortsMap[l.destination_port] || 0) + 1;
    });
    const blockedPorts = Object.entries(blockedPortsMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([port, count]) => ({ port, count }));

    const blockedIPsMap: Record<string, number> = {};
    logs.filter(l => l.decision === "Blocked").forEach(l => {
      blockedIPsMap[l.source_ip] = (blockedIPsMap[l.source_ip] || 0) + 1;
    });
    const blockedIPs = Object.entries(blockedIPsMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([ip, count]) => ({ ip, count }));

    const dailyTrends: Record<string, { DateLabel: string; dateKey: string; Allowed: number; Blocked: number }> = {};
    for (let d = 6; d >= 0; d--) {
      const day = new Date(Date.now() - d * 24 * 3600 * 1000);
      const dateKey = day.toISOString().split("T")[0];
      const dateFormatted = day.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      dailyTrends[dateKey] = { DateLabel: dateFormatted, dateKey, Allowed: 0, Blocked: 0 };
    }

    logs.forEach(l => {
      const dateKey = l.timestamp.split("T")[0];
      if (dailyTrends[dateKey]) {
        if (l.decision === "Allowed") {
          dailyTrends[dateKey].Allowed++;
        } else {
          dailyTrends[dateKey].Blocked++;
        }
      }
    });

    const dailyTraffic = Object.values(dailyTrends).sort((a, b) => a.dateKey.localeCompare(b.dateKey));

    return {
      allowed: allowedCount,
      blocked: blockedCount,
      blockedPorts,
      blockedIPs,
      dailyTraffic
    };
  }
}
