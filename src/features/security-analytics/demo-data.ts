import { Alert, Analyst, Asset, EvidenceEvent, IncidentNote } from "./types";

export const analysts: Analyst[] = [
  { id: "ava", name: "Ava Chen", initials: "AC", color: "bg-cyan-500" },
  { id: "miles", name: "Miles Carter", initials: "MC", color: "bg-violet-500" },
  { id: "sofia", name: "Sofia Patel", initials: "SP", color: "bg-emerald-500" },
];

export const demoAlerts: Alert[] = [
  { id: "ALT-2841", title: "Suspicious PowerShell execution", severity: "critical", status: "investigating", source: "Microsoft Defender", asset: "FIN-WS-042", user: "n.morris", tactic: "Execution", occurredAt: "8 min ago", assigneeId: "ava", description: "Encoded PowerShell launched from an unsigned attachment and reached a credential-access command." },
  { id: "ALT-2840", title: "Impossible travel detected", severity: "high", status: "new", source: "Okta", asset: "Identity", user: "c.hughes", tactic: "Initial Access", occurredAt: "16 min ago", description: "Sign-ins from Singapore and Frankfurt occurred within a 19 minute window." },
  { id: "ALT-2839", title: "Unusual outbound data transfer", severity: "high", status: "new", source: "Cloudflare", asset: "api-prod-03", user: "service-api", tactic: "Exfiltration", occurredAt: "31 min ago", description: "Outbound transfer volume exceeded the service baseline by 4.2×." },
  { id: "ALT-2838", title: "New privileged role assignment", severity: "medium", status: "investigating", source: "AWS CloudTrail", asset: "prod-aws", user: "r.khan", tactic: "Privilege Escalation", occurredAt: "45 min ago", assigneeId: "miles", description: "A temporary IAM role received administrator permissions outside the approved change window." },
  { id: "ALT-2837", title: "Known malicious hash blocked", severity: "low", status: "closed", source: "CrowdStrike", asset: "MKT-MBP-17", user: "l.garcia", tactic: "Defense Evasion", occurredAt: "1 hr ago", description: "Endpoint protection blocked a file matching an intelligence feed indicator." },
  { id: "ALT-2836", title: "Dormant account reactivated", severity: "medium", status: "new", source: "Okta", asset: "Identity", user: "a.owens", tactic: "Persistence", occurredAt: "2 hrs ago", description: "An account inactive for 94 days authenticated from a new device." },
];

export const evidence: EvidenceEvent[] = [
  { id: "e1", time: "09:42:18", title: "Encoded command launched", detail: "powershell.exe -enc JAB... initiated by OUTLOOK.EXE", type: "detection" },
  { id: "e2", time: "09:42:25", title: "Credential access technique observed", detail: "LSASS memory access blocked on FIN-WS-042", type: "endpoint" },
  { id: "e3", time: "09:43:01", title: "New external connection", detail: "TLS connection to 185.220.101.45 flagged by threat intelligence", type: "network" },
  { id: "e4", time: "09:44:12", title: "User risk elevated", detail: "n.morris sign-in risk changed from low to high", type: "identity" },
];

export const initialNotes: IncidentNote[] = [
  { id: "n1", alertId: "ALT-2841", author: "Ava Chen", createdAt: "09:47", text: "Attachment appears to be a targeted invoice lure. Reviewing endpoint isolation and user sessions." },
];

export const assets: Asset[] = [
  { id: "a1", name: "FIN-WS-042", type: "Windows endpoint", owner: "Finance", risk: "critical", exposure: "Internet reachable", incidents: 1 },
  { id: "a2", name: "api-prod-03", type: "Kubernetes workload", owner: "Platform", risk: "high", exposure: "Production", incidents: 1 },
  { id: "a3", name: "prod-aws", type: "Cloud account", owner: "Infrastructure", risk: "medium", exposure: "Production", incidents: 1 },
  { id: "a4", name: "MKT-MBP-17", type: "macOS endpoint", owner: "Marketing", risk: "low", exposure: "Managed", incidents: 0 },
];
