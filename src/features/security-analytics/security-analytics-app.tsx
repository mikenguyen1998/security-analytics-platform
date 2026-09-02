"use client";

import { startTransition, useEffect, useMemo, useRef, useState } from "react";
import { Bell, CheckCircle2, ChevronRight, CircleAlert, FileSearch, LayoutDashboard, Menu, Monitor, RefreshCcw, Search, ShieldAlert, ShieldCheck, UserRound, WifiOff, X, type LucideIcon } from "lucide-react";
import { analysts, assets, demoAlerts, evidence, initialNotes } from "./demo-data";
import { Alert, AlertStatus, IncidentNote, Severity } from "./types";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";

const severityClasses: Record<Severity, string> = { critical: "bg-rose-500/15 text-rose-300 ring-rose-400/30", high: "bg-orange-500/15 text-orange-300 ring-orange-400/30", medium: "bg-amber-500/15 text-amber-300 ring-amber-400/30", low: "bg-cyan-500/15 text-cyan-300 ring-cyan-400/30" };
const statusClasses: Record<AlertStatus, string> = { new: "text-sky-300", investigating: "text-amber-300", contained: "text-emerald-300", closed: "text-slate-400" };
const nav = [{ id: "overview", label: "Overview", icon: LayoutDashboard }, { id: "alerts", label: "Alerts", icon: ShieldAlert }, { id: "incidents", label: "Incidents", icon: FileSearch }, { id: "assets", label: "Assets", icon: Monitor }];
type SyncStatus = "local" | "syncing" | "synced" | "error";
type AlertUpdateRecord = { alert_id: string; status: AlertStatus | null; assignee_id: string | null };
type NoteRecord = { id: string; alert_id: string; author: string; body: string; created_at: string };
type ActionRecord = { alert_id: string };
function storedDemoState() {
  if (typeof window === "undefined") return {};
  try { return JSON.parse(window.localStorage.getItem("sentinel-arc-demo") ?? "{}") as { alerts?: Alert[]; notes?: IncidentNote[]; contained?: boolean }; }
  catch { return {}; }
}

function Badge({ severity }: { severity: Severity }) { return <span className={`inline-flex items-center justify-center rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ring-1 ${severityClasses[severity]}`}>{severity}</span>; }
function SyncBadge({ status }: { status: SyncStatus }) {
  const content = status === "synced" ? ["bg-emerald-400", "Saved"] : status === "syncing" ? ["bg-amber-400 animate-pulse", "Saving"] : status === "error" ? ["bg-rose-400", "Offline"] : ["bg-slate-500", "Local demo"];
  return <span className="hidden items-center gap-1.5 text-xs text-slate-400 sm:flex" title={status === "error" ? "Changes are still stored in this browser." : undefined}><span className={`size-1.5 rounded-full ${content[0]}`}/>{status === "error" && <WifiOff size={13}/>} {content[1]}</span>;
}

