export type Severity = "critical" | "high" | "medium" | "low";
export type AlertStatus = "new" | "investigating" | "contained" | "closed";

export interface Analyst {
  id: string;
  name: string;
  initials: string;
  color: string;
}

export interface Alert {
  id: string;
  title: string;
  severity: Severity;
  status: AlertStatus;
  source: string;
  asset: string;
  user: string;
  tactic: string;
  occurredAt: string;
  assigneeId?: string;
  description: string;
}

export interface EvidenceEvent {
  id: string;
  time: string;
  title: string;
  detail: string;
  type: "detection" | "identity" | "endpoint" | "network";
}

export interface IncidentNote {
  id: string;
  alertId: string;
  author: string;
  createdAt: string;
  text: string;
}

export interface Asset {
  id: string;
  name: string;
  type: string;
  owner: string;
  risk: Severity;
  exposure: string;
  incidents: number;
}
