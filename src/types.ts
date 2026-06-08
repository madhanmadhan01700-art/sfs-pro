export interface Rule {
  id: string;
  name: string;
  source_ip: string; // "Any" or custom IP (e.g., "192.168.1.12")
  port: string;      // "Any" or positive integer (e.g., "80")
  protocol: string;  // "TCP", "UDP", "Any"
  action: string;    // "Allow", "Block"
  description: string;
  created_at: string;
}

export interface TrafficLog {
  id: string;
  source_ip: string;
  destination_port: string;
  protocol: string;
  decision: "Allowed" | "Blocked";
  matched_rule: string;
  timestamp: string;
}

export interface DashboardSummary {
  status: boolean;
  total: number;
  allowed: number;
  blocked: number;
  rulesCount: number;
  recentLogs: TrafficLog[];
}

export interface BlockedPort {
  port: string;
  count: number;
}

export interface BlockedIP {
  ip: string;
  count: number;
}

export interface DailyTrafficTrend {
  DateLabel: string;
  dateKey: string;
  Allowed: number;
  Blocked: number;
}

export interface AnalyticsStats {
  allowed: number;
  blocked: number;
  blockedPorts: BlockedPort[];
  blockedIPs: BlockedIP[];
  dailyTraffic: DailyTrafficTrend[];
}
