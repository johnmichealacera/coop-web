import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button, buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { computeMigsScore } from '@/lib/migs'
import { getMember, upsertAssessment } from '@/lib/data'
import type { MemberWithLatest } from '@/lib/types'

type Form = {
  assessment_year: number
  cutoff_date: string
  sales_invoice: string
  any_amount_last_year: string
  cac_products: string
  loan_release: string
  loan_payments: string
  capital_buildup: string
  basic_shares: string
  delinquency_days: string
  charge_off: string
  kaagapay1: string
  kaagapay2: string
  savings: string
  time_deposits: string
  attendance_count: string
}

function toForm(m: MemberWithLatest | null): Form {
  const a = m?.latest
  return {
    assessment_year: a?.assessment_year ?? new Date().getFullYear(),
    cutoff_date: a?.cutoff_date ?? `${new Date().getFullYear()}-12-31`,
    sales_invoice: String(a?.sales_invoice ?? 0),
    any_amount_last_year: String(a?.any_amount_last_year ?? 0),
    cac_products: String(a?.cac_products ?? 0),
    loan_release: String(a?.loan_release ?? 0),
    loan_payments: String(a?.loan_payments ?? 0),
    capital_buildup: String(a?.capital_buildup ?? 0),
    basic_shares: String(a?.basic_shares ?? 0),
    delinquency_days: String(a?.delinquency_days ?? 0),
    charge_off: String(a?.charge_off ?? 0),
    kaagapay1: String(a?.kaagapay1 ?? 0),
    kaagapay2: String(a?.kaagapay2 ?? 0),
    savings: String(a?.savings ?? 0),
    time_deposits: String(a?.time_deposits ?? 0),
    attendance_count: String(a?.attendance_count ?? 0),
  }
}

