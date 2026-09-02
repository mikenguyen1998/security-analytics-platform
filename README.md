# Security Analytics Platform

An interactive SOC incident-triage portfolio demo built with Next.js, Tailwind CSS, and Supabase.

## Development

```bash
pnpm install
pnpm dev
```

Open http://localhost:3000. The demo works without configuration using browser-local state.

## Supabase guest persistence

1. Create a Supabase project and enable **Anonymous Sign-Ins**.
2. Run `supabase/migrations/20260830_security_analytics.sql` in the Supabase SQL editor.
3. Copy `.env.example` to `.env.local` and set the project URL and anonymous key.

Guest actions then persist through row-level-security policies scoped to the anonymous user. The dashboard restores alert ownership/status, analyst notes, and containment actions when the same guest revisits. Without Supabase credentials it transparently uses browser-local demo state instead.

Use **Reset demo** in the sidebar or mobile navigation to clear the current guest workspace and return to the seeded incident scenario.

## Validation and deployment

Run `pnpm lint` and `pnpm build`. Deploy to Vercel and add the two `NEXT_PUBLIC_SUPABASE_*` variables in the project settings.

## Engineering standards

See [`AGENTS.md`](AGENTS.md) for the shared engineering, accessibility, Supabase-safety, and visual-system standards used across this portfolio.
