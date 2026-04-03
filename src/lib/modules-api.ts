import { isSupabaseConfigured, supabase } from '@/lib/supabase'
import type {
  BudgetLine,
  BudgetPeriod,
  ChartOfAccountRow,
  DashboardModuleStats,
  InventoryItem,
  JournalEntry,
  JournalLine,
  LoanApplication,
  LoanStatus,
  LookupCategory,
  LookupValue,
  StockMovement,
  Supplier,
  TreasuryTransaction,
} from '@/lib/module-types'
import { listBranches } from '@/lib/data'
import type { Member } from '@/lib/types'

const DEMO_B = '00000000-0000-4000-8000-000000000001'
const DEMO_M1 = '00000000-0000-4000-8000-0000000000a1'

let mockLoans: LoanApplication[] = [
  {
    id: '00000000-0000-4000-8000-00000000d001',
    branch_id: DEMO_B,
    member_id: DEMO_M1,
    reference_no: 'LN-2024-001',
    loan_type: 'business',
    principal: 50000,
    term_months: 24,
    monthly_rate: 0.02,
    deductions_total: 2500,
    net_proceeds: 47500,
    status: 'verified',
    notes: 'Demo loan application',
    created_at: new Date().toISOString(),
  },
]

let mockTreasury: TreasuryTransaction[] = [
  {
    id: '00000000-0000-4000-8000-00000000e001',
    branch_id: DEMO_B,
    member_id: DEMO_M1,
    tx_type: 'receipt',
    product: 'savings',
    amount: 5000,
    reference: 'RC-001',
    trans_date: new Date().toISOString().slice(0, 10),
    memo: 'Member savings deposit',
    created_at: new Date().toISOString(),
  },
]

let mockCoa: ChartOfAccountRow[] = [
  {
    id: '00000000-0000-4000-8000-00000000f001',
    code: '1010',
    name: 'Cash on hand',
    account_type: 'asset',
    active: true,
  },
  {
    id: '00000000-0000-4000-8000-00000000f002',
    code: '2101',
    name: 'Members savings deposit',
    account_type: 'liability',
    active: true,
  },
  {
    id: '00000000-0000-4000-8000-00000000f003',
    code: '42021',
    name: 'Sales / patronage',
    account_type: 'income',
    active: true,
  },
  {
    id: '00000000-0000-4000-8000-00000000f004',
    code: '2201',
    name: 'Time deposits liability',
    account_type: 'liability',
    active: true,
  },
  {
    id: '00000000-0000-4000-8000-00000000f005',
    code: '3101',
    name: 'Share capital',
    account_type: 'equity',
    active: true,
  },
]

let mockJournals: JournalEntry[] = []
let mockJournalLines: JournalLine[] = []

let mockLookupCats: LookupCategory[] = [
  {
    id: '00000000-0000-4000-8000-00000000c001',
    code: 'LOAN_TYPE',
    name: 'Loan types',
  },
  {
    id: '00000000-0000-4000-8000-00000000c002',
    code: 'DEPT',
    name: 'Departments',
  },
]

let mockLookupVals: LookupValue[] = [
  {
    id: '00000000-0000-4000-8000-00000000v001',
    category_id: '00000000-0000-4000-8000-00000000c001',
    code: 'SAL',
    description: 'Salary loan',
    sort_order: 1,
    active: true,
  },
  {
    id: '00000000-0000-4000-8000-00000000v002',
    category_id: '00000000-0000-4000-8000-00000000c002',
    code: 'OPS',
    description: 'Operations',
    sort_order: 1,
    active: true,
  },
]

let mockSuppliers: Supplier[] = [
  {
    id: '00000000-0000-4000-8000-00000000s001',
    code: 'SUP-01',
    name: 'Island Wholesale',
    contact: 'procurement@example.local',
    created_at: new Date().toISOString(),
  },
]

let mockItems: InventoryItem[] = [
  {
    id: '00000000-0000-4000-8000-00000000i001',
    sku: 'SKU-RICE25',
    name: 'Rice 25kg',
    unit: 'bag',
    qty_on_hand: 120,
    reorder_level: 20,
  },
]

let mockStock: StockMovement[] = []

let mockBudgetPeriods: BudgetPeriod[] = [
  {
    id: '00000000-0000-4000-8000-00000000bp01',
    code: 'FY2024',
    label: 'Fiscal 2024',
    fiscal_year: 2024,
    period_start: '2024-01-01',
    period_end: '2024-12-31',
    status: 'draft',
    created_at: new Date().toISOString(),
  },
]

