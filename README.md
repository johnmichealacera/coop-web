# Island Co-op (`coop-web`)

React app for a cooperative **operations platform**: members, loans, treasury, accounting, MIGS, patronage, reporting, and admin. Runs against **Supabase** when configured, or **local bundled data** until you connect a project.

## Stack

- **React** + **TypeScript** + **Vite**
- **Tailwind CSS v4** + **shadcn/ui**
- **React Router**
- **Supabase** (optional — without credentials the app uses **local data** in the browser)

## What this app does

- **Dashboard** — member counts, MIGS vs non-MIGS, open loan pipeline count, posted GL count, shortcuts into modules.
- **Operations modules** (`/modules/*`) — working flows with Supabase or local data:
  - **Loans** — loan applications with status workflow (submit → verify → approve → journalize).
  - **Treasury** — receipts, withdrawals, transfers, disbursements by member and SL product.
  - **Accounting** — chart of accounts, balanced journal entries, post draft, batch-style receipt journal (collection vs SL).
  - **POS & inventory** — suppliers, SKUs, stock receive/issue.
  - **Reports** — KPIs and loan/treasury listings from live data.
  - **Budget** — budget periods, GL targets, submit/approve/cancel tagging.
  - **Admin** — branches (view), lookup categories and values (CRUD).
- **Members & MIGS** (`/members`) — member directory; per-member annual inputs and **live MIGS score** (total ≥ 75 → MIGS).
- **Patronage / DPR** (`/patronage`) — patronage allocation fields (share capital, int paid, dividend, gross DPR, etc.).
- **MIGS criteria** (`/criteria`) — scoring breakdown and component weights.

## Feature coverage vs. legacy reference materials

The parent folder may contain **legacy PDF guides** (desktop install, backups, hardware, etc.) and **Excel workbooks** (loan math). This app does not mirror every document: some materials describe **infrastructure** that does not apply to a browser-based system.

| Domain | In the app | Not included (typical reason) |
|--------|------------|------------------------------|
| Members / client profile | Members list, detail, branch | Bulk client migration UI |
| MIGS criteria & annual inputs | Scoring engine, `/criteria`, assessments | — |
| Loan processing | Applications, workflow, **payment & amortization calculator** | Legacy SQL-only loan table workflows |
| Treasury | Receipts, withdrawals, transfers, disbursements, SL-style products | ATM switch, passbook printer |
| GL / COA / journals | COA list, balanced entries, post, batch receipt journal | Year-end closing automation |
| Lookups | Categories & values (admin CRUD) | — |
| POS / inventory | Suppliers, items, stock movements | Full POS invoice printing |
| Reports | Module KPIs and listings | Full FS generator / customization suite |
| Budget | Periods, GL targets, status | — |
| Patronage / DPR | Allocation fields & list | — |
| Excel annuity / ADB | `loan-calculations.ts` + Loans calculator UI; ADB helper | Pasting full bank statement grids |
| Install, backup, MySQL, legacy desktop update | — | **Out of scope** for this product |

Use repository PDFs/XLS only as **reference** when extending features; the app does not embed those files.

## Prerequisites

- Node.js 20+ recommended
- npm (ships with Node)

## Local development

```bash
cd coop-web
npm install
npm run dev
```

Open the URL Vite prints (usually `http://localhost:5173`).

## Environment variables

Copy the example file and fill in values from the Supabase project **Settings → API**:

```bash
cp .env.example .env
```

| Variable | Purpose |
|----------|---------|
| `VITE_SUPABASE_URL` | Project URL (`https://<project-ref>.supabase.co`) |
| `VITE_SUPABASE_ANON_KEY` | `anon` **public** key (safe for the browser) |

If either variable is missing, the UI uses **local data** and shows a **Local data** badge.

## Supabase: database migration (schema)

The canonical DDL is **`supabase/schema.sql`**. It creates:

- **Core:** `branches`, `members`, `migs_assessments`, `patronage_allocations`
- **Operations:** `loan_applications`, `treasury_transactions`, `chart_of_accounts`, `journal_entries`, `journal_lines`, `lookup_categories`, `lookup_values`, `suppliers`, `inventory_items`, `stock_movements`, `budget_periods`, `budget_lines`
- Row Level Security with permissive policies for anonymous access (**replace with authenticated policies before production**)
- A single seed row: **Main Office** branch (`code = 1`)

### Option A — Supabase Dashboard (simplest)

1. In [Supabase](https://supabase.com), open your project.
2. Go to **SQL Editor** → **New query**.
3. Paste the full contents of `supabase/schema.sql`.
4. Click **Run**.

If you **already ran** an older “core only” script (four tables: branches, members, migs_assessments, patronage_allocations) and did **not** yet add loans/treasury/GL/etc., run **`supabase/schema_incremental_operational.sql`** once instead of re-running the full file (re-running the top of `schema.sql` would try to recreate existing policies and can error). New projects should use the full `schema.sql`.

### Option B — `psql` (CLI)

1. In **Project Settings → Database**, copy the **URI** connection string (use the **transaction** pooler or direct host as you prefer).
2. Run:

```bash
psql "postgresql://postgres.[ref]:[YOUR-PASSWORD]@aws-0-[region].pooler.supabase.com:6543/postgres" -f supabase/schema.sql
```

Replace the URI with the exact string from the dashboard (and never commit passwords).

### Option C — Supabase CLI

If you use the [Supabase CLI](https://supabase.com/docs/guides/cli) linked to this project, you can execute the file against the remote database (exact command depends on your CLI version). The usual pattern is to paste `schema.sql` into the SQL Editor once, or use `supabase db execute` / migrations after `supabase init` — use whatever matches your team’s workflow; **Option A** is enough for initial setup.

## Supabase: optional seed data

After the migration succeeds, you can load starter members, a MIGS assessment, and a patronage row:

1. **SQL Editor** → new query → paste **`supabase/seed.sql`** → **Run**.

Or with `psql`:

```bash
psql "$YOUR_DATABASE_URL" -f supabase/seed.sql
```

The seed is idempotent: it will not duplicate the same member/year or duplicate patronage if data already exists.

## Deploy (Vercel)

Import this repo with **Root Directory** set to **`coop-web`**. Vercel will run `npm run build` and serve `dist`. **`vercel.json`** rewrites all routes to `index.html` so React Router works.

Add **`VITE_SUPABASE_URL`** and **`VITE_SUPABASE_ANON_KEY`** in the project’s **Environment Variables** (same values as local `.env`).

## Project scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server |
| `npm run build` | Production build |
| `npm run preview` | Preview production build locally |