export function SecurityAnalyticsApp() {
  const [screen, setScreen] = useState("overview");
  const [alertList, setAlertList] = useState(demoAlerts);
  const [selectedId, setSelectedId] = useState(demoAlerts[0].id);
  const [query, setQuery] = useState("");
  const [severity, setSeverity] = useState<Severity | "all">("all");
  const [notes, setNotes] = useState<IncidentNote[]>(initialNotes);
  const [note, setNote] = useState("");
  const [hydrated, setHydrated] = useState(false);
  const [toast, setToast] = useState("");
  const [syncStatus, setSyncStatus] = useState<SyncStatus>("local");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [onboardingDismissed, setOnboardingDismissed] = useState(false);
  const selected = alertList.find((alert) => alert.id === selectedId) ?? alertList[0];
  const filtered = useMemo(() => alertList.filter((alert) => (severity === "all" || alert.severity === severity) && `${alert.title} ${alert.asset} ${alert.user}`.toLowerCase().includes(query.toLowerCase())), [alertList, query, severity]);
  const activeCount = alertList.filter((a) => a.status !== "closed" && a.status !== "contained").length;
  const supabase = useRef<ReturnType<typeof getSupabaseBrowserClient>>(null);
  useEffect(() => {
    const saved = storedDemoState();
    startTransition(() => {
      if (saved.alerts) setAlertList(saved.alerts);
      if (saved.notes) setNotes(saved.notes);
      if (saved.contained) setAlertList((current) => current.map((alert) => alert.id === demoAlerts[0].id ? { ...alert, status: "contained" } : alert));
      if (window.localStorage.getItem("sentinel-arc-onboarding-dismissed") === "true") setOnboardingDismissed(true);
      setHydrated(true);
    });
  }, []);
  useEffect(() => {
    const client = getSupabaseBrowserClient();
    if (!client) return;
    supabase.current = client;
    void (async () => {
      const { data } = await client.auth.getSession();
      const session = data.session ?? (await client.auth.signInAnonymously()).data.session;
      if (!session) {
        setSyncStatus("error");
        return;
      }
      setSyncStatus("syncing");
      const [updates, savedNotes, actions] = await Promise.all([
        client.from("security_alert_updates").select("alert_id,status,assignee_id"),
        client.from("security_incident_notes").select("id,author,body,created_at").order("created_at", { ascending: true }),
        client.from("security_incident_actions").select("alert_id").eq("action", "contain"),
      ]);
      if (updates.error || savedNotes.error || actions.error) {
        setSyncStatus("error");
        return;
      }
      const updateByAlert = new Map((updates.data as AlertUpdateRecord[]).map((item) => [item.alert_id, item]));
      const containedAlerts = new Set((actions.data as ActionRecord[]).map((item) => item.alert_id));
      startTransition(() => {
        setAlertList((current) => current.map((alert) => {
          const update = updateByAlert.get(alert.id);
          return { ...alert, status: containedAlerts.has(alert.id) ? "contained" : update?.status ?? alert.status, assigneeId: update?.assignee_id ?? alert.assigneeId };
        }));
        setNotes([...initialNotes, ...(savedNotes.data as NoteRecord[]).map((item) => ({ id: item.id, alertId: item.alert_id, author: item.author, text: item.body, createdAt: new Date(item.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) }))]);
        setSyncStatus("synced");
      });
    })();
  }, []);
  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem("sentinel-arc-demo", JSON.stringify({ alerts: alertList, notes }));
  }, [alertList, notes, hydrated]);
  const announce = (message: string) => { setToast(message); window.setTimeout(() => setToast(""), 3200); };
  const persist = async (body: { type: string; alertId: string; changes?: Partial<Alert>; note?: IncidentNote }) => {
    const client = supabase.current;
    if (!client) return;
    setSyncStatus("syncing");
    const result = body.type === "alert-update"
      ? await client.from("security_alert_updates").upsert({ alert_id: body.alertId, status: body.changes?.status, assignee_id: body.changes?.assigneeId }, { onConflict: "owner_id,alert_id" })
      : body.type === "note" && body.note
        ? await client.from("security_incident_notes").insert({ alert_id: body.alertId, author: body.note.author, body: body.note.text })
        : await client.from("security_incident_actions").insert({ alert_id: body.alertId, action: "contain" });
    setSyncStatus(result.error ? "error" : "synced");
  };
  const updateSelected = (changes: Partial<Alert>) => { setAlertList((current) => current.map((item) => item.id === selected.id ? { ...item, ...changes } : item)); void persist({ type: "alert-update", alertId: selected.id, changes }); };
  const addNote = () => { if (!note.trim()) return; const newNote = { id: crypto.randomUUID(), alertId: selected.id, author: "Guest analyst", createdAt: "Now", text: note.trim() }; setNotes((current) => [...current, newNote]); void persist({ type: "note", alertId: selected.id, note: newNote }); setNote(""); announce("Note added to incident"); };
  const contain = () => { updateSelected({ status: "contained" }); void persist({ type: "contain", alertId: selected.id }); announce("Host isolation queued — demo action recorded"); };
  const resetWorkspace = async () => {
    if (!window.confirm("Reset your demo workspace? This clears saved notes and actions.")) return;
    const client = supabase.current;
    if (client) {
      setSyncStatus("syncing");
      const { data } = await client.auth.getUser();
      if (data.user) {
        const [updates, savedNotes, actions] = await Promise.all([
          client.from("security_alert_updates").delete().eq("owner_id", data.user.id),
          client.from("security_incident_notes").delete().eq("owner_id", data.user.id),
          client.from("security_incident_actions").delete().eq("owner_id", data.user.id),
        ]);
        setSyncStatus(updates.error || savedNotes.error || actions.error ? "error" : "synced");
      }
    }
    window.localStorage.removeItem("sentinel-arc-demo");
    setAlertList(demoAlerts); setNotes(initialNotes); setSelectedId(demoAlerts[0].id); setScreen("overview");
    announce("Demo workspace reset");
  };
  const dismissOnboarding = () => { window.localStorage.setItem("sentinel-arc-onboarding-dismissed", "true"); setOnboardingDismissed(true); };

  return <div className="app-surface min-h-screen selection:bg-cyan-400/30">
    <aside className="fixed inset-y-0 left-0 z-20 hidden w-64 border-r border-white/10 bg-[#081524] p-5 lg:block">
      <div className="mb-11 flex items-center gap-3 px-2"><div className="grid size-9 place-items-center rounded-xl bg-cyan-400 text-[#07111f]"><ShieldCheck size={21} strokeWidth={2.6} /></div><div><p className="font-semibold tracking-tight">Sentinel Arc</p><p className="text-xs text-slate-500">Security Operations</p></div></div>
      <nav className="space-y-1">{nav.map(({ id, label, icon: Icon }) => <button key={id} onClick={() => setScreen(id)} className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition ${screen === id ? "bg-cyan-400/10 text-cyan-300" : "text-slate-400 hover:bg-white/5 hover:text-slate-100"}`}><Icon size={18} />{label}{id === "alerts" && <span className="ml-auto rounded-full bg-rose-400/15 px-2 py-0.5 text-xs text-rose-300">{activeCount}</span>}</button>)}</nav>
      <div className="absolute bottom-6 left-5 right-5 rounded-xl border border-cyan-300/10 bg-cyan-300/5 p-4"><p className="text-xs font-semibold text-cyan-300">DEMO WORKSPACE</p><p className="mt-1 text-xs leading-relaxed text-slate-400">Fictional data. Your changes are private to this guest workspace.</p><button onClick={() => void resetWorkspace()} className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-slate-300 hover:text-white"><RefreshCcw size={13}/>Reset demo</button></div>
    </aside>
    <main className="lg:pl-64"><header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-white/10 bg-[#07111f]/90 px-5 backdrop-blur lg:px-8"><div className="flex items-center gap-3"><button onClick={() => setMobileMenuOpen((open) => !open)} className="rounded-md p-2 text-slate-300 hover:bg-white/5 lg:hidden" aria-label="Toggle navigation">{mobileMenuOpen ? <X size={20}/> : <Menu size={20}/>}</button><div><p className="text-xs font-medium uppercase tracking-[0.18em] text-cyan-300">Northstar Holdings</p><p className="text-xs text-slate-500">Production environment</p></div></div><div className="flex items-center gap-4"><SyncBadge status={syncStatus}/><button className="relative text-slate-400 hover:text-white" aria-label="Notifications"><Bell size={19}/><span className="absolute right-0 top-0 size-1.5 rounded-full bg-rose-400" /></button><div className="flex size-8 items-center justify-center rounded-full bg-violet-500 text-xs font-bold">GA</div></div></header>
      {mobileMenuOpen && <nav className="sticky top-16 z-10 border-b border-white/10 bg-[#081524] p-3 lg:hidden">{nav.map(({ id, label, icon: Icon }) => <button key={id} onClick={() => { setScreen(id); setMobileMenuOpen(false); }} className={`flex w-full items-center gap-3 rounded-lg px-3 py-3 text-sm ${screen === id ? "bg-cyan-400/10 text-cyan-300" : "text-slate-400"}`}><Icon size={18}/>{label}{id === "alerts" && <span className="ml-auto text-xs text-rose-300">{activeCount}</span>}</button>)}<button onClick={() => void resetWorkspace()} className="mt-2 flex w-full items-center gap-3 rounded-lg px-3 py-3 text-sm text-slate-400"><RefreshCcw size={18}/>Reset demo workspace</button></nav>}
      <div className="mx-auto max-w-[1600px] p-5 lg:p-8">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4"><div><p className="mb-1 text-sm text-slate-500">Security posture / <span className="text-slate-300">{screen}</span></p><h1 className="app-title font-semibold leading-tight">{screen === "overview" ? "Threat overview" : screen === "assets" ? "Asset exposure" : screen === "incidents" ? "Active incidents" : "Alert investigation"}</h1></div><div className="flex items-center gap-2 text-sm text-slate-400"><span className="size-2 rounded-full bg-emerald-400" />Telemetry healthy <span className="ml-2 text-slate-600">Updated just now</span></div></div>
        {!onboardingDismissed && <section className="mb-6 rounded-xl border border-cyan-400/20 bg-cyan-400/[.06] p-5"><div className="flex items-start justify-between gap-5"><div><p className="text-sm font-semibold text-cyan-200">Welcome to the SOC analyst demo</p><p className="mt-1 max-w-3xl text-sm leading-6 text-slate-300">Start in Alerts, select a high-severity signal, review the evidence timeline, assign an analyst, leave a note, then contain the affected host. All telemetry is fictional.</p></div><button onClick={dismissOnboarding} className="shrink-0 text-xs font-medium text-cyan-200 hover:text-white">Got it</button></div></section>}
        {screen === "overview" && <Overview alerts={alertList} onOpen={() => setScreen("alerts")} />}
        {screen === "assets" && <Assets />}
        {(screen === "alerts" || screen === "incidents") && <section className="grid min-h-[660px] overflow-hidden rounded-2xl border border-white/10 bg-[#0a192b] xl:grid-cols-[minmax(420px,0.92fr)_minmax(500px,1.3fr)]"><AlertQueue alerts={screen === "incidents" ? filtered.filter((a) => a.status === "investigating" || a.status === "contained") : filtered} selected={selectedId} query={query} severity={severity} setQuery={setQuery} setSeverity={setSeverity} onSelect={setSelectedId} /><IncidentDetail alert={selected} notes={notes.filter((item) => item.alertId === selected.id)} note={note} setNote={setNote} onAddNote={addNote} onAssign={(id) => { updateSelected({ assigneeId: id }); announce("Incident owner updated"); }} onContain={contain} contained={selected.status === "contained"} /></section>}
      </div>
    </main>
    <div className="fixed bottom-4 right-4 z-30 flex flex-col gap-2" aria-live="polite">{toast && <div className="rounded-lg border border-emerald-400/25 bg-[#10273a] px-4 py-3 text-sm text-emerald-200 shadow-2xl">{toast}</div>}</div>
  </div>;
}

function Overview({ alerts, onOpen }: { alerts: Alert[]; onOpen: () => void }) { const critical = alerts.filter((a) => a.severity === "critical" && a.status !== "contained").length; const cards: { label: string; value: number; color: string; Icon: LucideIcon }[] = [{ label: "Open alerts", value: alerts.filter((a) => a.status === "new").length, color: "text-sky-300", Icon: Bell }, { label: "Critical risk", value: critical, color: "text-rose-300", Icon: CircleAlert }, { label: "Investigations", value: alerts.filter((a) => a.status === "investigating").length, color: "text-amber-300", Icon: FileSearch }, { label: "Contained today", value: alerts.filter((a) => a.status === "contained").length + 12, color: "text-emerald-300", Icon: ShieldCheck }]; return <><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{cards.map(({ label, value, color, Icon }) => <div key={label} className="rounded-xl border border-white/10 bg-[#0a192b] p-5"><div className="flex items-center justify-between text-slate-500"><span className="text-[15px]">{label}</span><Icon size={19} /></div><p className={`mt-4 text-[2rem] font-semibold leading-none ${color}`}>{value}</p><p className="mt-2 text-[13px] text-slate-500">vs. previous 24 hours</p></div>)}</div><div className="mt-5 grid gap-5 xl:grid-cols-[1.35fr_0.9fr]"><section className="rounded-xl border border-white/10 bg-[#0a192b] p-5"><div className="flex items-center justify-between"><div><h2 className="text-[15px] font-semibold">Detection activity</h2><p className="mt-1 text-[13px] text-slate-500">Last 24 hours · 154 signals processed</p></div><button onClick={onOpen} className="text-sm font-medium text-cyan-300 hover:text-cyan-200">View alerts <ChevronRight className="inline" size={15}/></button></div><div className="mt-8 flex h-44 items-end gap-2">{[34, 22, 46, 31, 72, 43, 59, 92, 67, 51, 80, 48, 61, 34, 56, 78, 44, 28].map((height, index) => <div key={index} className={`flex-1 rounded-t-sm ${height > 75 ? "bg-rose-400" : height > 55 ? "bg-amber-400" : "bg-cyan-400/65"}`} style={{ height: `${height}%` }} />)}</div></section><section className="rounded-xl border border-white/10 bg-[#0a192b] p-5"><h2 className="text-[15px] font-semibold">Top tactics</h2><div className="mt-6 space-y-5">{[["Execution", 38, "bg-rose-400"], ["Initial access", 26, "bg-orange-400"], ["Privilege escalation", 18, "bg-amber-400"], ["Exfiltration", 12, "bg-cyan-400"]].map(([label, width, color]) => <div key={String(label)}><div className="mb-2 flex justify-between text-sm text-slate-400"><span>{label}</span><span>{width}%</span></div><div className="h-1.5 overflow-hidden rounded-full bg-white/5"><div className={`${color} h-full rounded-full`} style={{ width: `${width}%` }}/></div></div>)}</div></section></div><section className="mt-5 rounded-xl border border-white/10 bg-[#0a192b]"><div className="border-b border-white/10 p-5"><h2 className="text-[15px] font-semibold">Priority queue</h2></div>{alerts.slice(0, 4).map((alert) => <button key={alert.id} onClick={onOpen} className="flex w-full items-center gap-4 border-b border-white/5 px-5 py-4 text-left last:border-0 hover:bg-white/[.025]"><Badge severity={alert.severity}/><div className="min-w-0 flex-1"><p className="truncate text-[15px] font-medium">{alert.title}</p><p className="mt-1 text-[13px] text-slate-500">{alert.asset} · {alert.source}</p></div><span className="text-[13px] text-slate-500">{alert.occurredAt}</span></button>)}</section></>; }

function AlertQueue({ alerts, selected, query, severity, setQuery, setSeverity, onSelect }: { alerts: Alert[]; selected: string; query: string; severity: Severity | "all"; setQuery: (v: string) => void; setSeverity: (v: Severity | "all") => void; onSelect: (id: string) => void }) { return <div className="border-b border-white/10 xl:border-b-0 xl:border-r"><div className="border-b border-white/10 p-5"><div className="flex items-center justify-between"><h2 className="font-medium">{alerts.length} alerts</h2><button onClick={() => { setQuery(""); setSeverity("all"); }} className="text-xs text-slate-400 hover:text-white">Reset filters</button></div><div className="relative mt-4"><Search size={16} className="absolute left-3 top-2.5 text-slate-500"/><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search alerts" className="w-full rounded-lg border border-white/10 bg-[#07111f] py-2 pl-9 pr-3 text-sm outline-none placeholder:text-slate-600 focus:border-cyan-400/50" /></div><div className="mt-3 flex gap-2 overflow-x-auto">{(["all", "critical", "high", "medium", "low"] as const).map((item) => <button key={item} onClick={() => setSeverity(item)} className={`rounded-full px-3 py-1 text-xs capitalize ${severity === item ? "bg-cyan-400 text-[#07111f]" : "bg-white/5 text-slate-400 hover:bg-white/10"}`}>{item}</button>)}</div></div><div className="max-h-[540px] overflow-y-auto">{alerts.length ? alerts.map((alert) => <button key={alert.id} onClick={() => onSelect(alert.id)} className={`w-full border-b border-white/5 p-5 text-left transition hover:bg-white/[.025] ${selected === alert.id ? "border-l-2 border-l-cyan-400 bg-cyan-400/[.055]" : "border-l-2 border-l-transparent"}`}><div className="flex items-start justify-between gap-3"><Badge severity={alert.severity}/><span className={`text-xs capitalize ${statusClasses[alert.status]}`}>{alert.status}</span></div><p className="mt-3 text-sm font-medium">{alert.title}</p><p className="mt-1 text-xs text-slate-500">{alert.id} · {alert.asset} · {alert.occurredAt}</p></button>) : <div className="p-10 text-center text-sm text-slate-500">No alerts match these filters.</div>}</div></div>; }

function IncidentDetail({ alert, notes, note, setNote, onAddNote, onAssign, onContain, contained }: { alert: Alert; notes: IncidentNote[]; note: string; setNote: (v: string) => void; onAddNote: () => void; onAssign: (id: string) => void; onContain: () => void; contained: boolean }) { const assignee = analysts.find((a) => a.id === alert.assigneeId); return <article className="min-w-0"><div className="border-b border-white/10 p-5 lg:p-7"><div className="flex flex-wrap items-start justify-between gap-5"><div><div className="flex items-center gap-2"><Badge severity={alert.severity}/><span className={`text-sm capitalize ${statusClasses[alert.status]}`}>{alert.status}</span></div><h2 className="mt-4 text-xl font-semibold">{alert.title}</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">{alert.description}</p></div>{contained ? <div className="flex items-center gap-2 rounded-lg bg-emerald-400/10 px-4 py-2 text-sm font-medium text-emerald-300"><CheckCircle2 size={17}/>Host contained</div> : <button onClick={onContain} className="rounded-lg bg-rose-400 px-4 py-2.5 text-sm font-semibold text-[#18080a] hover:bg-rose-300">Contain host</button>}</div><div className="mt-6 grid gap-3 sm:grid-cols-3"><Info label="Affected asset" value={alert.asset}/><Info label="Identity" value={alert.user}/><Info label="Tactic" value={alert.tactic}/></div></div><div className="grid gap-5 p-5 lg:grid-cols-[1.12fr_.88fr] lg:p-7"><section><h3 className="text-sm font-semibold">Evidence timeline</h3><div className="mt-5 space-y-0">{evidence.map((event, index) => <div key={event.id} className="relative grid grid-cols-[76px_20px_1fr] pb-6"><span className="pt-0.5 font-mono text-[11px] text-slate-500">{event.time}</span><span className={`relative mt-1.5 size-2.5 rounded-full ${event.type === "detection" ? "bg-rose-400" : event.type === "network" ? "bg-cyan-400" : "bg-amber-400"}`}>{index !== evidence.length - 1 && <span className="absolute left-1 top-3 h-8 w-px bg-white/10"/>}</span><div><p className="text-sm font-medium">{event.title}</p><p className="mt-1 text-xs leading-5 text-slate-500">{event.detail}</p></div></div>)}</div></section><section className="rounded-xl border border-white/10 bg-[#07111f] p-4"><div className="flex items-center justify-between"><h3 className="text-sm font-semibold">Incident owner</h3><UserRound size={16} className="text-slate-500"/></div><select value={alert.assigneeId ?? ""} onChange={(event) => onAssign(event.target.value)} className="mt-3 w-full rounded-lg border border-white/10 bg-[#0a192b] px-3 py-2 text-sm outline-none focus:border-cyan-400/50"><option value="">Unassigned</option>{analysts.map((analyst) => <option key={analyst.id} value={analyst.id}>{analyst.name}</option>)}</select>{assignee && <p className="mt-3 text-xs text-slate-500">Assigned to {assignee.name}</p>}<div className="mt-6 border-t border-white/10 pt-5"><h3 className="text-sm font-semibold">Analyst notes</h3><div className="mt-3 max-h-40 space-y-3 overflow-y-auto">{notes.map((item) => <div key={item.id}><div className="flex justify-between text-xs"><span className="font-medium text-slate-300">{item.author}</span><span className="text-slate-600">{item.createdAt}</span></div><p className="mt-1 text-xs leading-5 text-slate-400">{item.text}</p></div>)}</div><textarea value={note} onChange={(event) => setNote(event.target.value)} placeholder="Add investigation note…" className="mt-4 min-h-20 w-full resize-none rounded-lg border border-white/10 bg-[#0a192b] p-3 text-sm outline-none placeholder:text-slate-600 focus:border-cyan-400/50"/><button onClick={onAddNote} className="mt-2 rounded-lg bg-cyan-400 px-3 py-2 text-xs font-bold text-[#07111f] hover:bg-cyan-300">Add note</button></div></section></div></article>; }

function Assets() {
  return <section className="overflow-x-auto rounded-xl border border-white/10 bg-[#0a192b]">
    <div className="min-w-[680px]">
      <div className="grid grid-cols-[1.4fr_1fr_1fr_.9fr] gap-3 border-b border-white/10 px-5 py-4 text-[12px] font-semibold uppercase tracking-[0.12em] text-slate-500"><span>Asset</span><span>Owner</span><span>Exposure</span><span className="text-center">Risk</span></div>
      {assets.map((asset) => <div key={asset.id} className="grid grid-cols-[1.4fr_1fr_1fr_.9fr] items-center gap-3 border-b border-white/5 px-5 py-5 text-[15px] last:border-0 hover:bg-white/[.025]"><div><p className="font-medium text-slate-100">{asset.name}</p><p className="mt-1 text-[13px] text-slate-500">{asset.type}</p></div><span className="text-slate-400">{asset.owner}</span><span className="text-slate-400">{asset.exposure}</span><div className="flex justify-center"><Badge severity={asset.risk}/></div></div>)}
    </div>
  </section>;
}
function Info({ label, value }: { label: string; value: string }) { return <div className="rounded-lg bg-white/[.035] p-3"><p className="text-xs text-slate-500">{label}</p><p className="mt-1 text-sm font-medium">{value}</p></div>; }
