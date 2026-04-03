import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import type { LoanAction } from '@/lib/modules-api'
import {
  advanceLoanStatus,
  createLoanApplication,
  listLoanApplications,
  listMembersLite,
} from '@/lib/modules-api'
import type { LoanApplication } from '@/lib/module-types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'
import { MemberSelect } from '@/components/MemberSelect'
import {
  amortizationSchedule,
  levelPayment,
} from '@/lib/loan-calculations'
import type { Member } from '@/lib/types'
import { ScrollArea } from '@/components/ui/scroll-area'

const statusVariant = (s: string) => {
  if (s === 'journalized' || s === 'approved') return 'default' as const
  if (s === 'disapproved' || s === 'cancelled') return 'destructive' as const
  return 'secondary' as const
}

export function LoansPage() {
  const [rows, setRows] = useState<LoanApplication[]>([])
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [memberId, setMemberId] = useState('')
  const [loanType, setLoanType] = useState('business')
  const [principal, setPrincipal] = useState('50000')
  const [term, setTerm] = useState('24')
  const [rate, setRate] = useState('0.02')
  const [deductions, setDeductions] = useState('2500')
  const [notes, setNotes] = useState('')

  const [calcPrincipal, setCalcPrincipal] = useState('50000')
  const [calcRate, setCalcRate] = useState('0.02')
  const [calcTerm, setCalcTerm] = useState('24')

  const calcPreview = useMemo(() => {
    const p = Number(calcPrincipal) || 0
    const r = Number(calcRate) || 0
    const n = Math.min(600, Math.max(1, Math.round(Number(calcTerm) || 1)))
    const payment = levelPayment(p, r, n)
    const schedule = amortizationSchedule(p, r, n)
    return { payment, schedule, n }
  }, [calcPrincipal, calcRate, calcTerm])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [l, m] = await Promise.all([
        listLoanApplications(),
        listMembersLite(),
      ])
      setRows(l)
      setMembers(m)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    if (members.length && !memberId) setMemberId(members[0].id)
  }, [members, memberId])

  const memberName = (id: string) =>
    members.find((x) => x.id === id)?.full_name ?? id

  async function onCreate() {
    setErr(null)
    try {
      await createLoanApplication({
        member_id: memberId,
        loan_type: loanType,
        principal: Number(principal) || 0,
        term_months: Math.round(Number(term)) || 12,
        monthly_rate: Number(rate) || 0,
        deductions_total: Number(deductions) || 0,
        notes: notes || undefined,
      })
      setOpen(false)
      await load()
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Failed')
    }
  }

  async function act(id: string, action: LoanAction) {
    setErr(null)
    try {
      await advanceLoanStatus(id, action)
      await load()
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Failed')
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Loan processing
        </h1>
        <p className="mt-1 text-muted-foreground">
          Create an application, then move it through submit → verify → approve
          → journalize.
        </p>
      </div>

      {err && (
        <p className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {err}
        </p>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Payment & amortization (calculator)</CardTitle>
          <CardDescription>
            Level monthly payment and full schedule from principal, monthly rate,
            and term — same annuity logic used for standard amortizing loans.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="grid gap-2">
              <Label htmlFor="calc-pr">Principal</Label>
              <Input
                id="calc-pr"
                inputMode="decimal"
                value={calcPrincipal}
                onChange={(e) => setCalcPrincipal(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="calc-rt">Monthly rate</Label>
              <Input
                id="calc-rt"
                inputMode="decimal"
                value={calcRate}
                onChange={(e) => setCalcRate(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="calc-tm">Term (months)</Label>
              <Input
                id="calc-tm"
                inputMode="numeric"
                value={calcTerm}
                onChange={(e) => setCalcTerm(e.target.value)}
              />
            </div>
          </div>
          <p className="text-sm">
            <span className="text-muted-foreground">Level payment: </span>
            <span className="font-medium tabular-nums">
              {calcPreview.payment.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </span>
            <span className="text-muted-foreground">
              {' '}
              / month ({calcPreview.n} periods)
            </span>
          </p>
          <ScrollArea className="h-[min(320px,50vh)] rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-14">#</TableHead>
                  <TableHead className="text-right">Payment</TableHead>
                  <TableHead className="text-right">Interest</TableHead>
                  <TableHead className="text-right">Principal</TableHead>
                  <TableHead className="text-right">Balance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {calcPreview.schedule.map((row) => (
                  <TableRow key={row.period}>
                    <TableCell className="tabular-nums">{row.period}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {row.payment.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {row.interest.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {row.principal.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {row.balance.toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2">
          <div>
            <CardTitle>Loan applications</CardTitle>
            <CardDescription>
              Net proceeds = principal − deductions (shown after save).
            </CardDescription>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger
              render={
                <button
                  type="button"
                  className="inline-flex h-8 items-center justify-center rounded-lg border border-transparent bg-primary px-2.5 text-sm font-medium text-primary-foreground"
                >
                  New application
                </button>
              }
            />
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
              <DialogHeader>
                <DialogTitle>New loan application</DialogTitle>
              </DialogHeader>
              <div className="grid gap-3 py-2">
                <div className="grid gap-2">
                  <Label>Member</Label>
                  <MemberSelect
                    value={memberId}
                    onValueChange={(id) => setMemberId(id)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="lt">Loan type</Label>
                  <Input
                    id="lt"
                    value={loanType}
                    onChange={(e) => setLoanType(e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="grid gap-2">
                    <Label htmlFor="pr">Principal</Label>
                    <Input
                      id="pr"
                      inputMode="decimal"
                      value={principal}
                      onChange={(e) => setPrincipal(e.target.value)}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="ded">Deductions</Label>
                    <Input
                      id="ded"
                      inputMode="decimal"
                      value={deductions}
                      onChange={(e) => setDeductions(e.target.value)}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="grid gap-2">
                    <Label htmlFor="tm">Term (months)</Label>
                    <Input
                      id="tm"
                      inputMode="numeric"
                      value={term}
                      onChange={(e) => setTerm(e.target.value)}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="rt">Monthly rate</Label>
                    <Input
                      id="rt"
                      inputMode="decimal"
                      value={rate}
                      onChange={(e) => setRate(e.target.value)}
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="n">Notes</Label>
                  <Textarea
                    id="n"
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={onCreate}>Save draft</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ref</TableHead>
                  <TableHead>Member</TableHead>
                  <TableHead className="text-right">Principal</TableHead>
                  <TableHead className="text-right">Net</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-mono text-xs">
                      {r.reference_no ?? '—'}
                    </TableCell>
                    <TableCell>
                      <Link
                        className="text-primary underline-offset-4 hover:underline"
                        to={`/members/${r.member_id}`}
                      >
                        {memberName(r.member_id)}
                      </Link>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {Number(r.principal).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {Number(r.net_proceeds ?? 0).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusVariant(r.status)}>{r.status}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex flex-wrap justify-end gap-1">
                        {r.status === 'draft' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => act(r.id, 'submit')}
                          >
                            Submit
                          </Button>
                        )}
                        {r.status === 'submitted' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => act(r.id, 'verify')}
                          >
                            Verify
                          </Button>
                        )}
                        {r.status === 'verified' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => act(r.id, 'approve')}
                          >
                            Approve
                          </Button>
                        )}
                        {r.status === 'approved' && (
                          <Button
                            size="sm"
                            onClick={() => act(r.id, 'journalize')}
                          >
                            Journalize
                          </Button>
                        )}
                        {['draft', 'submitted', 'verified'].includes(
                          r.status,
                        ) && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => act(r.id, 'disapprove')}
                          >
                            Disapprove
                          </Button>
                        )}
                        {['draft', 'submitted', 'verified', 'approved'].includes(
                          r.status,
                        ) && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => act(r.id, 'cancel')}
                          >
                            Cancel
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
