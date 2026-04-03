import { computeMigsScore } from '@/lib/migs'
import { isSupabaseConfigured, supabase } from '@/lib/supabase'
import type {
  Branch,
  Member,
  MigsAssessmentRow,
  MemberWithLatest,
  PatronageAllocation,
} from '@/lib/types'

const DEMO_BRANCH_ID = '00000000-0000-4000-8000-000000000001'
const DEMO_MEMBER_A = '00000000-0000-4000-8000-0000000000a1'
const DEMO_MEMBER_B = '00000000-0000-4000-8000-0000000000a2'

let mockMembers: Member[] = [
  {
    id: DEMO_MEMBER_A,
    branch_id: DEMO_BRANCH_ID,
    client_id: '100001',
    full_name: 'Ana Dela Cruz',
    date_opened: '2019-03-15',
  },
  {
    id: DEMO_MEMBER_B,
    branch_id: DEMO_BRANCH_ID,
    client_id: '100002',
    full_name: 'Juan Santos',
    date_opened: '2021-07-01',
  },
]

let mockAssessments: MigsAssessmentRow[] = [
  {
    id: '00000000-0000-4000-8000-0000000000b1',
    member_id: DEMO_MEMBER_A,
    assessment_year: 2024,
    cutoff_date: '2024-12-31',
    sales_invoice: 1200,
    any_amount_last_year: 0,
    cac_products: 0,
    loan_release: 5000,
    loan_payments: 2000,
    capital_buildup: 2000,
    basic_shares: 45000,
    delinquency_days: 0,
    charge_off: 0,
    kaagapay1: 1200,
    kaagapay2: 0,
    savings: 5000,
    time_deposits: 10000,
    attendance_count: 2,
    total_score: null,
    rating: null,
  },
  {
    id: '00000000-0000-4000-8000-0000000000b2',
    member_id: DEMO_MEMBER_B,
    assessment_year: 2024,
    cutoff_date: '2024-12-31',
    sales_invoice: 0,
    any_amount_last_year: 0,
    cac_products: 0,
    loan_release: 0,
    loan_payments: 0,
    capital_buildup: 400,
    basic_shares: 5000,
    delinquency_days: 100,
    charge_off: 0,
    kaagapay1: 0,
    kaagapay2: 0,
    savings: 200,
    time_deposits: 0,
    attendance_count: 0,
    total_score: null,
    rating: null,
  },
]

let mockPatronage: PatronageAllocation[] = [
  {
    id: '00000000-0000-4000-8000-0000000000c1',
    member_id: DEMO_MEMBER_A,
    period_from: '2024-01-01',
    period_to: '2024-12-31',
    share_capital: 45000,
    avg_share_capital: 42000,
    int_paid: 2100,
    dividend: 1500,
    patronage: 800,
    gross_dpr: 2300,
    explanation: 'Illustrative allocation for reporting review.',
  },
]

function hydrateAssessment(a: MigsAssessmentRow): MigsAssessmentRow {
  const b = computeMigsScore({
    salesInvoice: Number(a.sales_invoice ?? 0),
    anyAmountLastYear: Number(a.any_amount_last_year ?? 0),
    cacProducts: Number(a.cac_products ?? 0),
    loanRelease: Number(a.loan_release ?? 0),
    loanPayments: Number(a.loan_payments ?? 0),
    capitalBuildup: Number(a.capital_buildup ?? 0),
    basicShares: Number(a.basic_shares ?? 0),
    delinquencyDays: Number(a.delinquency_days ?? 0),
    chargeOff: Number(a.charge_off ?? 0),
    kaagapay1: Number(a.kaagapay1 ?? 0),
    kaagapay2: Number(a.kaagapay2 ?? 0),
    savings: Number(a.savings ?? 0),
    timeDeposits: Number(a.time_deposits ?? 0),
    attendance: Number(a.attendance_count ?? 0),
  })
  return {
    ...a,
    total_score: b.total,
    rating: b.rating,
  }
}

mockAssessments = mockAssessments.map(hydrateAssessment)

async function listMembersSupabase(): Promise<MemberWithLatest[]> {
  if (!supabase) return listMembersMock()
  const { data: members, error } = await supabase
    .from('members')
    .select('*')
    .order('client_id')
  if (error) throw error
  const { data: assessments } = await supabase
    .from('migs_assessments')
    .select('*')
    .order('assessment_year', { ascending: false })

  const byMember = new Map<string, MigsAssessmentRow>()
  for (const a of assessments ?? []) {
    if (!byMember.has(a.member_id)) {
      byMember.set(a.member_id, a as MigsAssessmentRow)
    }
  }

  return (members as Member[]).map((m) => {
    const latest = byMember.get(m.id)
    const breakdown = latest
      ? computeMigsScore({
          salesInvoice: Number(latest.sales_invoice ?? 0),
          anyAmountLastYear: Number(latest.any_amount_last_year ?? 0),
          cacProducts: Number(latest.cac_products ?? 0),
          loanRelease: Number(latest.loan_release ?? 0),
          loanPayments: Number(latest.loan_payments ?? 0),
          capitalBuildup: Number(latest.capital_buildup ?? 0),
          basicShares: Number(latest.basic_shares ?? 0),
          delinquencyDays: Number(latest.delinquency_days ?? 0),
          chargeOff: Number(latest.charge_off ?? 0),
          kaagapay1: Number(latest.kaagapay1 ?? 0),
          kaagapay2: Number(latest.kaagapay2 ?? 0),
          savings: Number(latest.savings ?? 0),
          timeDeposits: Number(latest.time_deposits ?? 0),
          attendance: Number(latest.attendance_count ?? 0),
        })
      : undefined
    return { ...m, latest, breakdown }
  })
}