let mockBudgetLines: BudgetLine[] = [
  {
    id: '00000000-0000-4000-8000-00000000bl01',
    budget_period_id: '00000000-0000-4000-8000-00000000bp01',
    coa_code: '42021',
    target_amount: 500000,
    notes: 'Patronage revenue target',
  },
]

function netFromPrincipal(principal: number, deductions: number): number {
  return Math.round((principal - deductions) * 100) / 100
}

export async function listLoanApplications(): Promise<LoanApplication[]> {
  if (supabase && isSupabaseConfigured) {
    const { data, error } = await supabase
      .from('loan_applications')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) throw error
    return data as LoanApplication[]
  }
  return [...mockLoans]
}

export type CreateLoanInput = {
  member_id: string
  loan_type: string
  principal: number
  term_months: number
  monthly_rate: number
  deductions_total: number
  notes?: string
}

export async function createLoanApplication(
  input: CreateLoanInput,
): Promise<LoanApplication> {
  const branches = await listBranches()
  const branchId = branches[0]?.id
  if (!branchId) throw new Error('No branch')

  const net = netFromPrincipal(input.principal, input.deductions_total)
  const ref = `LN-${Date.now().toString(36).toUpperCase().slice(-4)}`

  const row: LoanApplication = {
    id: crypto.randomUUID(),
    branch_id: branchId,
    member_id: input.member_id,
    reference_no: ref,
    loan_type: input.loan_type,
    principal: input.principal,
    term_months: input.term_months,
    monthly_rate: input.monthly_rate,
    deductions_total: input.deductions_total,
    net_proceeds: net,
    status: 'draft',
    notes: input.notes ?? null,
    created_at: new Date().toISOString(),
  }

  if (supabase && isSupabaseConfigured) {
    const { data, error } = await supabase
      .from('loan_applications')
      .insert(row)
      .select()
      .single()
    if (error) throw error
    return data as LoanApplication
  }
  mockLoans = [row, ...mockLoans]
  return row
}

export type LoanAction =
  | 'submit'
  | 'verify'
  | 'approve'
  | 'journalize'
  | 'disapprove'
  | 'cancel'

export async function advanceLoanStatus(
  id: string,
  action: LoanAction,
): Promise<LoanApplication> {
  const loans = await listLoanApplications()
  const current = loans.find((l) => l.id === id)
  if (!current) throw new Error('Loan not found')

  let next: LoanStatus = current.status
  switch (action) {
    case 'submit':
      if (current.status !== 'draft') throw new Error('Only draft can be submitted')
      next = 'submitted'
      break
    case 'verify':
      if (current.status !== 'submitted')
        throw new Error('Only submitted loans can be verified')
      next = 'verified'
      break
    case 'approve':
      if (current.status !== 'verified')
        throw new Error('Only verified loans can be approved')
      next = 'approved'
      break
    case 'journalize':
      if (current.status !== 'approved')
        throw new Error('Only approved loans can be journalized')
      next = 'journalized'
      break
    case 'disapprove':
      if (!['draft', 'submitted', 'verified'].includes(current.status))
        throw new Error('Cannot disapprove at this stage')
      next = 'disapproved'
      break
    case 'cancel':
      if (['journalized', 'disapproved', 'cancelled'].includes(current.status))
        throw new Error('Cannot cancel')
      next = 'cancelled'
      break
    default:
      throw new Error('Unknown action')
  }

  if (supabase && isSupabaseConfigured) {
    const { data, error } = await supabase
      .from('loan_applications')
      .update({ status: next })
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data as LoanApplication
  }
  mockLoans = mockLoans.map((l) =>
    l.id === id ? { ...l, status: next } : l,
  )
  return { ...current, status: next }
}

export async function listTreasuryTransactions(): Promise<
  TreasuryTransaction[]
> {
  if (supabase && isSupabaseConfigured) {
    const { data, error } = await supabase
      .from('treasury_transactions')
      .select('*')
      .order('trans_date', { ascending: false })
    if (error) throw error
    return data as TreasuryTransaction[]
  }
  return [...mockTreasury]
}

export type CreateTreasuryInput = {
  member_id: string
  tx_type: TreasuryTransaction['tx_type']
  product: string
  amount: number
  reference?: string
  trans_date: string
  memo?: string
}

