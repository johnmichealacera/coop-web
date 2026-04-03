import type { MigsBreakdown } from '@/lib/migs'

export type Branch = {
  id: string
  code: number
  name: string
}

export type Member = {
  id: string
  branch_id: string
  client_id: string
  full_name: string
  date_opened: string | null
}

export type MigsAssessmentRow = {
  id: string
  member_id: string
  assessment_year: number
  cutoff_date: string
  sales_invoice: number | null
  any_amount_last_year: number | null
  cac_products: number | null
  loan_release: number | null
  loan_payments: number | null
  capital_buildup: number | null
  basic_shares: number | null
  delinquency_days: number | null
  charge_off: number | null
  kaagapay1: number | null
  kaagapay2: number | null
  savings: number | null
  time_deposits: number | null
  attendance_count: number | null
  total_score: number | null
  rating: 'MIGS' | 'NON-MIGS' | null
}

export type PatronageAllocation = {
  id: string
  member_id: string
  period_from: string
  period_to: string
  share_capital: number | null
  avg_share_capital: number | null
  int_paid: number | null
  dividend: number | null
  patronage: number | null
  gross_dpr: number | null
  explanation: string | null
}

export type MemberWithLatest = Member & {
  latest?: MigsAssessmentRow
  breakdown?: MigsBreakdown
}