function listMembersMock(): MemberWithLatest[] {
  const byMember = new Map<string, MigsAssessmentRow>()
  for (const a of mockAssessments) {
    if (!byMember.has(a.member_id)) byMember.set(a.member_id, a)
  }
  return mockMembers.map((m) => {
    const latest = byMember.get(m.id)
    const breakdown = latest
      ? computeMigsScore({
          salesInvoice: Number(latest.sales_invoice ?? 0),
          anyAmountLastYear: Number(latest.any_amount_last_year ?? 0),
          cacProducts: Number(latest.cac_products ?? 0),
          loanRelease: Number(latest.loan_release ?? 0),
          loanPayments: Number(latest.loan_payments ?? 0),
          capitalBuildup: Number(latest.capital_buildup ?? 0),
          basicShares: Number(latest.basic_shares ?? 0),
          delinquencyDays: Number(latest.delinquency_days ?? 0),
          chargeOff: Number(latest.charge_off ?? 0),
          kaagapay1: Number(latest.kaagapay1 ?? 0),
          kaagapay2: Number(latest.kaagapay2 ?? 0),
          savings: Number(latest.savings ?? 0),
          timeDeposits: Number(latest.time_deposits ?? 0),
          attendance: Number(latest.attendance_count ?? 0),
        })
      : undefined
    return { ...m, latest, breakdown }
  })
}

export async function listMembers(): Promise<MemberWithLatest[]> {
  if (isSupabaseConfigured) return listMembersSupabase()
  return listMembersMock()
}

export async function getMember(id: string): Promise<MemberWithLatest | null> {
  const all = await listMembers()
  return all.find((m) => m.id === id) ?? null
}

export type CreateMemberInput = {
  branch_id: string
  client_id: string
  full_name: string
  date_opened: string | null
}

export async function createMember(
  input: CreateMemberInput,
): Promise<MemberWithLatest> {
  const branch_id = input.branch_id.trim()
  const client_id = input.client_id.trim()
  const full_name = input.full_name.trim()
  if (!branch_id || !client_id || !full_name) {
    throw new Error('Branch, client ID, and full name are required.')
  }

  const row: Member = {
    id: crypto.randomUUID(),
    branch_id,
    client_id,
    full_name,
    date_opened: input.date_opened?.trim() || null,
  }

  if (supabase && isSupabaseConfigured) {
    const { data, error } = await supabase
      .from('members')
      .insert({
        branch_id: row.branch_id,
        client_id: row.client_id,
        full_name: row.full_name,
        date_opened: row.date_opened,
      })
      .select()
      .single()
    if (error) throw error
    const m = data as Member
    return { ...m, latest: undefined, breakdown: undefined }
  }

  const dup = mockMembers.some(
    (x) => x.branch_id === branch_id && x.client_id === client_id,
  )
  if (dup) {
    throw new Error('A member with this client ID already exists for this branch.')
  }
  mockMembers.push(row)
  return { ...row, latest: undefined, breakdown: undefined }
}

export async function listPatronage(): Promise<
  (PatronageAllocation & { member?: Member })[]
> {
  if (supabase && isSupabaseConfigured) {
    const { data: rows, error } = await supabase
      .from('patronage_allocations')
      .select('*')
      .order('period_to', { ascending: false })
    if (error) throw error
    const { data: mems, error: e2 } = await supabase.from('members').select('*')
    if (e2) throw e2
    const map = new Map((mems as Member[]).map((m) => [m.id, m]))
    return (rows as PatronageAllocation[]).map((p) => ({
      ...p,
      member: map.get(p.member_id),
    }))
  }
  return mockPatronage.map((p) => ({
    ...p,
    member: mockMembers.find((m) => m.id === p.member_id),
  }))
}

export type CreatePatronageAllocationInput = {
  member_id: string
  period_from: string
  period_to: string
  share_capital?: number
  avg_share_capital?: number
  int_paid?: number
  dividend?: number
  patronage?: number
  gross_dpr?: number
  explanation?: string
}

