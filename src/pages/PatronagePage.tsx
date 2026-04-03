import { useCallback, useEffect, useState } from 'react'
import { MemberSelect } from '@/components/MemberSelect'
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
import { Skeleton } from '@/components/ui/skeleton'
import {
  createPatronageAllocation,
  listPatronage,
} from '@/lib/data'
import { listMembersLite } from '@/lib/modules-api'
import type { Member, PatronageAllocation } from '@/lib/types'

type Row = PatronageAllocation & { member?: Member }

export function PatronagePage() {
  const [loading, setLoading] = useState(true)
  const [rows, setRows] = useState<Row[]>([])
  const [open, setOpen] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [memberId, setMemberId] = useState('')
  const [periodFrom, setPeriodFrom] = useState(
    () => `${new Date().getFullYear()}-01-01`,
  )
  const [periodTo, setPeriodTo] = useState(
    () => `${new Date().getFullYear()}-12-31`,
  )
  const [shareCap, setShareCap] = useState('0')
  const [avgShare, setAvgShare] = useState('0')
  const [intPaid, setIntPaid] = useState('0')
  const [dividend, setDividend] = useState('0')
  const [patronageAmt, setPatronageAmt] = useState('0')
  const [grossDpr, setGrossDpr] = useState('0')
  const [note, setNote] = useState('')

  const load = useCallback(async () => {
    const data = await listPatronage()
    setRows(data)
  }, [])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        await load()
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [load])

  useEffect(() => {
    void (async () => {
      const m = await listMembersLite()
      setMemberId((prev) => prev || (m[0]?.id ?? ''))
    })()
  }, [])

  async function onSave() {
    setErr(null)
    try {
      await createPatronageAllocation({
        member_id: memberId,
        period_from: periodFrom,
        period_to: periodTo,
        share_capital: Number(shareCap) || 0,
        avg_share_capital: Number(avgShare) || 0,
        int_paid: Number(intPaid) || 0,
        dividend: Number(dividend) || 0,
        patronage: Number(patronageAmt) || 0,
        gross_dpr: Number(grossDpr) || 0,
        explanation: note || undefined,
      })
      setOpen(false)
      setNote('')
      await load()
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Could not save allocation')
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Patronage / DPR
        </h1>
        <p className="mt-1 max-w-3xl text-muted-foreground">
          Member-level figures for a period: share capital, average share
          capital, interest paid, dividend, patronage refund, and gross DPR.
        </p>
      </div>

      {err && (
        <p className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {err}
        </p>
      )}

      <Card>
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2">
          <div>
            <CardTitle>Allocations</CardTitle>
            <CardDescription>
              One row per member and period. Amounts match your chart of accounts
              and distribution policy.
            </CardDescription>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger
              render={<Button type="button">Add allocation</Button>}
            />
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>New patronage allocation</DialogTitle>
              </DialogHeader>
              <div className="grid gap-3 py-2">
                <div className="grid gap-2">
                  <Label>Member</Label>
                  <MemberSelect
                    value={memberId}
                    onValueChange={(id) => setMemberId(id)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="grid gap-2">
                    <Label htmlFor="pf">Period from</Label>
                    <Input
                      id="pf"
                      type="date"
                      value={periodFrom}
                      onChange={(e) => setPeriodFrom(e.target.value)}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="pt">Period to</Label>
                    <Input
                      id="pt"
                      type="date"
                      value={periodTo}
                      onChange={(e) => setPeriodTo(e.target.value)}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  <div className="grid gap-2">
                    <Label htmlFor="sc">Share capital</Label>
                    <Input
                      id="sc"
                      inputMode="decimal"
                      value={shareCap}
                      onChange={(e) => setShareCap(e.target.value)}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="as">Avg share capital</Label>
                    <Input
                      id="as"
                      inputMode="decimal"
                      value={avgShare}
                      onChange={(e) => setAvgShare(e.target.value)}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="ip">Interest paid</Label>
                    <Input
                      id="ip"
                      inputMode="decimal"
                      value={intPaid}
                      onChange={(e) => setIntPaid(e.target.value)}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="div">Dividend</Label>
                    <Input
                      id="div"
                      inputMode="decimal"
                      value={dividend}
                      onChange={(e) => setDividend(e.target.value)}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="pat">Patronage</Label>
                    <Input
                      id="pat"
                      inputMode="decimal"
                      value={patronageAmt}
                      onChange={(e) => setPatronageAmt(e.target.value)}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="gd">Gross DPR</Label>
                    <Input
                      id="gd"
                      inputMode="decimal"
                      value={grossDpr}
                      onChange={(e) => setGrossDpr(e.target.value)}
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="n">Notes (optional)</Label>
                  <Textarea
                    id="n"
                    rows={2}
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={() => void onSave()}>Save</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-40 w-full" />
          ) : rows.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No patronage allocations recorded yet. Use Add allocation to enter
              a member&apos;s figures for a period.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Member</TableHead>
                  <TableHead>Period</TableHead>
                  <TableHead className="text-right">Share cap.</TableHead>
                  <TableHead className="text-right">Avg share</TableHead>
                  <TableHead className="text-right">Int paid</TableHead>
                  <TableHead className="text-right">Dividend</TableHead>
                  <TableHead className="text-right">Patronage</TableHead>
                  <TableHead className="text-right">Gross DPR</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>
                      <div className="font-medium">
                        {r.member?.full_name ?? '—'}
                      </div>
                      <div className="font-mono text-xs text-muted-foreground">
                        {r.member?.client_id}
                      </div>
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-sm">
                      {r.period_from} → {r.period_to}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {r.share_capital?.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {r.avg_share_capital?.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {r.int_paid?.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {r.dividend?.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {r.patronage?.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {r.gross_dpr?.toLocaleString()}
                    </TableCell>
                    <TableCell className="max-w-[14rem] text-sm text-muted-foreground">
                      {r.explanation ?? '—'}
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
