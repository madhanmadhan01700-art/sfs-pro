import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";

const app = express();
const PORT = 3000;
const DB_FILE = path.join(process.cwd(), "db.json");

// Middleware
app.use(express.json());

// Type interfaces
interface Rule {
  id: string;
  name: string;
  source_ip: string; // "Any" or custom IP (e.g., "192.168.1.12")
  port: string;      // "Any" or positive integer (e.g., "80")
  protocol: string;  // "TCP", "UDP", "Any"
  action: string;    // "Allow", "Block"
  description: string;
  created_at: string;
}

interface TrafficLog {
  id: string;
  source_ip: string;
  destination_port: string;
  protocol: string;
  decision: "Allowed" | "Blocked";
  matched_rule: string;
  timestamp: string;
}

interface DBStructure {
  active: boolean;
  rules: Rule[];
  logs: TrafficLog[];
}

// Default Rule Seed
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

// Seed Logs Helper to generate rich visual representations on start
function generateSeededLogs(daysCount = 7, logsPerDay = 15): TrafficLog[] {
  const logs: TrafficLog[] = [];
  const testIPs = [
    "192.168.1.15", "10.0.0.8", "198.51.100.42", "185.220.101.5", 
    "8.8.8.8", "172.16.54.21", "192.168.1.102", "109.244.12.3", "45.138.22.4"
  ];
  const commonPorts = ["80", "443", "22", "53", "21", "3306", "8080"];
  const protocols = ["TCP", "UDP"];

  let baseTime = Date.now() - daysCount * 24 * 3600 * 1000;

  for (let i = 0; i < daysCount * logsPerDay; i++) {
    const elapsed = (i / (daysCount * logsPerDay)) * daysCount * 24 * 3600 * 1000;
    const itemTime = new Date(baseTime + elapsed);

    // Pick features
    const source_ip = testIPs[Math.floor(Math.random() * testIPs.length)];
    const destination_port = commonPorts[Math.floor(Math.random() * commonPorts.length)];
    const protocol = protocols[Math.floor(Math.random() * protocols.length)];

    // Evaluate against default rules to make logs logical
    let decision: "Allowed" | "Blocked" = "Allowed";
    let matched_rule = "Default Policy";

    // 1. Check Blocks
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

    // 2. Check Allows if not blocked
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

// Local Database initialization
function readDB(): DBStructure {
  try {
    if (!fs.existsSync(DB_FILE)) {
      const initialDB: DBStructure = {
        active: true,
        rules: DEFAULT_RULES,
        logs: generateSeededLogs(7, 10)
      };
      fs.writeFileSync(DB_FILE, JSON.stringify(initialDB, null, 2), "utf8");
      return initialDB;
    }
    const raw = fs.readFileSync(DB_FILE, "utf8");
    return JSON.parse(raw);
  } catch (error) {
    console.error("Error reading db file, regenerating fallback:", error);
    return {
      active: true,
      rules: DEFAULT_RULES,
      logs: []
    };
  }
}

function writeDB(data: DBStructure) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf8");
  } catch (err) {
    console.error("Error writing db.json file:", err);
  }
}

// Rule Engine Evaluator
function evaluateTraffic(
  ip: string, 
  port: string, 
  protocol: string, 
  rules: Rule[], 
  status: boolean
): { decision: "Allowed" | "Blocked"; matched_rule: string } {
  if (!status) {
    return { decision: "Allowed", matched_rule: "Firewall Disabled" };
  }

  // Iterate Block rules first
  for (const rule of rules.filter(r => r.action === "Block")) {
    const ipMatch = rule.source_ip === "Any" || rule.source_ip.trim() === ip.trim();
    const portMatch = rule.port === "Any" || rule.port.toString().trim() === port.trim();
    const protoMatch = rule.protocol === "Any" || rule.protocol.toUpperCase().trim() === protocol.toUpperCase().trim();

    if (ipMatch && portMatch && protoMatch) {
      return { decision: "Blocked", matched_rule: rule.name };
    }
  }

  // Iterate Allow rules
  for (const rule of rules.filter(r => r.action === "Allow")) {
    const ipMatch = rule.source_ip === "Any" || rule.source_ip.trim() === ip.trim();
    const portMatch = rule.port === "Any" || rule.port.toString().trim() === port.trim();
    const protoMatch = rule.protocol === "Any" || rule.protocol.toUpperCase().trim() === protocol.toUpperCase().trim();

    if (ipMatch && portMatch && protoMatch) {
      return { decision: "Allowed", matched_rule: rule.name };
    }
  }

  // Default Policy remains: Allowed on default
  return { decision: "Allowed", matched_rule: "Default Policy (Allow)" };
}

