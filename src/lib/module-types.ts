/** Domain types for operational modules. */

export type LoanStatus =
  | 'draft'
  | 'submitted'
  | 'verified'
  | 'approved'
  | 'journalized'
  | 'disapproved'
  | 'cancelled'

export type LoanApplication = {
  id: string
  branch_id: string
  member_id: string
  reference_no: string | null
  loan_type: string
  principal: number
  term_months: number
  monthly_rate: number | null
  deductions_total: number | null
  net_proceeds: number | null
  status: LoanStatus
  notes: string | null
  created_at: string
}

export type TreasuryTxType =
  | 'receipt'
  | 'withdrawal'
  | 'transfer_out'
  | 'transfer_in'
  | 'disbursement'

export type TreasuryProduct =
  | 'savings'
  | 'share_capital'
  | 'time_deposit'
  | 'loan_payment'
  | 'collection'

export type TreasuryTransaction = {
  id: string
  branch_id: string
  member_id: string | null
  tx_type: TreasuryTxType
  product: string
  amount: number
  reference: string | null
  trans_date: string
  memo: string | null
  created_at: string
}

export type CoaAccountType =
  | 'asset'
  | 'liability'
  | 'equity'
  | 'income'
  | 'expense'

export type ChartOfAccountRow = {
  id: string
  code: string
  name: string
  account_type: CoaAccountType
  active: boolean | null
}

export type JournalEntry = {
  id: string
  branch_id: string
  entry_date: string
  journal_type: string
  reference: string | null
  memo: string | null
  status: 'draft' | 'posted'
  created_at: string
}

export type JournalLine = {
  id: string
  journal_entry_id: string
  coa_code: string
  description: string | null
  debit: number
  credit: number
  member_id: string | null
}

export type LookupCategory = {
  id: string
  code: string
  name: string
}

export type LookupValue = {
  id: string
  category_id: string
  code: string
  description: string
  sort_order: number | null
  active: boolean | null
}

export type Supplier = {
  id: string
  code: string
  name: string
  contact: string | null
  created_at: string
}

export type InventoryItem = {
  id: string
  sku: string
  name: string
  unit: string | null
  qty_on_hand: number
  reorder_level: number | null
}

export type StockMovementType = 'in' | 'out' | 'transfer'

export type StockMovement = {
  id: string
  item_id: string
  movement_type: StockMovementType
  qty: number
  reference: string | null
  trans_date: string
  memo: string | null
  created_at: string
}

export type BudgetPeriodStatus = 'draft' | 'submitted' | 'approved' | 'cancelled'

export type BudgetPeriod = {
  id: string
  code: string
  label: string
  fiscal_year: number
  period_start: string
  period_end: string
  status: BudgetPeriodStatus
  created_at: string
}

export type BudgetLine = {
  id: string
  budget_period_id: string
  coa_code: string
  target_amount: number
  notes: string | null
}

export type DashboardModuleStats = {
  loansByStatus: Record<string, number>
  treasuryMonthTotal: number
  openLoans: number
  postedJournals: number
  inventorySkus: number
  budgetPeriods: number
}
