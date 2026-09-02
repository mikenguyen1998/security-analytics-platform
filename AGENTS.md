# Engineering standards

## Working agreement

- Use TypeScript, keep React components focused, and preserve existing route and data boundaries.
- Run `pnpm lint` and `pnpm build` before handoff. Do not commit generated output or secrets.
- Keep Supabase changes additive. Never expose service-role credentials, weaken RLS, or run destructive migrations without explicit approval.

## UI system

- Use the semantic color tokens in `src/app/globals.css`; do not introduce one-off color literals when a token fits.
- Keep the interface calm: one product accent, neutral surfaces, and status colors only when they convey meaning.
- Use the shared type scale, spacing, radius, and shadow tokens. Large display type belongs only on public landing pages.
- Build responsive, keyboard-operable interfaces with semantic HTML, visible focus states, sufficient contrast, and reduced-motion support.

## Product notes

- Security Analytics uses cyan for primary interactions. Red, amber, and green are reserved for security severity and state.
- The anonymous demo and local fallback must remain functional. Treat incident data as fictional unless a task explicitly adds real integrations.