export async function createTreasuryTransaction(
  input: CreateTreasuryInput,
): Promise<TreasuryTransaction> {
  const branches = await listBranches()
  const branchId = branches[0]?.id
  if (!branchId) throw new Error('No branch')

  const row: TreasuryTransaction = {
    id: crypto.randomUUID(),
    branch_id: branchId,
    member_id: input.member_id,
    tx_type: input.tx_type,
    product: input.product,
    amount: Math.abs(input.amount),
    reference: input.reference ?? null,
    trans_date: input.trans_date,
    memo: input.memo ?? null,
    created_at: new Date().toISOString(),
  }

  if (supabase && isSupabaseConfigured) {
    const { data, error } = await supabase
      .from('treasury_transactions')
      .insert(row)
      .select()
      .single()
    if (error) throw error
    return data as TreasuryTransaction
  }
  mockTreasury = [row, ...mockTreasury]
  return row
}

export async function listChartOfAccounts(): Promise<ChartOfAccountRow[]> {
  if (supabase && isSupabaseConfigured) {
    const { data, error } = await supabase
      .from('chart_of_accounts')
      .select('*')
      .order('code')
    if (error) throw error
    return data as ChartOfAccountRow[]
  }
  return [...mockCoa]
}

export async function listJournalEntries(): Promise<
  (JournalEntry & { lines?: JournalLine[] })[]
> {
  if (supabase && isSupabaseConfigured) {
    const { data: entries, error } = await supabase
      .from('journal_entries')
      .select('*')
      .order('entry_date', { ascending: false })
    if (error) throw error
    const { data: lines } = await supabase.from('journal_lines').select('*')
    const byJ = new Map<string, JournalLine[]>()
    for (const ln of (lines ?? []) as JournalLine[]) {
      const arr = byJ.get(ln.journal_entry_id) ?? []
      arr.push(ln)
      byJ.set(ln.journal_entry_id, arr)
    }
    return (entries as JournalEntry[]).map((e) => ({
      ...e,
      lines: byJ.get(e.id),
    }))
  }
  return mockJournals.map((e) => ({
    ...e,
    lines: mockJournalLines.filter((l) => l.journal_entry_id === e.id),
  }))
}

export type CreateJournalInput = {
  entry_date: string
  journal_type: string
  reference?: string
  memo?: string
  lines: { coa_code: string; description?: string; debit: number; credit: number; member_id?: string | null }[]
}

export async function createJournalEntry(
  input: CreateJournalInput,
): Promise<{ entry: JournalEntry; lines: JournalLine[] }> {
  const debit = input.lines.reduce((s, l) => s + l.debit, 0)
  const credit = input.lines.reduce((s, l) => s + l.credit, 0)
  if (Math.abs(debit - credit) > 0.001) throw new Error('Debits must equal credits')

  const branches = await listBranches()
  const branchId = branches[0]?.id
  if (!branchId) throw new Error('No branch')

  const entry: JournalEntry = {
    id: crypto.randomUUID(),
    branch_id: branchId,
    entry_date: input.entry_date,
    journal_type: input.journal_type,
    reference: input.reference ?? null,
    memo: input.memo ?? null,
    status: 'draft',
    created_at: new Date().toISOString(),
  }

  const lines: JournalLine[] = input.lines.map((l) => ({
    id: crypto.randomUUID(),
    journal_entry_id: entry.id,
    coa_code: l.coa_code,
    description: l.description ?? null,
    debit: l.debit,
    credit: l.credit,
    member_id: l.member_id ?? null,
  }))

  if (supabase && isSupabaseConfigured) {
    const { error: e1 } = await supabase.from('journal_entries').insert(entry)
    if (e1) throw e1
    const { error: e2 } = await supabase.from('journal_lines').insert(lines)
    if (e2) throw e2
    return { entry, lines }
  }
  mockJournals = [entry, ...mockJournals]
  mockJournalLines = [...lines, ...mockJournalLines]
  return { entry, lines }
}

export async function postJournalEntry(id: string): Promise<JournalEntry> {
  const entries = await listJournalEntries()
  const e = entries.find((x) => x.id === id)
  if (!e) throw new Error('Journal not found')
  if (e.status !== 'draft') throw new Error('Only draft can be posted')

  if (supabase && isSupabaseConfigured) {
    const { data, error } = await supabase
      .from('journal_entries')
      .update({ status: 'posted' })
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data as JournalEntry
  }
  mockJournals = mockJournals.map((j) =>
    j.id === id ? { ...j, status: 'posted' as const } : j,
  )
  return { ...e, status: 'posted' }
}