// ============================================
// API Endpoints
// ============================================

// 1. Get entire state summary (statistics mapping)
app.get("/api/dashboard-summary", (req, res) => {
  const dbData = readDB();
  const total = dbData.logs.length;
  const allowed = dbData.logs.filter(l => l.decision === "Allowed").length;
  const blocked = dbData.logs.filter(l => l.decision === "Blocked").length;
  const rulesCount = dbData.rules.length;
  const recentLogs = dbData.logs.slice(0, 10); // recent 10 records for display

  res.json({
    status: dbData.active,
    total,
    allowed,
    blocked,
    rulesCount,
    recentLogs
  });
});

// 2. Toggle firewall status
app.post("/api/status/toggle", (req, res) => {
  const dbData = readDB();
  dbData.active = !dbData.active;
  writeDB(dbData);
  res.json({ active: dbData.active });
});

// 3. Get all rules
app.get("/api/rules", (req, res) => {
  const dbData = readDB();
  res.json(dbData.rules);
});

// 4. Add a rule
app.post("/api/rules", (req, res) => {
  const { name, source_ip, port, protocol, action, description } = req.body;

  if (!name || !source_ip || !port || !protocol || !action) {
    return res.status(400).json({ error: "Missing required rule parameters" });
  }

  const dbData = readDB();
  const newRule: Rule = {
    id: `rule_${Date.now()}`,
    name,
    source_ip: source_ip.trim(),
    port: port.toString().trim(),
    protocol,
    action,
    description: description || "",
    created_at: new Date().toISOString()
  };

  dbData.rules.push(newRule);
  writeDB(dbData);
  res.json({ success: true, rule: newRule });
});

// 5. Delete a rule
app.delete("/api/rules/:id", (req, res) => {
  const { id } = req.params;
  const dbData = readDB();
  const index = dbData.rules.findIndex(r => r.id === id);

  if (index === -1) {
    return res.status(404).json({ error: "Rule not found" });
  }

  dbData.rules.splice(index, 1);
  writeDB(dbData);
  res.json({ success: true });
});

// 6. Packet simulator
app.post("/api/simulate", (req, res) => {
  const { source_ip, destination_port, protocol } = req.body;

  if (!source_ip || !destination_port || !protocol) {
    return res.status(400).json({ error: "Missing packet parameters" });
  }

  const dbData = readDB();
  const evaluation = evaluateTraffic(
    source_ip, 
    destination_port.toString(), 
    protocol, 
    dbData.rules, 
    dbData.active
  );

  const newLog: TrafficLog = {
    id: `log_${Date.now()}`,
    source_ip,
    destination_port: destination_port.toString(),
    protocol,
    decision: evaluation.decision,
    matched_rule: evaluation.matched_rule,
    timestamp: new Date().toISOString()
  };

  dbData.logs.unshift(newLog); // Prepend to show immediately in UI
  writeDB(dbData);

  res.json({ 
    success: true, 
    decision: newLog.decision, 
    matched_rule: newLog.matched_rule, 
    log: newLog 
  });
});

// 7. Get logs with filters
app.get("/api/logs", (req, res) => {
  const dbData = readDB();
  const { search, decision, protocol, date } = req.query;
  let filtered = [...dbData.logs];

  if (search) {
    const q = (search as string).toLowerCase();
    filtered = filtered.filter(l => 
      l.source_ip.toLowerCase().includes(q) || 
      l.destination_port.includes(q) || 
      l.matched_rule.toLowerCase().includes(q)
    );
  }

  if (decision && decision !== "All") {
    filtered = filtered.filter(l => l.decision === decision);
  }

  if (protocol && protocol !== "All") {
    filtered = filtered.filter(l => l.protocol.toUpperCase() === (protocol as string).toUpperCase());
  }

  if (date) {
    filtered = filtered.filter(l => l.timestamp.startsWith(date as string));
  }

  res.json(filtered);
});

