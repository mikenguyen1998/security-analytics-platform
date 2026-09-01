import { SecurityAnalyticsApp } from "@/features/security-analytics/security-analytics-app";

export const metadata = {
  title: "Security Analytics Platform",
  description: "Interactive SOC incident triage portfolio demo.",
};

export default function SecurityAnalyticsPage() {
  return <SecurityAnalyticsApp />;
}