export async function listLookupCategories(): Promise<LookupCategory[]> {
  if (supabase && isSupabaseConfigured) {
    const { data, error } = await supabase
      .from('lookup_categories')
      .select('*')
      .order('code')
    if (error) throw error
    return data as LookupCategory[]
  }
  return [...mockLookupCats]
}

export async function listLookupValues(
  categoryId?: string,
): Promise<LookupValue[]> {
  if (supabase && isSupabaseConfigured) {
    let q = supabase.from('lookup_values').select('*').order('sort_order')
    if (categoryId) q = q.eq('category_id', categoryId)
    const { data, error } = await q
    if (error) throw error
    return data as LookupValue[]
  }
  return mockLookupVals.filter(
    (v) => !categoryId || v.category_id === categoryId,
  )
}

export async function createLookupValue(input: {
  category_id: string
  code: string
  description: string
}): Promise<LookupValue> {
  const row: LookupValue = {
    id: crypto.randomUUID(),
    category_id: input.category_id,
    code: input.code.trim(),
    description: input.description,
    sort_order: 0,
    active: true,
  }
  if (supabase && isSupabaseConfigured) {
    const { data, error } = await supabase
      .from('lookup_values')
      .insert(row)
      .select()
      .single()
    if (error) throw error
    return data as LookupValue
  }
  mockLookupVals = [...mockLookupVals, row]
  return row
}

export async function createLookupCategory(input: {
  code: string
  name: string
}): Promise<LookupCategory> {
  const row: LookupCategory = {
    id: crypto.randomUUID(),
    code: input.code.trim().toUpperCase(),
    name: input.name,
  }
  if (supabase && isSupabaseConfigured) {
    const { data, error } = await supabase
      .from('lookup_categories')
      .insert(row)
      .select()
      .single()
    if (error) throw error
    return data as LookupCategory
  }
  mockLookupCats = [...mockLookupCats, row]
  return row
}

export async function listSuppliers(): Promise<Supplier[]> {
  if (supabase && isSupabaseConfigured) {
    const { data, error } = await supabase
      .from('suppliers')
      .select('*')
      .order('code')
    if (error) throw error
    return data as Supplier[]
  }
  return [...mockSuppliers]
}

export async function listInventoryItems(): Promise<InventoryItem[]> {
  if (supabase && isSupabaseConfigured) {
    const { data, error } = await supabase
      .from('inventory_items')
      .select('*')
      .order('sku')
    if (error) throw error
    return data as InventoryItem[]
  }
  return [...mockItems]
}

export async function createStockMovement(input: {
  item_id: string
  movement_type: StockMovement['movement_type']
  qty: number
  reference?: string
  trans_date: string
  memo?: string
}): Promise<StockMovement> {
  const qty = Math.abs(input.qty)
  const row: StockMovement = {
    id: crypto.randomUUID(),
    item_id: input.item_id,
    movement_type: input.movement_type,
    qty: input.movement_type === 'out' ? -qty : qty,
    reference: input.reference ?? null,
    trans_date: input.trans_date,
    memo: input.memo ?? null,
    created_at: new Date().toISOString(),
  }

  if (supabase && isSupabaseConfigured) {
    const { data, error } = await supabase
      .from('stock_movements')
      .insert({
        ...row,
        qty:
          input.movement_type === 'out'
            ? -qty
            : input.movement_type === 'in'
              ? qty
              : qty,
      })
      .select()
      .single()
    if (error) throw error
    const { data: item } = await supabase
      .from('inventory_items')
      .select('qty_on_hand')
      .eq('id', input.item_id)
      .single()
    const onHand = Number(item?.qty_on_hand ?? 0)
    const delta =
      input.movement_type === 'in'
        ? qty
        : input.movement_type === 'out'
          ? -qty
          : 0
    await supabase
      .from('inventory_items')
      .update({ qty_on_hand: onHand + delta })
      .eq('id', input.item_id)
    return data as StockMovement
  }

  mockStock = [row, ...mockStock]
  mockItems = mockItems.map((it) => {
    if (it.id !== input.item_id) return it
    const delta =
      input.movement_type === 'in'
        ? qty
        : input.movement_type === 'out'
          ? -qty
          : 0
    return {
      ...it,
      qty_on_hand: Math.round((it.qty_on_hand + delta) * 100) / 100,
    }
  })
  return row
}

export async function listBudgetPeriods(): Promise<
  (BudgetPeriod & { lines?: BudgetLine[] })[]
