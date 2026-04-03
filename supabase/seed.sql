-- Optional seed data (run after supabase/schema.sql).
-- Safe to run multiple times: uses ON CONFLICT / WHERE NOT EXISTS where needed.

insert into public.members (branch_id, client_id, full_name, date_opened)
select b.id, '100001', 'Sample Member', '2020-01-15'::date
from public.branches b
where b.code = 1
limit 1
on conflict (branch_id, client_id) do nothing;

insert into public.migs_assessments (
  member_id,
  assessment_year,
  cutoff_date,
  sales_invoice,
  loan_release,
  loan_payments,
  capital_buildup,
  basic_shares,
  delinquency_days,
  charge_off,
  kaagapay1,
  savings,
  time_deposits,
  attendance_count,
  total_score,
  rating
)
select
  m.id,
  2024,
  '2024-12-31'::date,
  1200,
  5000,
  2000,
  2000,
  45000,
  0,
  0,
  1200,
  5000,
  10000,
  2,
  100,
  'MIGS'
from public.members m
join public.branches b on b.id = m.branch_id
where b.code = 1 and m.client_id = '100001'
  and not exists (
    select 1
    from public.migs_assessments a
    where a.member_id = m.id and a.assessment_year = 2024
  );

insert into public.patronage_allocations (
  member_id,
  period_from,
  period_to,
  share_capital,
  avg_share_capital,
  int_paid,
  dividend,
  patronage,
  gross_dpr,
  explanation
)
select
  m.id,
  '2024-01-01'::date,
  '2024-12-31'::date,
  45000,
  42000,
  2100,
  1500,
  800,
  2300,
  'Illustrative allocation for reporting review.'
from public.members m
join public.branches b on b.id = m.branch_id
where b.code = 1 and m.client_id = '100001'
  and not exists (
    select 1 from public.patronage_allocations p where p.member_id = m.id
  );

-- Chart of accounts (for journal / batch posting demos)
insert into public.chart_of_accounts (code, name, account_type) values
  ('1010', 'Cash on hand', 'asset'),
  ('2101', 'Members savings deposit', 'liability'),
  ('2201', 'Time deposits liability', 'liability'),
  ('3101', 'Share capital', 'equity'),
  ('42021', 'Sales / patronage', 'income')
on conflict (code) do nothing;

insert into public.lookup_categories (code, name) values
  ('LOAN_TYPE', 'Loan types'),
  ('DEPT', 'Departments')
on conflict (code) do nothing;

insert into public.lookup_values (category_id, code, description, sort_order)
select c.id, 'SAL', 'Salary loan', 1
from public.lookup_categories c
where c.code = 'LOAN_TYPE'
  and not exists (
    select 1 from public.lookup_values v
    where v.category_id = c.id and v.code = 'SAL'
  );

insert into public.loan_applications (
  branch_id, member_id, reference_no, loan_type, principal, term_months, monthly_rate,
  deductions_total, net_proceeds, status, notes
)
select
  b.id,
  m.id,
  'LN-SEED-01',
  'business',
  50000,
  24,
  0.02,
  2500,
  47500,
  'verified',
  'Seed from seed.sql'
from public.branches b
join public.members m on m.branch_id = b.id
where b.code = 1 and m.client_id = '100001'
  and not exists (select 1 from public.loan_applications la where la.reference_no = 'LN-SEED-01')
limit 1;