export function MemberDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [member, setMember] = useState<MemberWithLatest | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<Form | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      if (!id) return
      const m = await getMember(id)
      if (cancelled) return
      setMember(m)
      setForm(toForm(m))
      setLoading(false)
    })()
    return () => {
      cancelled = true
    }
  }, [id])

  const live =
    form &&
    computeMigsScore({
      salesInvoice: Number(form.sales_invoice) || 0,
      anyAmountLastYear: Number(form.any_amount_last_year) || 0,
      cacProducts: Number(form.cac_products) || 0,
      loanRelease: Number(form.loan_release) || 0,
      loanPayments: Number(form.loan_payments) || 0,
      capitalBuildup: Number(form.capital_buildup) || 0,
      basicShares: Number(form.basic_shares) || 0,
      delinquencyDays: Number(form.delinquency_days) || 0,
      chargeOff: Number(form.charge_off) || 0,
      kaagapay1: Number(form.kaagapay1) || 0,
      kaagapay2: Number(form.kaagapay2) || 0,
      savings: Number(form.savings) || 0,
      timeDeposits: Number(form.time_deposits) || 0,
      attendance: Number(form.attendance_count) || 0,
    })

  async function onSave() {
    if (!id || !member || !form) return
    setSaving(true)
    setError(null)
    try {
      const saved = await upsertAssessment({
        id: member.latest?.id,
        member_id: id,
        assessment_year: form.assessment_year,
        cutoff_date: form.cutoff_date,
        sales_invoice: Number(form.sales_invoice) || 0,
        any_amount_last_year: Number(form.any_amount_last_year) || 0,
        cac_products: Number(form.cac_products) || 0,
        loan_release: Number(form.loan_release) || 0,
        loan_payments: Number(form.loan_payments) || 0,
        capital_buildup: Number(form.capital_buildup) || 0,
        basic_shares: Number(form.basic_shares) || 0,
        delinquency_days: Number(form.delinquency_days) || 0,
        charge_off: Number(form.charge_off) || 0,
        kaagapay1: Number(form.kaagapay1) || 0,
        kaagapay2: Number(form.kaagapay2) || 0,
        savings: Number(form.savings) || 0,
        time_deposits: Number(form.time_deposits) || 0,
        attendance_count: Math.round(Number(form.attendance_count) || 0),
      })
      const breakdown = computeMigsScore({
        salesInvoice: Number(form.sales_invoice) || 0,
        anyAmountLastYear: Number(form.any_amount_last_year) || 0,
        cacProducts: Number(form.cac_products) || 0,
        loanRelease: Number(form.loan_release) || 0,
        loanPayments: Number(form.loan_payments) || 0,
        capitalBuildup: Number(form.capital_buildup) || 0,
        basicShares: Number(form.basic_shares) || 0,
        delinquencyDays: Number(form.delinquency_days) || 0,
        chargeOff: Number(form.charge_off) || 0,
        kaagapay1: Number(form.kaagapay1) || 0,
        kaagapay2: Number(form.kaagapay2) || 0,
        savings: Number(form.savings) || 0,
        timeDeposits: Number(form.time_deposits) || 0,
        attendance: Number(form.attendance_count) || 0,
      })
      setMember((prev) =>
        prev ? { ...prev, latest: saved, breakdown } : prev,
      )
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  if (loading || !form) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (!member) {
    return (
      <p className="text-muted-foreground">
        Member not found.{' '}
        <Link to="/members" className="text-primary underline">
          Back
        </Link>
      </p>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start gap-4">
        <Link
          className={cn(
            buttonVariants({ variant: 'ghost', size: 'sm' }),
            '-ml-2',
          )}
          to="/members"
        >
          <ArrowLeft className="size-4" />
          Members
        </Link>
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-semibold tracking-tight">
            {member.full_name}
          </h1>
          <p className="mt-1 text-muted-foreground">
            Client <span className="font-mono">{member.client_id}</span>
          </p>
        </div>
        {live && (
          <div className="flex gap-2">
            <Badge variant="outline" className="tabular-nums">
              Total {live.total}
            </Badge>
            <Badge
              variant={live.rating === 'MIGS' ? 'default' : 'secondary'}
            >
              {live.rating}
            </Badge>
          </div>
        )}
      </div>

      {error && (
        <p className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Annual inputs</CardTitle>
            <CardDescription>
              Same fields as the MIGS query layer (sales, loans, shares,
              delinquency, Kaagapay, savings, attendance).
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="assessment_year">Assessment year</Label>
              <Input
                id="assessment_year"
                type="number"
                value={form.assessment_year}
                onChange={(e) =>
                  setForm((f) =>
                    f ? { ...f, assessment_year: Number(e.target.value) } : f,
                  )
                }
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="cutoff_date">Cutoff date</Label>
              <Input
                id="cutoff_date"
                type="date"
                value={form.cutoff_date}
                onChange={(e) =>
                  setForm((f) =>
                    f ? { ...f, cutoff_date: e.target.value } : f,
                  )
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sales_invoice">Sales invoice</Label>
              <Input
                id="sales_invoice"
                inputMode="decimal"
                value={form.sales_invoice}
                onChange={(e) =>
                  setForm((f) =>
                    f ? { ...f, sales_invoice: e.target.value } : f,
                  )
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cac_products">CAC products</Label>
              <Input
                id="cac_products"
                inputMode="decimal"
                value={form.cac_products}
                onChange={(e) =>
                  setForm((f) =>
                    f ? { ...f, cac_products: e.target.value } : f,
                  )
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="any_amount_last_year">Any amount last year</Label>
              <Input
                id="any_amount_last_year"
                inputMode="decimal"
                value={form.any_amount_last_year}
                onChange={(e) =>
                  setForm((f) =>
                    f ? { ...f, any_amount_last_year: e.target.value } : f,
                  )
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="loan_release">Loan release</Label>
              <Input
                id="loan_release"
                inputMode="decimal"
                value={form.loan_release}
                onChange={(e) =>
                  setForm((f) =>
                    f ? { ...f, loan_release: e.target.value } : f,
                  )
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="loan_payments">Loan payments</Label>
              <Input
                id="loan_payments"
                inputMode="decimal"
                value={form.loan_payments}
                onChange={(e) =>
                  setForm((f) =>
                    f ? { ...f, loan_payments: e.target.value } : f,
                  )
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="capital_buildup">Capital buildup</Label>
              <Input
                id="capital_buildup"
                inputMode="decimal"
                value={form.capital_buildup}
                onChange={(e) =>
                  setForm((f) =>
                    f ? { ...f, capital_buildup: e.target.value } : f,
                  )
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="basic_shares">Basic shares</Label>
              <Input
                id="basic_shares"
                inputMode="decimal"
                value={form.basic_shares}
                onChange={(e) =>
                  setForm((f) =>
                    f ? { ...f, basic_shares: e.target.value } : f,
                  )
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="delinquency_days">Delinquency (days)</Label>
              <Input
                id="delinquency_days"
                inputMode="decimal"
                value={form.delinquency_days}
                onChange={(e) =>
                  setForm((f) =>
                    f ? { ...f, delinquency_days: e.target.value } : f,
                  )
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="charge_off">Charge-off</Label>
              <Input
                id="charge_off"
                inputMode="decimal"
                value={form.charge_off}
                onChange={(e) =>
                  setForm((f) =>
                    f ? { ...f, charge_off: e.target.value } : f,
                  )
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="kaagapay1">Kaagapay 1</Label>
              <Input
                id="kaagapay1"
                inputMode="decimal"
                value={form.kaagapay1}
                onChange={(e) =>
                  setForm((f) =>
                    f ? { ...f, kaagapay1: e.target.value } : f,
                  )
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="kaagapay2">Kaagapay 2</Label>
              <Input
                id="kaagapay2"
                inputMode="decimal"
                value={form.kaagapay2}
                onChange={(e) =>
                  setForm((f) =>
                    f ? { ...f, kaagapay2: e.target.value } : f,
                  )
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="savings">Savings</Label>
              <Input
                id="savings"
                inputMode="decimal"
                value={form.savings}
                onChange={(e) =>
                  setForm((f) =>
                    f ? { ...f, savings: e.target.value } : f,
                  )
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="time_deposits">Time deposits</Label>
              <Input
                id="time_deposits"
                inputMode="decimal"
                value={form.time_deposits}
                onChange={(e) =>
                  setForm((f) =>
                    f ? { ...f, time_deposits: e.target.value } : f,
                  )
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="attendance_count">Attendance (meetings)</Label>
              <Input
                id="attendance_count"
                inputMode="numeric"
                value={form.attendance_count}
                onChange={(e) =>
                  setForm((f) =>
                    f ? { ...f, attendance_count: e.target.value } : f,
                  )
                }
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Button onClick={onSave} disabled={saving}>
                {saving ? 'Saving…' : 'Save assessment'}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Score breakdown</CardTitle>
            <CardDescription>
              Component totals (max 100).
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {live ? (
              <>
                <div className="flex justify-between border-b border-border py-1">
                  <span>Patronize</span>
                  <span className="tabular-nums font-medium">
                    {live.patronize}
                  </span>
                </div>
                <div className="flex justify-between border-b border-border py-1">
                  <span>Capital buildup</span>
                  <span className="tabular-nums font-medium">
                    {live.capitalBuildup}
                  </span>
                </div>
                <div className="flex justify-between border-b border-border py-1">
                  <span>Basic shares</span>
                  <span className="tabular-nums font-medium">
                    {live.basicShares}
                  </span>
                </div>
                <div className="flex justify-between border-b border-border py-1">
                  <span>Delinquency</span>
                  <span className="tabular-nums font-medium">
                    {live.delinquency}
                  </span>
                </div>
                <div className="flex justify-between border-b border-border py-1">
                  <span>Kaagapay</span>
                  <span className="tabular-nums font-medium">
                    {live.kaagapay}
                  </span>
                </div>
                <div className="flex justify-between border-b border-border py-1">
                  <span>Savings</span>
                  <span className="tabular-nums font-medium">
                    {live.savings}
                  </span>
                </div>
                <div className="flex justify-between border-b border-border py-1">
                  <span>Attendance</span>
                  <span className="tabular-nums font-medium">
                    {live.attendance}
                  </span>
                </div>
                <div className="flex justify-between pt-2 text-base font-semibold">
                  <span>Total</span>
                  <span className="tabular-nums">{live.total}</span>
                </div>
              </>
            ) : (
              <p className="text-muted-foreground">Enter inputs to preview.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