export async function createPatronageAllocation(
  input: CreatePatronageAllocationInput,
): Promise<PatronageAllocation & { member?: Member }> {
  if (!input.member_id?.trim()) {
    throw new Error('Member is required.')
  }
  const pf = input.period_from?.trim().slice(0, 10)
  const pt = input.period_to?.trim().slice(0, 10)
  if (!pf || !pt) {
    throw new Error('Period start and end dates are required.')
  }

  const num = (v: number | undefined) =>
    v === undefined || v === null || Number.isNaN(Number(v))
      ? 0
      : Number(v)

  const row: PatronageAllocation = {
    id: crypto.randomUUID(),
    member_id: input.member_id,
    period_from: pf,
    period_to: pt,
    share_capital: num(input.share_capital),
    avg_share_capital: num(input.avg_share_capital),
    int_paid: num(input.int_paid),
    dividend: num(input.dividend),
    patronage: num(input.patronage),
    gross_dpr: num(input.gross_dpr),
    explanation: input.explanation?.trim() || null,
  }

  if (supabase && isSupabaseConfigured) {
    const { data, error } = await supabase
      .from('patronage_allocations')
      .insert({
        member_id: row.member_id,
        period_from: row.period_from,
        period_to: row.period_to,
        share_capital: row.share_capital,
        avg_share_capital: row.avg_share_capital,
        int_paid: row.int_paid,
        dividend: row.dividend,
        patronage: row.patronage,
        gross_dpr: row.gross_dpr,
        explanation: row.explanation,
      })
      .select()
      .single()
    if (error) throw error
    const saved = data as PatronageAllocation
    const { data: mem } = await supabase
      .from('members')
      .select('*')
      .eq('id', saved.member_id)
      .single()
    return { ...saved, member: mem as Member }
  }

  mockPatronage = [...mockPatronage, row]
  return {
    ...row,
    member: mockMembers.find((m) => m.id === row.member_id),
  }
}

export async function listBranches(): Promise<Branch[]> {
  if (supabase && isSupabaseConfigured) {
    const { data, error } = await supabase
      .from('branches')
      .select('*')
      .order('code')
    if (error) throw error
    return data as Branch[]
  }
  return [{ id: DEMO_BRANCH_ID, code: 1, name: 'Main Office (demo)' }]
}

export type UpsertAssessmentInput = Omit<
  MigsAssessmentRow,
  'id' | 'total_score' | 'rating'
> & { id?: string }

export async function upsertAssessment(
  input: UpsertAssessmentInput,
): Promise<MigsAssessmentRow> {
  const score = computeMigsScore({
    salesInvoice: Number(input.sales_invoice ?? 0),
    anyAmountLastYear: Number(input.any_amount_last_year ?? 0),
    cacProducts: Number(input.cac_products ?? 0),
    loanRelease: Number(input.loan_release ?? 0),
    loanPayments: Number(input.loan_payments ?? 0),
    capitalBuildup: Number(input.capital_buildup ?? 0),
    basicShares: Number(input.basic_shares ?? 0),
    delinquencyDays: Number(input.delinquency_days ?? 0),
    chargeOff: Number(input.charge_off ?? 0),
    kaagapay1: Number(input.kaagapay1 ?? 0),
    kaagapay2: Number(input.kaagapay2 ?? 0),
    savings: Number(input.savings ?? 0),
    timeDeposits: Number(input.time_deposits ?? 0),
    attendance: Number(input.attendance_count ?? 0),
  })

  const row: MigsAssessmentRow = {
    id: input.id ?? crypto.randomUUID(),
    member_id: input.member_id,
    assessment_year: input.assessment_year,
    cutoff_date: input.cutoff_date,
    sales_invoice: input.sales_invoice,
    any_amount_last_year: input.any_amount_last_year,
    cac_products: input.cac_products,
    loan_release: input.loan_release,
    loan_payments: input.loan_payments,
    capital_buildup: input.capital_buildup,
    basic_shares: input.basic_shares,
    delinquency_days: input.delinquency_days,
    charge_off: input.charge_off,
    kaagapay1: input.kaagapay1,
    kaagapay2: input.kaagapay2,
    savings: input.savings,
    time_deposits: input.time_deposits,
    attendance_count: input.attendance_count,
    total_score: score.total,
    rating: score.rating,
  }

  if (supabase && isSupabaseConfigured) {
    const { data, error } = await supabase
      .from('migs_assessments')
      .upsert(
        {
          ...row,
          total_score: score.total,
          rating: score.rating,
        },
        { onConflict: 'member_id,assessment_year' },
      )
      .select()
      .single()
    if (error) throw error
    return data as MigsAssessmentRow
  }

  const idx = mockAssessments.findIndex(
    (a) =>
      a.member_id === row.member_id &&
      a.assessment_year === row.assessment_year,
  )
  if (idx >= 0) mockAssessments[idx] = row
  else mockAssessments.push(row)
  return row
}

export function getConnectionMode(): 'supabase' | 'demo' {
  return isSupabaseConfigured ? 'supabase' : 'demo'
}