// 8. Generate random mock traffic
app.post("/api/generate-traffic", (req, res) => {
  const dbData = readDB();
  const testIPs = [
    "192.168.1.25", "10.0.0.15", "198.51.100.42", "185.220.101.5", 
    "8.8.8.8", "172.16.54.21", "192.168.1.102", "109.244.12.3", "45.138.22.4",
    "192.168.1.15", "185.244.15.6", "172.16.101.44"
  ];
  const commonPorts = ["80", "443", "22", "53", "21", "3306", "8080", "23", "445"];
  const protocols = ["TCP", "UDP"];

  const count = parseInt(req.body.count || "10", 10);
  const newLogs: TrafficLog[] = [];

  for (let i = 0; i < count; i++) {
    const ip = testIPs[Math.floor(Math.random() * testIPs.length)];
    const port = commonPorts[Math.floor(Math.random() * commonPorts.length)];
    const proto = protocols[Math.floor(Math.random() * protocols.length)];

    const evaluation = evaluateTraffic(ip, port, proto, dbData.rules, dbData.active);

    newLogs.push({
      id: `log_gen_${Date.now()}_${i}`,
      source_ip: ip,
      destination_port: port,
      protocol: proto,
      decision: evaluation.decision,
      matched_rule: evaluation.matched_rule,
      timestamp: new Date(Date.now() - Math.floor(Math.random() * 3 * 3600 * 1000)).toISOString() // skew within last 3 hours
    });
  }

  dbData.logs = [...newLogs, ...dbData.logs];
  writeDB(dbData);
  res.json({ success: true, count: newLogs.length });
});

// 9. Export logs to CSV
app.get("/api/logs/export", (req, res) => {
  const dbData = readDB();
  let csvContent = "ID,Timestamp,Source IP,Destination Port,Protocol,Decision,Matched Rule\n";
  
  dbData.logs.forEach(l => {
    // Escape characters in rule names
    const rule = l.matched_rule.replace(/"/g, '""');
    csvContent += `"${l.id}","${l.timestamp}","${l.source_ip}","${l.destination_port}","${l.protocol}","${l.decision}","${rule}"\n`;
  });

  res.setHeader("Content-Disposition", "attachment; filename=firewall_logs.csv");
  res.setHeader("Content-Type", "text/csv");
  res.status(200).send(csvContent);
});

// 10. Analytics stats data
app.get("/api/analytics/stats", (req, res) => {
  const dbData = readDB();
  const logs = dbData.logs;

  // 1. Allowed vs Blocked count
  const allowedCount = logs.filter(l => l.decision === "Allowed").length;
  const blockedCount = logs.filter(l => l.decision === "Blocked").length;

  // 2. Most Blocked Ports
  const blockedPortsMap: Record<string, number> = {};
  logs.filter(l => l.decision === "Blocked").forEach(l => {
    blockedPortsMap[l.destination_port] = (blockedPortsMap[l.destination_port] || 0) + 1;
  });
  const blockedPorts = Object.entries(blockedPortsMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([port, count]) => ({ port, count }));

  // 3. Most Blocked IPs
  const blockedIPsMap: Record<string, number> = {};
  logs.filter(l => l.decision === "Blocked").forEach(l => {
    blockedIPsMap[l.source_ip] = (blockedIPsMap[l.source_ip] || 0) + 1;
  });
  const blockedIPs = Object.entries(blockedIPsMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([ip, count]) => ({ ip, count }));

  // 4. Daily traffic activity trends over last 7 days
  const dailyTrends: Record<string, { DateLabel: string; dateKey: string; Allowed: number; Blocked: number }> = {};
  // Generate placeholders for the last 7 days
  for (let d = 6; d >= 0; d--) {
    const day = new Date(Date.now() - d * 24 * 3600 * 1000);
    const dateKey = day.toISOString().split("T")[0]; // YYYY-MM-DD
    const dateFormatted = day.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    dailyTrends[dateKey] = { DateLabel: dateFormatted, dateKey, Allowed: 0, Blocked: 0 };
  }

  // Count metrics
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

  res.json({
    allowed: allowedCount,
    blocked: blockedCount,
    blockedPorts,
    blockedIPs,
    dailyTraffic
  });
});

// 11. Reset database route
app.post("/api/reset", (req, res) => {
  const initialDB: DBStructure = {
    active: true,
    rules: DEFAULT_RULES,
    logs: generateSeededLogs(7, 10)
  };
  writeDB(initialDB);
  res.json({ success: true });
});


// ============================================
// Vite Middleware Setup / Static Asset Serving
// ============================================
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    // Mount Vite dev server HTML middleware
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server is booting! Listening on http://localhost:${PORT}`);
  });
}

startServer();