> {
  if (supabase && isSupabaseConfigured) {
    const { data: periods, error } = await supabase
      .from('budget_periods')
      .select('*')
      .order('fiscal_year', { ascending: false })
    if (error) throw error
    const { data: lines } = await supabase.from('budget_lines').select('*')
    const byP = new Map<string, BudgetLine[]>()
    for (const ln of (lines ?? []) as BudgetLine[]) {
      const arr = byP.get(ln.budget_period_id) ?? []
      arr.push(ln)
      byP.set(ln.budget_period_id, arr)
    }
    return (periods as BudgetPeriod[]).map((p) => ({
      ...p,
      lines: byP.get(p.id),
    }))
  }
  return mockBudgetPeriods.map((p) => ({
    ...p,
    lines: mockBudgetLines.filter((l) => l.budget_period_id === p.id),
  }))
}

export async function advanceBudgetStatus(
  id: string,
  action: 'submit' | 'approve' | 'cancel',
): Promise<BudgetPeriod> {
  const periods = await listBudgetPeriods()
  const p = periods.find((x) => x.id === id)
  if (!p) throw new Error('Budget period not found')

  let next = p.status
  if (action === 'submit' && p.status === 'draft') next = 'submitted'
  else if (action === 'approve' && p.status === 'submitted') next = 'approved'
  else if (action === 'cancel') next = 'cancelled'
  else throw new Error('Invalid transition')

  if (supabase && isSupabaseConfigured) {
    const { data, error } = await supabase
      .from('budget_periods')
      .update({ status: next })
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data as BudgetPeriod
  }
  mockBudgetPeriods = mockBudgetPeriods.map((x) =>
    x.id === id ? { ...x, status: next } : x,
  )
  return { ...p, status: next }
}

export async function listMembersLite(): Promise<Member[]> {
  const { listMembers } = await import('@/lib/data')
  const rows = await listMembers()
  return rows.map(({ id, branch_id, client_id, full_name, date_opened }) => ({
    id,
    branch_id,
    client_id,
    full_name,
    date_opened,
  }))
}

/** Batch-style receipt: debit cash/collection, credit member SL account. */
export async function createBatchReceiptJournal(input: {
  amount: number
  product: 'share_capital' | 'time_deposit' | 'savings'
  trans_date: string
  file_label: string
  memo?: string
}): Promise<{ entry: JournalEntry; lines: JournalLine[] }> {
  const creditCode =
    input.product === 'share_capital'
      ? '3101'
      : input.product === 'time_deposit'
        ? '2201'
        : '2101'
  const creditName =
    input.product === 'share_capital'
      ? 'Share capital'
      : input.product === 'time_deposit'
        ? 'Time deposit'
        : 'Members savings'

  const amt = Math.abs(input.amount)
  const memo =
    input.memo ??
    `Batch file ${input.file_label.slice(0, 8)} — ${creditName}`

  return createJournalEntry({
    entry_date: input.trans_date,
    journal_type: 'batch_upload',
    reference: input.file_label.slice(0, 8),
    memo,
    lines: [
      {
        coa_code: '1010',
        description: 'Collection payment (cash/bank)',
        debit: amt,
        credit: 0,
      },
      {
        coa_code: creditCode,
        description: `${creditName} (SL)`,
        debit: 0,
        credit: amt,
      },
    ],
  })
}

export async function getDashboardModuleStats(): Promise<DashboardModuleStats> {
  const loans = await listLoanApplications()
  const treasury = await listTreasuryTransactions()
  const journals = await listJournalEntries()
  const items = await listInventoryItems()
  const budgets = await listBudgetPeriods()

  const loansByStatus: Record<string, number> = {}
  for (const l of loans) {
    loansByStatus[l.status] = (loansByStatus[l.status] ?? 0) + 1
  }

  const ym = new Date().toISOString().slice(0, 7)
  let treasuryMonthTotal = 0
  for (const t of treasury) {
    if (t.trans_date.startsWith(ym) && t.tx_type === 'receipt') {
      treasuryMonthTotal += Number(t.amount)
    }
  }

  return {
    loansByStatus,
    treasuryMonthTotal,
    openLoans: loans.filter((l) =>
      ['draft', 'submitted', 'verified', 'approved'].includes(l.status),
    ).length,
    postedJournals: journals.filter((j) => j.status === 'posted').length,
    inventorySkus: items.length,
    budgetPeriods: budgets.length,
  }
}
