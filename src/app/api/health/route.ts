import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.json({ service: "security-analytics-platform", status: "ok" });
}
