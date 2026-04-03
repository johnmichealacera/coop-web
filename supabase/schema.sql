-- SOEMCO Co-op MVP schema (MIGS assessments, patronage/DPR fields, operational modules)
-- Run in Supabase SQL Editor or via supabase db push after linking.

create extension if not exists "uuid-ossp";

create table if not exists public.branches (
  id uuid primary key default gen_random_uuid(),
  code integer not null unique,
  name text not null,
  created_at timestamptz default now()
);

create table if not exists public.members (
  id uuid primary key default gen_random_uuid(),
  branch_id uuid not null references public.branches (id) on delete cascade,
  client_id text not null,
  full_name text not null,
  date_opened date,
  created_at timestamptz default now(),
  unique (branch_id, client_id)
);

-- Raw annual inputs for MIGS (matches MODIFIED NICO MIGS CRITERIA QUERY second-layer fields)
create table if not exists public.migs_assessments (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.members (id) on delete cascade,
  assessment_year integer not null,
  cutoff_date date not null,
  sales_invoice numeric default 0,
  any_amount_last_year numeric default 0,
  cac_products numeric default 0,
  loan_release numeric default 0,
  loan_payments numeric default 0,
  capital_buildup numeric default 0,
  basic_shares numeric default 0,
  delinquency_days numeric default 0,
  charge_off numeric default 0,
  kaagapay1 numeric default 0,
  kaagapay2 numeric default 0,
  savings numeric default 0,
  time_deposits numeric default 0,
  attendance_count integer default 0,
  -- persisted computed summary (optional; app also recomputes)
  total_score numeric,
  rating text check (rating in ('MIGS', 'NON-MIGS')),
  created_at timestamptz default now(),
  unique (member_id, assessment_year)
);

-- DPR / patronage allocation (SIMC wkfcavg-style columns, simplified)
create table if not exists public.patronage_allocations (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.members (id) on delete cascade,
  period_from date not null,
  period_to date not null,
  share_capital numeric default 0,
  avg_share_capital numeric default 0,
  int_paid numeric default 0,
  dividend numeric default 0,
  patronage numeric default 0,
  gross_dpr numeric default 0,
  explanation text,
  created_at timestamptz default now()
);

alter table public.branches enable row level security;
alter table public.members enable row level security;
alter table public.migs_assessments enable row level security;
alter table public.patronage_allocations enable row level security;

-- MVP: open read/write for anon (replace with auth policies before production)
create policy "branches_all" on public.branches for all using (true) with check (true);
create policy "members_all" on public.members for all using (true) with check (true);
create policy "migs_all" on public.migs_assessments for all using (true) with check (true);
create policy "patronage_all" on public.patronage_allocations for all using (true) with check (true);

insert into public.branches (code, name)
values (1, 'Main Office')
on conflict (code) do nothing;

-- Optional demo rows after first deploy (uncomment if you want SQL seed)
-- insert into public.members (branch_id, client_id, full_name, date_opened)
-- select b.id, '100001', 'Sample Member', '2020-01-15'::date
-- from public.branches b where b.code = 1 limit 1
-- on conflict (branch_id, client_id) do nothing;

-- ========== Operational modules (MVP) ==========
-- Loans: application workflow (verify → approve → journalize)
create table if not exists public.loan_applications (
  id uuid primary key default gen_random_uuid(),
  branch_id uuid not null references public.branches (id) on delete cascade,
  member_id uuid not null references public.members (id) on delete cascade,
  reference_no text,
  loan_type text not null default 'general',
  principal numeric not null default 0,
  term_months int not null default 12,
  monthly_rate numeric default 0,
  deductions_total numeric default 0,
  net_proceeds numeric default 0,
  status text not null default 'draft'
    check (status in ('draft','submitted','verified','approved','journalized','disapproved','cancelled')),
  notes text,
  created_at timestamptz default now()
);

-- Treasury: receipt, withdrawal, transfer, disbursement
create table if not exists public.treasury_transactions (
  id uuid primary key default gen_random_uuid(),
  branch_id uuid not null references public.branches (id) on delete cascade,
  member_id uuid references public.members (id) on delete set null,
  tx_type text not null
    check (tx_type in ('receipt','withdrawal','transfer_out','transfer_in','disbursement')),
  product text not null default 'savings',
  amount numeric not null,
  reference text,
  trans_date date not null default (current_date),
  memo text,
  created_at timestamptz default now()
);

