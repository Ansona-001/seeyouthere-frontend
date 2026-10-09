@AGENTS.md

# Frontend — Next.js web app

Shared standards (security, model routing, token rules) live in `../CLAUDE.md`. Next.js 16 differs from training data — check `node_modules/next/dist/docs/` or context7 before using any Next API.

## Commands

```sh
npm run dev          # http://localhost:3100, expects the Go API on :8080
```

Verify before calling anything done (all must pass):

```sh
npm run lint
npm run typecheck
npm run build        # catches RSC/client boundary and route errors
npm audit --omit=dev # after any dependency change
```

## Architecture

- App Router, Server Components by default. Add `"use client"` only for state, effects, event handlers or browser APIs — and push it to the smallest leaf component.
- Data: server components read the user via `getCurrentUser()` (`src/lib/session.ts`, `server-only`, `cache`d per request). Client components call the API with `api<T>()` from `src/lib/api.ts` (cookie auth, throws `ApiError`). Don't add another fetch wrapper or a data library without a reason.
- The Go API is the only backend. No DB access, business logic or secrets in Next. `NEXT_PUBLIC_*` vars are public — never put secrets there.
- Auth gating happens server-side (`redirect("/login")` in the page/layout), never only in client code.
- Route-local components live next to their route (`src/app/login/login-form.tsx`); shared UI in `src/components/`; shadcn primitives in `src/components/ui/` (add via `npx shadcn@latest add <name>`, style `base-nova` on `@base-ui/react` — not Radix).
- `output: "standalone"` for Docker; keep it.

## TypeScript / React conventions

- `strict` TS; no `any`, no non-null `!` without a comment on why it's safe. Type API responses explicitly (mirror Go JSON structs in `src/lib/api.ts`).
- Named exports for components (pages/layouts use default export as Next requires). `@/` imports; order: external, blank line, internal, blank line, relative.
- Handle every async state: pending (disable buttons, show "Sending…"), error (`role="alert"`, friendly message from `ApiError`), empty state.
- Forms: native validation attributes (`required`, `type`, `pattern`, `autoComplete`, `inputMode`) plus server validation — the API is the source of truth.
- No `useEffect` for data that can be fetched on the server; no `useMemo`/`useCallback` without a measured reason (React 19 compiler-friendly code).

## Performance

- Ship minimal client JS: server components, no heavy UI/animation/date libraries when CSS or the platform does it (`<input type="date">`, CSS transitions, `Intl`).
- Images via `next/image` with explicit size; fonts only via `next/font` (already set: Figtree body, Gloock headings, Geist Mono; Bricolage Grotesque only for event themes).
- Use streaming/`Suspense` for slow server data; set `cache`/revalidation deliberately on each fetch (user-specific = `no-store`).
- Target Core Web Vitals: LCP < 2.5 s, CLS < 0.1, INP < 200 ms on a mid-range phone.

## Design & UI

- Use the **frontend-design** plugin skill for any new page or visual change; stay within the existing tokens in `src/app/globals.css` (colours, radius, `font-heading`) — don't hardcode hex colours or new fonts.
- Mobile-first; test at 360 px wide. Tailwind v4 utilities only (no CSS modules, no inline `style` except dynamic values).
- Accessibility is required: semantic HTML, labelled inputs, visible focus, keyboard-operable, colour contrast AA, `alt` text, respects `prefers-reduced-motion`.
- UI copy: short, warm, plain English, sentence case. Typographic ellipsis `…`.
- For visual verification use the playwright plugin to screenshot at 360 px and 1280 px.

## Security

- Never render user HTML (`dangerouslySetInnerHTML`) or put user input into `href`/`src` without validating the scheme (`https:` / relative only).
- Validate `?next=`/redirect params against same-origin paths.
- Don't read `.env.local` — use `.env.example` for variable names.
