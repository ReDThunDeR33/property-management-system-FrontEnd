# Dwellix (Property Management System) — Landlord & Staff Frontend Report

This report documents **only the Landlord module** and **only the Staff module** of the Next.js frontend, mapped against your grading rubric:

| Requirement | Marks |
|---|---|
| 12+ Axios calls, rendered with CSR or SSR based on scenario | 25 |
| Proper site layout using Components + Tailwind CSS | 10 |
| Different routing: folder-based, dynamic, `loading`/`not-found` files | 10 |
| Frontend data validation (Zod) + Authentication | 10 |
| **Bonus:** PusherJS real-time notifications | 5 |
| **Total** | **55 (+5)** |

**A note on scope:** `lib/axios.ts` and `lib/getToken.ts` (the two shared helper files both modules import) were not included in the files you gave me, so I can't quote their exact code. Where I refer to what they *must* be doing, I say "inferred" — this is based on how every page consistently calls them, not a guess out of nowhere.

---

# PART 1 — LANDLORD MODULE

## 1.1 Folder Structure & Route Map

```
app/landlord/
├── page.tsx                          → redirect() to /landlord/Dashboard
├── loading.tsx                       → ✅ working loading UI
├── notfound.tsx                      → ⚠️ WRONG FILENAME (see 1.2)
├── Components/
│   ├── Layout.tsx                    → shared shell (header+sidebar+footer+toasts)
│   ├── PropertyImageCarousel.tsx     → presentational, no data fetching
│   └── pushernotification.tsx        → PusherJS client, real-time toasts
├── Dashboard/page.tsx                → SSR
├── Properties/page.tsx               → SSR
├── Properties/[properties]/page.tsx  → CSR — dynamic route
├── Tenants/page.tsx                  → CSR
├── Issues/page.tsx                   → CSR
├── WorkOrders/page.tsx               → CSR
├── WorkOrders/[workorders]/page.tsx  → SSR — dynamic route
├── Transactions/page.tsx             → CSR
├── Reviews/page.tsx                  → CSR
└── Settings/page.tsx                 → CSR
```

**Folder-based routes:** `/landlord/Dashboard`, `/Properties`, `/Tenants`, `/Issues`, `/WorkOrders`, `/Transactions`, `/Reviews`, `/Settings` — each is just a folder + `page.tsx`, the Next.js App Router convention.

**Dynamic routes:** `Properties/[properties]/page.tsx` (segment name `properties`) and `WorkOrders/[workorders]/page.tsx` (segment name `workorders`). Both read the URL param, one with `useParams()` (client) and one by `await params` (server).

## 1.2 Routing Files — `loading` / `not-found`

- **`loading.tsx`** is correctly named and **works**: Next.js automatically shows it while any `/landlord/*` page is still doing its data fetch (this is React Suspense wired in by the App Router for free).
- **`notfound.tsx`** is **not** correctly named. Next.js only auto-wires a file called exactly `not-found.tsx` (with the hyphen). Because this file is `notfound.tsx`, **Next.js will never render it automatically** — it's dead code unless something manually imports and calls it, which nothing in the Landlord module does. Practically: nobody ever sees this "Page not found" screen. If you need this for the routing marks, rename it to `not-found.tsx` and it will start working immediately with zero other changes.
- There is **no `app/landlord/layout.tsx`**. This matters more than it looks — see 1.5.

## 1.3 Authentication

