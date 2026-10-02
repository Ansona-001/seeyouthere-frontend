# See You There — web

Next.js 16 (App Router) + Tailwind 4 + shadcn/ui. Serves the marketing pages, public event pages, host app (`/app`) and admin (`/admin`). All data comes from the Go API in `../seeyouthere-backend`.

## Run locally

Start the API first (see the backend README), then:

```sh
cp .env.example .env.local
npm install
npm run dev        # http://localhost:3100
```

Login emails are sent through Zoho Mail (configured in the API's `.env`).

## Scripts

- `npm run dev` / `build` / `start`
- `npm run typecheck` — generates route types, then `tsc`
- `npm run lint`

## How auth works

The API sets an HttpOnly `syt_session` cookie. Client components call the API directly with `credentials: "include"` (`src/lib/api.ts`). Server components read the cookie and forward it to `GET /v1/me` (`src/lib/session.ts`); `/app` redirects to `/login` when there is no session.

## Environment

| Variable | Used by | Purpose |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | browser (baked in at build) | Public API URL, e.g. `https://api.seeuthere.at` |
| `API_INTERNAL_URL` | Next.js server | API URL from inside the network, e.g. `http://api:8080` |

## Adding UI components

`npx shadcn@latest add <component>`. If npx fails with `ECOMPROMISED` on Windows, install `shadcn` in a temp folder and run `node <tmp>/node_modules/shadcn/dist/index.js add <component>`.