-- Chart of accounts
create table if not exists public.chart_of_accounts (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  account_type text not null
    check (account_type in ('asset','liability','equity','income','expense')),
  active boolean default true
);

-- General journal
create table if not exists public.journal_entries (
  id uuid primary key default gen_random_uuid(),
  branch_id uuid not null references public.branches (id) on delete cascade,
  entry_date date not null,
  journal_type text not null default 'general',
  reference text,
  memo text,
  status text not null default 'draft' check (status in ('draft','posted')),
  created_at timestamptz default now()
);

create table if not exists public.journal_lines (
  id uuid primary key default gen_random_uuid(),
  journal_entry_id uuid not null references public.journal_entries (id) on delete cascade,
  coa_code text not null,
  description text,
  debit numeric not null default 0,
  credit numeric not null default 0,
  member_id uuid references public.members (id) on delete set null
);

-- Lookup categories and values (admin-configurable)
create table if not exists public.lookup_categories (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null
);

create table if not exists public.lookup_values (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.lookup_categories (id) on delete cascade,
  code text not null,
  description text not null default '',
  sort_order int default 0,
  active boolean default true,
  unique (category_id, code)
);

-- POS / inventory (suppliers, SKUs, stock movements)
create table if not exists public.suppliers (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  contact text,
  created_at timestamptz default now()
);

create table if not exists public.inventory_items (
  id uuid primary key default gen_random_uuid(),
  sku text not null unique,
  name text not null,
  unit text default 'pc',
  qty_on_hand numeric not null default 0,
  reorder_level numeric default 0
);

create table if not exists public.stock_movements (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references public.inventory_items (id) on delete cascade,
  movement_type text not null check (movement_type in ('in','out','transfer')),
  qty numeric not null,
  reference text,
  trans_date date not null default (current_date),
  memo text,
  created_at timestamptz default now()
);

-- Budget periods and GL line targets
create table if not exists public.budget_periods (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  label text not null,
  fiscal_year int not null,
  period_start date not null,
  period_end date not null,
  status text not null default 'draft'
    check (status in ('draft','submitted','approved','cancelled')),
  created_at timestamptz default now()
);

create table if not exists public.budget_lines (
  id uuid primary key default gen_random_uuid(),
  budget_period_id uuid not null references public.budget_periods (id) on delete cascade,
  coa_code text not null,
  target_amount numeric not null default 0,
  notes text
);

alter table public.loan_applications enable row level security;
alter table public.treasury_transactions enable row level security;
alter table public.chart_of_accounts enable row level security;
alter table public.journal_entries enable row level security;
alter table public.journal_lines enable row level security;
alter table public.lookup_categories enable row level security;
alter table public.lookup_values enable row level security;
alter table public.suppliers enable row level security;
alter table public.inventory_items enable row level security;
alter table public.stock_movements enable row level security;
alter table public.budget_periods enable row level security;
alter table public.budget_lines enable row level security;

create policy "loan_applications_all" on public.loan_applications for all using (true) with check (true);
create policy "treasury_all" on public.treasury_transactions for all using (true) with check (true);
create policy "coa_all" on public.chart_of_accounts for all using (true) with check (true);
create policy "journal_entries_all" on public.journal_entries for all using (true) with check (true);
create policy "journal_lines_all" on public.journal_lines for all using (true) with check (true);
create policy "lookup_cat_all" on public.lookup_categories for all using (true) with check (true);
create policy "lookup_val_all" on public.lookup_values for all using (true) with check (true);
create policy "suppliers_all" on public.suppliers for all using (true) with check (true);
create policy "inventory_items_all" on public.inventory_items for all using (true) with check (true);
create policy "stock_mov_all" on public.stock_movements for all using (true) with check (true);
create policy "budget_periods_all" on public.budget_periods for all using (true) with check (true);
create policy "budget_lines_all" on public.budget_lines for all using (true) with check (true);