- Login (`app/login/page.tsx`) posts to `/auth/login`, then stores three cookies on success: `access_token`, `account_type`, `user` (JSON-stringified).
- The Landlord module has **no server-side auth gate** (no `app/landlord/layout.tsx` doing a `cookies()` check the way Admin's layout does). Instead, auth is enforced in two different places depending on whether the page is SSR or CSR:
  - **SSR pages** (`Dashboard`, `Properties`, `WorkOrders/[workorders]`) call `cookies()` from `next/headers` directly inside the page, read `user`/`access_token`, and call `redirect("/login")` if missing.
  - **CSR pages** don't check auth themselves — they rely on `Components/Layout.tsx`, which every page wraps its content in. `Layout.tsx` runs a `useEffect` on mount that reads the `user`/`access_token` cookies via a `getCookie()` helper and calls `router.push("/login")` if either is missing.
- **Token attachment:** none of the Landlord's CSR/SSR Axios calls manually attach an `Authorization` header — they just call `api.get(...)`, `api.post(...)`, etc. This means `lib/axios.ts` (the shared `api` instance) is almost certainly pre-configured with a `baseURL` of `NEXT_PUBLIC_API_URL` and a request interceptor that injects the JWT automatically (inferred — the file itself wasn't in your upload, but there's no other way these calls would succeed against a JWT-protected NestJS backend).
- **Password change** (`Settings/page.tsx`) sends the *plaintext* current password as `password_hash` in the PATCH body — that's a naming/security smell worth mentioning if you're asked about it in the viva, even though it's a backend contract issue rather than a frontend bug per se.

## 1.4 Layout & Tailwind (Component Structure)

`app/landlord/Components/Layout.tsx` is a **plain React client component**, not a Next.js `layout.tsx`. Every single Landlord page manually does:

```tsx
return (
  <Layout>
    <section>...page content...</section>
  </Layout>
);
```

Inside `Layout.tsx`:
- **Header** — logo, notification bell (static toast, not wired to Pusher), user avatar (initials generated from the name).
- **Sidebar** — `navItems` array mapped into `<Link>`s, active route highlighted via `usePathname()` comparison; collapses to an off-canvas drawer on mobile (`translate-x-full` / `translate-x-0` Tailwind transform toggle) with a backdrop overlay.
- **Footer** — big brand wordmark, quick links, contact info, a fake "System Status: Online" indicator.
- **Toast container** — local `useState<Toast[]>` array, auto-dismiss via `setTimeout`.
- **`<PusherNotifications />`** — rendered unconditionally at the very bottom (see 1.6).

**Tailwind usage note:** Landlord hardcodes the brand color as an **arbitrary value** everywhere — `bg-[#FF5A3D]`, `text-[#FF5A3D]` — instead of using the theme token `dwellix-500` that's already registered in `app/globals.css` (`--color-dwellix-500: #ff5a3d;`). Admin and Staff both correctly use `bg-dwellix-500` / `text-dwellix-500`. Functionally identical, but it's an inconsistency across the codebase you may want to normalize before submission.

**Consequence of not having a real `layout.tsx`:** because `Layout` is just a component each `page.tsx` imports (not the App Router's actual layout mechanism), React fully **unmounts and remounts it on every navigation** between Landlord pages (Dashboard → Properties → Tenants, etc.). This is directly relevant to Pusher — see below.

## 1.5 Page-by-Page: What Runs Where

| Page | Render Mode | Why |
|---|---|---|
| `Dashboard/page.tsx` | **SSR** | `async` Server Component, calls `cookies()` + `axios` on the server before sending HTML |
| `Properties/page.tsx` | **SSR** | Same pattern, plus explicit `export const dynamic = "force-dynamic"` |
| `Properties/[properties]/page.tsx` | **CSR** | `"use client"`, fetches in `useEffect` after mount |
| `Tenants/page.tsx` | **CSR** | `"use client"`, `useEffect` fetch |
| `Issues/page.tsx` | **CSR** | `"use client"`, `useEffect` fetch |
| `WorkOrders/page.tsx` | **CSR** | `"use client"`, `Promise.all` fetch in `useEffect` |
| `WorkOrders/[workorders]/page.tsx` | **SSR** | `async` Server Component + `export const dynamic = "force-dynamic"` |
| `Transactions/page.tsx` | **CSR** | `"use client"`, several `useEffect` fetches |
| `Reviews/page.tsx` | **CSR** | `"use client"`, `useEffect` fetch |
| `Settings/page.tsx` | **CSR** | `"use client"`, `useEffect` fetch |

Rule of thumb the codebase actually follows: the **initial page load** of a list/detail view that's dashboard-like or has an SSR-friendly "just show me my data" shape uses SSR (`Dashboard`, `Properties` list, `WorkOrders` detail). Anything with heavy interactivity — forms, multiple dropdowns, live editing, filters — is CSR. This lines up with the course's SSR-vs-CSR guidance table.

**Technical note:** reading `cookies()` inside a Server Component automatically forces Next.js to render that route dynamically per-request (it opts out of static caching on its own) — so `export const dynamic = "force-dynamic"` on `Properties/page.tsx` and `WorkOrders/[workorders]/page.tsx` is technically redundant with the `cookies()` call already present, but it does make the intent explicit/self-documenting.

### Detailed walkthrough per page

**`Dashboard/page.tsx` (SSR)**
Reads `user`/`access_token` cookies server-side → parses `landlordId` → one Axios call to `GET /landlord/dashboard/summery?landlordId=X` via the shared `api` instance → response validated against `dashboardSummarySchema` (Zod) → renders 4 stat cards (properties, tenants, work orders, income). If the request fails or Zod rejects the shape, an inline error message is shown instead of crashing.

**`Properties/page.tsx` (SSR)**
Same auth pattern, one call: `GET /landlord/properties/${landlordId}`, validated with `propertyListSchema` (array of `propertySchema`, which itself uses `z.union([z.string(), z.number()])` for money fields since Postgres/TypeORM decimals often come back as strings). Renders a photo-grid of properties, each card linking to the dynamic detail route.

**`Properties/[properties]/page.tsx` (CSR — dynamic route, the busiest page)**
Reads `propertyId` from `useParams()`. On mount: `GET /landlord/properties/${landlordId}/${propertyId}`. If the backend 404s, it calls Next's `notFound()` (imported from `next/navigation`) **outside** the `try/catch` block on purpose — a comment in the code explains that calling it inside the `catch` would let your own error handling swallow Next's internal `NEXT_NOT_FOUND` signal, so it's deliberately hoisted out. Five separate one-field forms then each PATCH independently the moment you click their own "Save" button:
- `PATCH /landlord/propety/update/rent/...` *(note: "propety" is a real typo baked into the live route — not something I introduced)*
- `PATCH /landlord/propety/update/service_charge/...`
- `PATCH /landlord/propety/update/parking/...` (body key is `parking`, **not** `parking_fee` — a deliberate mismatch documented in a code comment)
- `PATCH /landlord/propety/update/listing_status/...`
- `PATCH /landlord/propety/update/status/...`

Each form has its own tiny inline Zod schema (`rentSchema`, `serviceChargeSchema`, `parkingSchema` — all `z.coerce.number()` with a `.positive()` or `.min(0)`), so a bad number is caught before the request ever fires.

**`Tenants/page.tsx` (CSR)**
`GET /landlord/tenants/${id}` on mount. Renders tenant cards with status-dependent action rows:
- `PENDING` → Approve / Reject buttons → `PATCH /landlord/tenant/approve/...` or `/reject/...`
- `APPROVED` with no property → an inline "Assign Property" mini-form, validated with `assignPropertySchema` (`z.coerce.number().positive()`) → `PATCH /landlord/tenant/assign-property/...`
- `APPROVED` → also a "Kick Tenant" button → `PATCH /landlord/tenant/kick/...`
There's a client-only `KICKED` pseudo-status layered on top of the backend's real `REJECTED` status (tracked in local state `kickedTenantIds`), purely so the UI can visually distinguish "rejected at application" from "kicked after being approved" even though the backend stores both as `REJECTED`.

**`Issues/page.tsx` (CSR)**
Two fetches on mount (`GET /landlord/issues/${landlordId}` and `GET /landlord/properties/${landlordId}` to populate the property dropdown). A "Create Issue" form (Zod-free here — validated with plain `if` checks instead) posts via `POST /landlord/issues/${landlordId}`. Each issue card has a "Mark In Progress" / "Mark Complete" button that calls `PATCH /landlord/issues/${landlordId}/${issueId}` with `{ status: nextStatus }` — a state machine `OPEN → IN_PROGRESS → RESOLVED` enforced purely in the frontend via a `nextStatus` lookup object.

**`Reviews/page.tsx` (CSR)**
Single `GET /landlord/reviews/${landlordId}`, read-only star-rating cards. The simplest page in the module.

**`Settings/page.tsx` (CSR)**
`GET /landlord/profile/${id}` on mount, then two independent forms: profile (`PUT /landlord/update/${id}`, Zod `profileFormSchema` with `.email()`) and password (`PATCH /landlord/update_password/${id}`, Zod `passwordFormSchema` using `.refine()` to check `newPassword === confirmPassword`). After a successful profile update it also rewrites the `user` cookie client-side so the header/sidebar reflect the new name immediately without a full reload.

**`Transactions/page.tsx` (CSR — the biggest file in the module)**
Four parallel `GET`s on mount (transactions, work orders, properties, tenants — the last three purely to populate dropdowns). Has a duplicate-guard helper `removeDuplicateTransactions()` (dedupes by `id` via a `Set`) applied after every fetch/create, which suggests the team hit a real duplicate-row bug at some point and patched it defensively on the frontend rather than the backend. Three separate creation/action flows:
- Create a utility transaction → `POST /landlord/transaction/${landlordId}`
- Create a payment for a work order → `POST /landlord/work-order/transaction/${landlordId}/${workOrderId}`, followed immediately by a full `GET` refresh (explicit comment: "reload from DB so it survives a page refresh")
- Pay one of your own utility bills → `PATCH /landlord/utility-bill/pay/${landlordId}/${transactionId}`
- A separate "look up one tenant's transactions" search box → `GET /landlord/tenant/transactions/${landlordId}/${tenantId}`
Six different Zod schemas cover transaction/work-order/tenant/property shapes.

**`WorkOrders/page.tsx` (CSR)**
`Promise.all([GET workorders, GET transactions])` on mount so both lists land together. For each work order it computes `totalCost = labor + materials + additional` client-side and cross-references it against the transactions list (matching by `work_order_id.id` + `type === "work_order_cost"`) to decide whether to show "Create Payment", "Payment Pending", or "Payment Completed". Creating a payment (`POST /landlord/work-order/transaction/...`) triggers a full transactions refetch afterward.

**`WorkOrders/[workorders]/page.tsx` (SSR — dynamic route)**
There's no single-item backend endpoint for this (a code comment says so explicitly), so it fetches the **entire** work-order list server-side and does `.find(item => item.id === workOrderId)` in memory. Calls `notFound()` if nothing matches — again deliberately placed outside the `try/catch`.

## 1.6 PusherJS — How Real-Time Notifications Actually Work (Landlord only)

This is implemented in exactly one file: **`app/landlord/Components/pushernotification.tsx`**, using the `pusher-js` npm package (client-side WebSocket library, the counterpart to whatever server-side `pusher` package your NestJS backend uses to *trigger* events).

**Step by step, this is the full lifecycle:**

1. **Mount.** `<PusherNotifications />` sits at the bottom of `Layout.tsx`, so it mounts on every single Landlord page (since every page wraps itself in `<Layout>`).
2. **Identify the landlord.** A `useEffect` reads the `user` cookie, `JSON.parse`s it, and pulls out the numeric `id`. If that cookie is missing or unparseable, it logs an error and bails out — no connection is attempted.
3. **Read the Pusher app credentials.** `NEXT_PUBLIC_PUSHER_KEY` and `NEXT_PUBLIC_PUSHER_CLUSTER` come from `.env.local`. These are safe to expose publicly (that's the whole point of Pusher's "app key" vs "app secret" split — the secret stays only on your backend, which is the only thing allowed to *trigger* events).
4. **Create the client:** `new Pusher(key, { cluster })`. This opens a WebSocket connection to Pusher's servers.
5. **Subscribe to a per-landlord channel:** the channel name is built as `` `landlord-${landlordId}` `` (e.g. `landlord-7`). This is a **public** channel — no `private-` prefix, no channel-authorization request to your backend. The "privacy" here is entirely by convention: your NestJS backend is trusted to only ever publish a given landlord's events onto *that specific landlord's* channel name. This is simpler to build than Pusher's authenticated private/presence channels, but it does mean anyone who knew (or brute-forced) another landlord's numeric ID could theoretically subscribe to `landlord-<their-id>` from the browser console and listen in — worth a one-line mention if your viva asks about security trade-offs.
6. **Bind four custom, backend-triggered events** on that channel:

   | Event name | Fired when (presumably, backend-side) | Toast shown |
   |---|---|---|
   | `new-issue` | A tenant reports a new issue on one of this landlord's properties | red/error toast: "New issue on {unit}: {description}" |
   | `work-order-created` | Staff opens a work order for this landlord's property | blue/info toast |
   | `work-order-complete` | Staff marks a work order done | green/success toast with total cost |
   | `transaction-paid` | Any transaction (rent, utility bill, work-order cost) gets marked paid | green/success toast with amount + type |

   Each handler just takes the JSON payload Pusher hands it and calls a local `showToast(type, message)` helper — nothing async, nothing hits Axios; the whole point is this is a **push**, not a fetch.
7. **Connection & subscription lifecycle events** (Pusher's own built-in events, not custom ones):
   - `pusher.connection.bind("state_change", ...)` — logs every transition (`connecting → connected`, etc.) to the console.
   - `pusher.connection.bind("connected", ...)` — logs success + the socket ID.
   - `pusher.connection.bind("error", ...)` — logs connection failures.
   - `channel.bind("pusher:subscription_succeeded", ...)` — Pusher's own confirmation that the channel subscription went through; the app uses this moment to pop a one-time "Real-time notifications connected for landlord {id}" info toast, so the landlord gets visible proof the feature is live.
   - `channel.bind("pusher:subscription_error", ...)` — logs failures.
   - `channel.bind_global((eventName, data) => {...})` — a catch-all that logs **every** event received on the channel regardless of name. This is a debugging aid: during development you can trigger something on the backend and immediately see in the browser console exactly what event name and payload arrived, even before you've wired up a specific handler for it.
8. **Rendering:** a small, separate `toasts` state array (independent from `Layout`'s own toast state) renders a fixed, bottom-right stack of colored cards (red/blue/green via Tailwind), each auto-removing itself after 5 seconds via `setTimeout` + filtering the array by `id`.
9. **Cleanup:** the `useEffect` returns a teardown function — `channel.unbind_all()`, `pusher.unsubscribe(channelName)`, `pusher.disconnect()` — so the socket is properly closed and no memory/listeners leak.

**The one architectural quirk worth explaining well in your report/viva:** because `Layout.tsx` (and therefore `PusherNotifications`) is a plain component re-imported fresh by *every* `page.tsx`, rather than a real Next.js `layout.tsx` that persists across navigations, React **fully unmounts and remounts it every time you click a sidebar link** to go from, say, Dashboard to Properties. That means the Pusher socket disconnects and reconnects on every single page change inside the Landlord app — it does *not* stay open as one continuous session the way it would if `Layout` were promoted to an actual `app/landlord/layout.tsx`. It still works correctly (you'll always be re-subscribed within a second or so of landing on any page), it's just not the most efficient possible implementation, and it's a good, concrete "how would you improve this" answer if asked.

**`lib/pusher.ts`** exists in the repo (visible in your file tree) but its contents weren't in what you gave me, and nothing in the Landlord pages imports from it — the working implementation goes straight through the `pusher-js` package directly inside `pushernotification.tsx`. Worth opening that file yourself to confirm whether it's dead code, a leftover from an earlier approach, or a server-side trigger helper used elsewhere (e.g. by the backend or by the Tenant module).

## 1.7 Landlord — Requirement Coverage Summary

| Requirement | Status | Evidence |
|---|---|---|
| 12+ Axios calls, CSR/SSR | ✅ **34 call-sites** found (see Appendix A) | 3 SSR pages, 7 CSR pages |
| Layout via Components + Tailwind | ✅ Custom `Layout.tsx` (header/sidebar/footer/toasts) reused by every page | minor: hardcoded hex colors instead of the `dwellix-*` theme tokens |
| Folder-based routing | ✅ 8 folder routes | |
| Dynamic routing | ✅ `[properties]`, `[workorders]` | |
| `loading.tsx` | ✅ Present and functional | |
| `not-found.tsx` | ⚠️ Present but **misnamed** (`notfound.tsx`) — not wired up by Next.js | one-line rename fixes it |
| Zod validation | ✅ Present on every form (13+ distinct schemas) | one page (`Issues`) uses plain `if` checks instead |
| Authentication | ✅ Cookie-based JWT, checked at the SSR-page level and inside `Layout.tsx` for CSR pages | no server-side route-group guard (no `app/landlord/layout.tsx`) |
| PusherJS (bonus) | ✅ Fully implemented — 4 real-time events, connected via `pusher-js` | public channel by convention, not Pusher's authenticated private channels |

---

# PART 2 — STAFF MODULE

## 2.1 Folder Structure & Route Map

```
app/staff/
├── layout.tsx                        → ✅ real Next.js layout (Header + Footer)
├── LogoutButton.tsx                  → cookie cleanup, no Axios
├── dashboard/page.tsx                → SSR
├── admins/page.tsx                   → CSR
├── blocks/page.tsx                   → CSR
├── buildings/page.tsx                → CSR
├── landlords/page.tsx                → CSR
├── tenants/page.tsx                  → CSR
├── tenants/[id]/page.tsx             → CSR — dynamic route
├── properties/page.tsx               → CSR
├── properties/[id]/page.tsx          → CSR — dynamic route
├── issues/page.tsx                   → CSR
├── issues/[id]/page.tsx              → CSR — dynamic route
├── work-orders/page.tsx              → CSR
├── work-orders/new/page.tsx          → CSR
├── work-orders/[id]/page.tsx         → CSR — dynamic route
├── workers/page.tsx                  → CSR
├── workers/new/page.tsx              → CSR
├── workers/[id]/page.tsx             → CSR — dynamic route
├── workers/[id]/schedule/page.tsx    → CSR — nested dynamic route
├── workers/[id]/performance/page.tsx → CSR — nested dynamic route
├── reports/work-order-summary/page.tsx    → CSR
├── reports/worker-performance/page.tsx    → CSR
└── profile/page.tsx                  → CSR
```

**Folder-based routes:** `dashboard`, `admins`, `blocks`, `buildings`, `landlords`, `tenants`, `properties`, `issues`, `work-orders`, `work-orders/new`, `workers`, `workers/new`, `reports/work-order-summary`, `reports/worker-performance`, `profile` — 15 plain folder routes.

**Dynamic routes:** `tenants/[id]`, `properties/[id]`, `issues/[id]`, `work-orders/[id]`, `workers/[id]`, and two **nested** dynamic routes hanging off the same parameter: `workers/[id]/schedule` and `workers/[id]/performance`. That last pair is a nice example of "dynamic segment shared by multiple child routes" — six dynamic routes total.

## 2.2 Routing Files — `loading` / `not-found`

**Neither file exists anywhere under `app/staff/`.** No `loading.tsx`, no `not-found.tsx`, at any level of the Staff tree. Every Staff page instead does its own manual `if (!data) return <div>Loading...</div>` inline, and there is no 404 handling at all for a bad `[id]` (a staff member visiting `/staff/tenants/9999` just gets a page stuck on "Loading..." forever, since the failed fetch never sets any error/not-found state in most of these pages).

This is the one clear gap against the "routing files like loading, not-found" requirement for this module — if you want full marks here, the fastest fix is adding a single `app/staff/loading.tsx` (Next.js will then apply it to every Staff route automatically, the same way Admin's does) and a `app/staff/not-found.tsx`, then having the dynamic-route pages call Next's `notFound()` when a fetch comes back 404, the same way Landlord's `Properties/[properties]` and `WorkOrders/[workorders]` already do.

## 2.3 Authentication

- `app/staff/layout.tsx` is a genuine Next.js layout (correctly named, so it *does* persist across Staff page navigations — unlike Landlord's manually-imported `Layout`). However it does **no auth check at all** — it just wraps children in `<Header />` / `<Footer />`.
- The only place any role/session check happens is inside `dashboard/page.tsx`: it reads the `account_type` cookie and, if it isn't exactly `"staff"`, renders a plain "Unauthorized access. Please log in as staff." message with a manual link to `/login` — it does **not** call `redirect()`, so this is a soft warning, not an enforced guard.
- Every other Staff page (all 20+ of them) does **no auth/role check whatsoever** in the component itself — they just fire their Axios call. If someone isn't logged in, the request presumably fails at the backend (401), but nothing in these pages catches that specifically to bounce the user to `/login`.
- **Token attachment is manual and explicit here**, unlike Landlord: every single Staff Axios call passes `{ headers: authHeader() }` as the second/third argument, where `authHeader()` comes from `@/lib/getToken`. This is a different pattern from Landlord's (which relies on an inferred automatic interceptor) — both presumably end up sending the same `Authorization: Bearer <token>` header, but Staff does it call-by-call rather than centrally.
- `lib/getToken.ts` also exports `getClientUser()` / `setClientUser()`, used by `profile/page.tsx` to read/write the cached user object without hitting the backend.
- For the one SSR page (`dashboard/page.tsx`), the header has to be built by hand instead (`const headers = token ? { Authorization: \`Bearer ${token}\` } : {}`), because `authHeader()` (a client helper reading `document.cookie`) can't run on the server — there's no `document` object during server rendering. This is a small but genuinely important detail: **the exact same "attach the JWT" concept needs two different implementations depending on whether the code runs on the server or the browser**, and this codebase handles that correctly.

## 2.4 Layout & Tailwind (Component Structure)

`app/staff/layout.tsx` wraps every Staff page in the **shared, generic** `components/Header.tsx` and `components/Footer.tsx` (the same components other parts of the app could reuse — they are not Staff-specific, unlike Landlord's bespoke sidebar-based `Layout.tsx`). Individual pages then build their own UI directly with Tailwind utility classes:
- Tables are built as manual CSS grids (`grid grid-cols-12`) rather than `<table>` elements — every list page (`admins`, `blocks`, `buildings`, `landlords`, `tenants`, `properties`, `issues`, `work-orders`, `workers`) follows the exact same 12-column grid pattern.
- Status pills use `lib/status.ts`'s `statusColor(status)` helper, which returns a Tailwind color name (e.g. `"green"`, `"yellow"`), plugged into a **template-literal class name**: `` `bg-${statusColor(status)}-100 text-${statusColor(status)}-600` ``.
  ⚠️ **Tailwind gotcha worth flagging:** Tailwind's build-time scanner can only pick up class names it can see as *literal strings* in your source. A dynamically constructed class like `` `bg-${variable}-100` `` is invisible to that scanner unless the exact same full class string (e.g. `bg-green-100`) also appears literally somewhere else in the codebase (Tailwind's JIT mode is generally lenient with this specific interpolation pattern and does handle it correctly in practice for common color names, but it's a known fragility point — if `statusColor()` ever returns a color name that isn't already used literally elsewhere, that badge could silently render with no background color in a production build). Good thing to mention if asked "any risks in your Tailwind setup?"
- Correctly uses the registered theme token `text-dwellix-500` / `bg-dwellix-500` (unlike Landlord's hardcoded hex).

## 2.5 Page-by-Page: What Runs Where

Every single Staff page except `dashboard/page.tsx` is a **Client Component** (`"use client"`) fetching data in `useEffect`. `dashboard/page.tsx` is the lone **SSR** page in this module (`async` Server Component, reads `cookies()`).

### Detailed walkthrough per page

**`dashboard/page.tsx` (SSR)**
Checks `account_type` cookie, then fires **three** server-side Axios calls: `GET /staff/dashboard/stats?staffId=X` (validated against a large nested `dashboardStatsSchema` covering work orders/workers/issues/properties/landlords/tenants/hierarchy/financials), `GET /staff/issues?limit=5` (filtered client-side down to non-resolved, sliced to 3, for a "Recent Issues to Triage" widget), and `GET /staff/workers?status=busy&limit=5` (for a "Busy Workers" widget). All headers built by hand from the server-side cookie (see 2.3).

**`admins/page.tsx`, `blocks/page.tsx`, `buildings/page.tsx`, `landlords/page.tsx`, `tenants/page.tsx`, `properties/page.tsx`, `issues/page.tsx`, `workers/page.tsx`, `reports/work-order-summary/page.tsx`, `reports/worker-performance/page.tsx`**
All 10 of these follow an identical, simple recipe: one `useState` for the list, one for `loading`, a single `GET` in `useEffect` on mount, validated with a Zod schema (each has its own — `adminSchema`, `blockSchema`, `buildingSchema` with a nested `block` object, `landlordSchema`, `tenantSchema` with nested `property`/`approved_by`, `propertySchema` with nested `landlord`/`tenant`, `issueSchema` with nested `property`/`tenant`, `workerSchema`, `rowSchema` for both reports), rendered as a 12-column grid table with a "View" link where relevant. `buildings/page.tsx` is a good small example: `GET /staff/buildings` → `buildingSchema` includes a nested `block: z.object({ name: z.string() }).nullable()`.

**`tenants/[id]/page.tsx`, `properties/[id]/page.tsx`, `issues/[id]/page.tsx` (partially), `workers/[id]/page.tsx` (partially)**
These read the dynamic `id` from `useParams()` and `GET` a single-item detail endpoint. `tenants/[id]` and `properties/[id]` are pure read-only detail pages (fetch once, display).

**`issues/[id]/page.tsx` (CSR — dynamic route, has a write action)**
`GET /staff/issues/${id}` on mount, plus a status-update form (`OPEN` / `IN_PROGRESS` / `RESOLVED` dropdown) → `PATCH /staff/issues/${id}/status`. It also renders a "Create Work Order" link that carries `issue_id`, `property_id`, `tenant_id`, and `landlord_id` forward as **URL search params** to `/staff/work-orders/new` — a neat pattern for pre-filling a form on the next page without any global state management.

**`work-orders/page.tsx` (CSR)**
`GET /staff/work-orders` → `workOrderSchema` with nested `landlord`/`property`/`tenant` — a list with a "+ Create Work Order" button linking to the `new` route.

**`work-orders/new/page.tsx` (CSR)**
Reads pre-filled values out of the URL via `useSearchParams()` (the ones passed from `issues/[id]`), and on submit does `POST /staff/work-orders?staffId=${staffId}`. **No Zod schema here** — validation is just `if (!propertyId || !issueId || !landlordId) { setError(...) }`. Worth calling out as the one Staff creation form that doesn't follow the Zod pattern used everywhere else.

**`work-orders/[id]/page.tsx` (CSR — dynamic route, the busiest Staff page)**
`GET /staff/work-orders/${id}` on mount (`workOrderSchema` with `landlord`/`tenant`/`property`/`issue`/`worker` all nested), then **seven** separate write actions, each its own button/form:
- Update status + all three cost fields → `PATCH /staff/work-orders/${id}`
- Dispatch a worker (enter a worker ID) → `PATCH /staff/work-orders/${id}/dispatch`
- Remove the assigned worker → `PATCH /staff/work-orders/${id}/remove-worker`
- Mark complete → `PATCH /staff/work-orders/${id}/complete`
- Confirm tenant → `PATCH /staff/work-orders/${id}/confirm-tenant`
- Reopen → `PATCH /staff/work-orders/${id}/reopen`
- Delete → `DELETE /staff/work-orders/${id}`, followed by `router.push("/staff/work-orders")`
A local `getAllowedStatuses()` function encodes the same state-machine idea seen in Landlord's Issues page, but for the richer work-order lifecycle: `pending → assigned → tenant_confirmed → complete`, with some backward transitions allowed too.

**`workers/page.tsx`, `workers/new/page.tsx`**
Standard list (`GET /staff/workers`) and a creation form (`POST /staff/${staffId}/workers`, again no Zod — manual state only).

**`workers/[id]/page.tsx` (CSR — dynamic route)**
`GET /staff/workers/${id}` on mount, an edit form (`PATCH /staff/workers/${id}`), a `PATCH /staff/workers/${id}/toggle-status` button, a `DELETE /staff/workers/${id}` button, and links out to two **nested** dynamic sub-pages.

**`workers/[id]/schedule/page.tsx`, `workers/[id]/performance/page.tsx` (CSR — nested dynamic routes)**
Each does one `GET` (`/staff/workers/${id}/schedule` and `/staff/workers/${id}/performance` respectively) and renders a read-only view — a scheduled-jobs table and a stats + recent-orders dashboard.

**`profile/page.tsx` (CSR)**
The only page in either module that does **not** fetch fresh data from the backend on load — it reads the cached user object straight from `getClientUser()` (client-side cookie helper), pre-fills the form from that, and only ever talks to the backend once you submit: `PATCH /staff/profile`. It conditionally spreads only the non-empty fields into the request body so blank inputs don't wipe out existing data server-side. No Zod here either.

## 2.6 Real-Time Notifications (PusherJS) — Staff Module

**Not implemented.** There is no Pusher import, no `pusher-js` usage, and no equivalent of Landlord's `pushernotification.tsx` anywhere under `app/staff/`. The only real-time notification code in the whole repository lives in two places: Landlord's `pushernotification.tsx` (documented above) and a global `components/TenantNotifications.tsx`, which is mounted once in the **root** `app/layout.tsx` — meaning it runs for every user of the whole app regardless of role, but its content wasn't included in what you gave me, so I can't describe what it listens for. Either way, it is not part of the Staff module specifically.

**Practical takeaway:** if the bonus 5 marks require every module to demonstrate PusherJS, Staff currently scores 0 on that specifically — the fastest fix would be mirroring Landlord's pattern (a `staff-${staffId}` channel, events like `issue-reported` or `worker-assigned`, dropped into `app/staff/layout.tsx` so it persists across all Staff pages by default, which — bonus point — would actually work *better* than Landlord's version since `layout.tsx` here is a real, persistent Next.js layout).

## 2.7 Staff — Requirement Coverage Summary

| Requirement | Status | Evidence |
|---|---|---|
| 12+ Axios calls, CSR/SSR | ✅ **35 call-sites** found (see Appendix A) | 1 SSR page (dashboard, 3 calls), 21 CSR pages |
| Layout via Components + Tailwind | ✅ Real `layout.tsx` + shared `Header`/`Footer` components | dynamic Tailwind class construction is a minor fragility risk |
| Folder-based routing | ✅ 15 folder routes | |
| Dynamic routing | ✅ 6 dynamic routes, including 2 nested under `workers/[id]` | |
| `loading.tsx` | ❌ **Missing entirely** | every page hand-rolls its own inline loading text |
| `not-found.tsx` | ❌ **Missing entirely** | bad dynamic IDs just hang on "Loading..." |
| Zod validation | ⚠️ Present on 19 of ~22 pages | `work-orders/new`, `workers/new`, and `profile` use plain manual checks instead |
| Authentication | ⚠️ Token attached correctly via `authHeader()` on every call, but only `dashboard` checks role, and it doesn't `redirect()` | no route-group-level guard in `layout.tsx` |
| PusherJS (bonus) | ❌ Not implemented in this module | |

---

# PART 3 — Landlord vs Staff, Side by Side

| | Landlord | Staff |
|---|---|---|
| Total Axios call-sites | 34 | 35 |
| SSR pages | 3 (Dashboard, Properties list, WorkOrder detail) | 1 (dashboard) |
| CSR pages | 7 | 21 |
| Folder routes | 8 | 15 |
| Dynamic routes | 2 | 6 (incl. 2 nested) |
| `loading.tsx` | ✅ works | ❌ missing |
| `not-found.tsx` | ⚠️ present but misnamed, doesn't fire | ❌ missing |
| Real `app/.../layout.tsx` | ❌ no — manual `Layout` component per page | ✅ yes |
| Auth guard style | Cookie check inside `Layout.tsx` (CSR) / `cookies()`+`redirect()` (SSR pages) | Only `dashboard` checks role, no redirect |
| Token attachment | Inferred automatic (via `api` interceptor) | Manual, explicit `authHeader()` on every call |
| Zod coverage | ~13 schemas, almost every form | ~19 schemas; 3 pages skip it |
| Brand color usage | Hardcoded hex (`bg-[#FF5A3D]`) | Theme token (`bg-dwellix-500`) |
| PusherJS | ✅ Fully working, 4 live events | ❌ None |

**One-line summary for a viva:** both modules comfortably clear the 12-Axios-call bar and use CSR/SSR appropriately for the scenario each page represents; Landlord's real strength is its PusherJS implementation and it has one easy naming fix pending (`notfound.tsx` → `not-found.tsx`); Staff's real strength is having a proper persistent `layout.tsx` and consistently-attached auth headers, but it's missing both special routing files and has zero real-time notifications.

---

# Appendix A — Full Axios Endpoint Tables

## A.1 Landlord (34 calls)

| # | Page | Method | Endpoint | Render | Zod schema |
|---|---|---|---|---|---|
| 1 | Dashboard | GET | `/landlord/dashboard/summery` | SSR | `dashboardSummarySchema` |
| 2 | Properties | GET | `/landlord/properties/:landlordId` | SSR | `propertyListSchema` |
| 3 | Properties/[properties] | GET | `/landlord/properties/:landlordId/:propertyId` | CSR | `propertyDetailSchema` |
| 4 | Properties/[properties] | PATCH | `/landlord/propety/update/rent/:landlordId/:propertyId` | CSR | `rentSchema` |
| 5 | Properties/[properties] | PATCH | `/landlord/propety/update/service_charge/...` | CSR | `serviceChargeSchema` |
| 6 | Properties/[properties] | PATCH | `/landlord/propety/update/parking/...` | CSR | `parkingSchema` |
| 7 | Properties/[properties] | PATCH | `/landlord/propety/update/listing_status/...` | CSR | — |
| 8 | Properties/[properties] | PATCH | `/landlord/propety/update/status/...` | CSR | — |
| 9 | Issues | GET | `/landlord/issues/:landlordId` | CSR | `issueListSchema` |
| 10 | Issues | GET | `/landlord/properties/:landlordId` (dropdown) | CSR | `propertyListSchema` |
| 11 | Issues | POST | `/landlord/issues/:landlordId` | CSR | manual checks |
| 12 | Issues | PATCH | `/landlord/issues/:landlordId/:issueId` | CSR | — |
| 13 | Reviews | GET | `/landlord/reviews/:landlordId` | CSR | `reviewListSchema` |
| 14 | Settings | GET | `/landlord/profile/:id` | CSR | `profileSchema` |
| 15 | Settings | PUT | `/landlord/update/:landlordId` | CSR | `profileFormSchema` |
| 16 | Settings | PATCH | `/landlord/update_password/:landlordId` | CSR | `passwordFormSchema` |
| 17 | Tenants | GET | `/landlord/tenants/:id` | CSR | `tenantListSchema` |
| 18 | Tenants | PATCH | `/landlord/tenant/approve/:landlordId/:tenantId` | CSR | — |
| 19 | Tenants | PATCH | `/landlord/tenant/reject/...` | CSR | — |
| 20 | Tenants | PATCH | `/landlord/tenant/kick/...` | CSR | — |
| 21 | Tenants | PATCH | `/landlord/tenant/assign-property/...` | CSR | `assignPropertySchema` |
| 22 | Transactions | GET | `/landlord/transactions/:landlordId` | CSR | `transactionListSchema` |
| 23 | Transactions | GET | `/landlord/workorders/:landlordId` (dropdown) | CSR | `workOrderListSchema` |
| 24 | Transactions | GET | `/landlord/properties/:landlordId` (dropdown) | CSR | inline schema |
| 25 | Transactions | GET | `/landlord/tenants/:landlordId` (dropdown) | CSR | `tenantListSchema` |
| 26 | Transactions | POST | `/landlord/transaction/:landlordId` | CSR | — |
| 27 | Transactions | POST | `/landlord/work-order/transaction/:landlordId/:workOrderId` | CSR | — |
| 28 | Transactions | PATCH | `/landlord/utility-bill/pay/:landlordId/:transactionId` | CSR | — |
| 29 | Transactions | GET | `/landlord/tenant/transactions/:landlordId/:tenantId` | CSR | `transactionListSchema` |
| 30 | WorkOrders | GET | `/landlord/workorders/:landlordId` | CSR | `workOrderListSchema` |
| 31 | WorkOrders | GET | `/landlord/transactions/:landlordId` | CSR | `transactionListSchema` |
| 32 | WorkOrders | POST | `/landlord/work-order/transaction/:landlordId/:id` | CSR | — |
| 33 | WorkOrders | GET | `/landlord/transactions/:landlordId` (refresh) | CSR | `transactionListSchema` |
| 34 | WorkOrders/[workorders] | GET | `/landlord/workorders/:landlordId` (then `.find()`) | SSR | `workOrderListSchema` |

## A.2 Staff (35 calls)

| # | Page | Method | Endpoint | Render | Zod schema |
|---|---|---|---|---|---|
| 1 | dashboard | GET | `/staff/dashboard/stats` | SSR | `dashboardStatsSchema` |
| 2 | dashboard | GET | `/staff/issues?limit=5` | SSR | `issueSchema` (wrapped) |
| 3 | dashboard | GET | `/staff/workers?status=busy&limit=5` | SSR | `workerSchema` (wrapped) |
| 4 | admins | GET | `/staff/admins` | CSR | `adminSchema` |
| 5 | blocks | GET | `/staff/blocks` | CSR | `blockSchema` |
| 6 | buildings | GET | `/staff/buildings` | CSR | `buildingSchema` |
| 7 | landlords | GET | `/staff/landlords` | CSR | `landlordSchema` |
| 8 | tenants | GET | `/staff/tenants` | CSR | `tenantSchema` |
| 9 | tenants/[id] | GET | `/staff/tenants/:id` | CSR | `tenantSchema` |
| 10 | properties | GET | `/staff/properties` | CSR | `propertySchema` |
| 11 | properties/[id] | GET | `/staff/properties/:id` | CSR | `propertySchema` |
| 12 | issues | GET | `/staff/issues` | CSR | `issueSchema` |
| 13 | issues/[id] | GET | `/staff/issues/:id` | CSR | `issueSchema` |
| 14 | issues/[id] | PATCH | `/staff/issues/:id/status` | CSR | — |
| 15 | work-orders | GET | `/staff/work-orders` | CSR | `workOrderSchema` |
| 16 | work-orders/new | POST | `/staff/work-orders?staffId=X` | CSR | manual checks |
| 17 | work-orders/[id] | GET | `/staff/work-orders/:id` | CSR | `workOrderSchema` |
| 18 | work-orders/[id] | PATCH | `/staff/work-orders/:id` | CSR | — |
| 19 | work-orders/[id] | PATCH | `/staff/work-orders/:id/dispatch` | CSR | — |
| 20 | work-orders/[id] | PATCH | `/staff/work-orders/:id/remove-worker` | CSR | — |
| 21 | work-orders/[id] | PATCH | `/staff/work-orders/:id/complete` | CSR | — |
| 22 | work-orders/[id] | PATCH | `/staff/work-orders/:id/confirm-tenant` | CSR | — |
| 23 | work-orders/[id] | PATCH | `/staff/work-orders/:id/reopen` | CSR | — |
| 24 | work-orders/[id] | DELETE | `/staff/work-orders/:id` | CSR | — |
| 25 | workers | GET | `/staff/workers` | CSR | `workerSchema` |
| 26 | workers/new | POST | `/staff/:staffId/workers` | CSR | manual checks |
| 27 | workers/[id] | GET | `/staff/workers/:id` | CSR | `workerSchema` |
| 28 | workers/[id] | PATCH | `/staff/workers/:id` | CSR | — |
| 29 | workers/[id] | PATCH | `/staff/workers/:id/toggle-status` | CSR | — |
| 30 | workers/[id] | DELETE | `/staff/workers/:id` | CSR | — |
| 31 | workers/[id]/schedule | GET | `/staff/workers/:id/schedule` | CSR | `scheduleSchema` |
| 32 | workers/[id]/performance | GET | `/staff/workers/:id/performance` | CSR | `perfSchema` |
| 33 | reports/work-order-summary | GET | `/staff/reports/work-order-summary` | CSR | `rowSchema` |
| 34 | reports/worker-performance | GET | `/staff/reports/worker-performance` | CSR | `rowSchema` |
| 35 | profile | PATCH | `/staff/profile` | CSR | manual checks |
