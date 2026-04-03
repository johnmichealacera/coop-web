import { useCallback, useEffect, useState } from 'react'
import {
  advanceBudgetStatus,
  createBudgetLine,
  createBudgetPeriod,
  listBudgetPeriods,
} from '@/lib/modules-api'
import type { BudgetLine, BudgetPeriod } from '@/lib/module-types'
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

export function BudgetPage() {
  const [periods, setPeriods] = useState<
    (BudgetPeriod & { lines?: BudgetLine[] })[]
  >([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState<string | null>(null)

  const [openPeriod, setOpenPeriod] = useState(false)
  const [bpCode, setBpCode] = useState('')
  const [bpLabel, setBpLabel] = useState('')
  const [bpFy, setBpFy] = useState(() =>
    String(new Date().getFullYear()),
  )
  const [bpStart, setBpStart] = useState(
    () => `${new Date().getFullYear()}-01-01`,
  )
  const [bpEnd, setBpEnd] = useState(
    () => `${new Date().getFullYear()}-12-31`,
  )

  const [lineForPeriod, setLineForPeriod] = useState<string | null>(null)
  const [lineCoa, setLineCoa] = useState('')
  const [lineTarget, setLineTarget] = useState('0')
  const [lineNotes, setLineNotes] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const p = await listBudgetPeriods()
      setPeriods(p)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  async function act(id: string, a: 'submit' | 'approve' | 'cancel') {
    setErr(null)
    try {
      await advanceBudgetStatus(id, a)
      await load()
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Failed')
    }
  }

  async function onSavePeriod() {
    setErr(null)
    try {
      await createBudgetPeriod({
        code: bpCode,
        label: bpLabel,
        fiscal_year: Number(bpFy) || new Date().getFullYear(),
        period_start: bpStart,
        period_end: bpEnd,
      })
      setOpenPeriod(false)
      setBpCode('')
      setBpLabel('')
      await load()
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Could not create period')
    }
  }

  async function onSaveLine() {
    if (!lineForPeriod) return
    setErr(null)
    try {
      await createBudgetLine({
        budget_period_id: lineForPeriod,
        coa_code: lineCoa,
        target_amount: Number(lineTarget) || 0,
        notes: lineNotes || undefined,
      })
      setLineForPeriod(null)
      setLineCoa('')
      setLineTarget('0')
      setLineNotes('')
      await load()
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Could not add line')
    }
  }

  const badge = (s: string) => {
    if (s === 'approved') return 'default' as const
    if (s === 'cancelled') return 'destructive' as const
    return 'secondary' as const
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Budget monitoring
        </h1>
        <p className="mt-1 text-muted-foreground">
          Define budget periods, set target amounts by account, then move each
          period through submit and approval.
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
            <CardTitle>Budget periods</CardTitle>
            <CardDescription>
              Each period holds GL account targets (amounts per COA) for
              planning and comparison.
            </CardDescription>
          </div>
          <Dialog open={openPeriod} onOpenChange={setOpenPeriod}>
            <DialogTrigger
              render={<Button type="button">Add budget period</Button>}
            />
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>New budget period</DialogTitle>
              </DialogHeader>
              <div className="grid gap-3 py-2">
                <div className="grid gap-2">
                  <Label htmlFor="bp-code">Code</Label>
                  <Input
                    id="bp-code"
                    placeholder="e.g. FY2026"
                    value={bpCode}
                    onChange={(e) => setBpCode(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="bp-label">Label</Label>
                  <Input
                    id="bp-label"
                    placeholder="Display name"
                    value={bpLabel}
                    onChange={(e) => setBpLabel(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="bp-fy">Fiscal year</Label>
                  <Input
                    id="bp-fy"
                    inputMode="numeric"
                    value={bpFy}
                    onChange={(e) => setBpFy(e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="grid gap-2">
                    <Label htmlFor="bp-s">Period start</Label>
                    <Input
                      id="bp-s"
                      type="date"
                      value={bpStart}
                      onChange={(e) => setBpStart(e.target.value)}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="bp-e">Period end</Label>
                    <Input
                      id="bp-e"
                      type="date"
                      value={bpEnd}
                      onChange={(e) => setBpEnd(e.target.value)}
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpenPeriod(false)}>
                  Cancel
                </Button>
                <Button onClick={() => void onSavePeriod()}>Save</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent className="space-y-6">
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : periods.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No budget periods yet. Click Add budget period to create one, then
              add account lines while it is in draft.
            </p>
          ) : (
            periods.map((p) => (
              <div key={p.id} className="rounded-lg border border-border p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-semibold">
                      {p.label}{' '}
                      <span className="font-mono text-sm text-muted-foreground">
                        ({p.code})
                      </span>
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {p.period_start} → {p.period_end} · FY {p.fiscal_year}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={badge(p.status)}>{p.status}</Badge>
                    {p.status === 'draft' && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setLineForPeriod(p.id)
                            setLineCoa('')
                            setLineTarget('0')
                            setLineNotes('')
                          }}
                        >
                          Add line
                        </Button>
                        <Button size="sm" onClick={() => act(p.id, 'submit')}>
                          Submit
                        </Button>
                      </>
                    )}
                    {p.status === 'submitted' && (
                      <Button size="sm" onClick={() => act(p.id, 'approve')}>
                        Approve
                      </Button>
                    )}
                    {['draft', 'submitted'].includes(p.status) && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => act(p.id, 'cancel')}
                      >
                        Cancel
                      </Button>
                    )}
                  </div>
                </div>
                {p.lines?.length ? (
                  <Table className="mt-4">
                    <TableHeader>
                      <TableRow>
                        <TableHead>COA</TableHead>
                        <TableHead className="text-right">Target</TableHead>
                        <TableHead>Notes</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {p.lines.map((l) => (
                        <TableRow key={l.id}>
                          <TableCell className="font-mono text-xs">
                            {l.coa_code}
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            {Number(l.target_amount).toLocaleString()}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {l.notes ?? '—'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <p className="mt-2 text-sm text-muted-foreground">
                    No lines for this period.
                    {p.status === 'draft' && ' Use Add line to set COA targets.'}
                  </p>
                )}
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Dialog
        open={lineForPeriod != null}
        onOpenChange={(o) => !o && setLineForPeriod(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add budget line</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            <div className="grid gap-2">
              <Label htmlFor="ln-coa">Chart of account code</Label>
              <Input
                id="ln-coa"
                placeholder="e.g. 42021"
                value={lineCoa}
                onChange={(e) => setLineCoa(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="ln-amt">Target amount</Label>
              <Input
                id="ln-amt"
                inputMode="decimal"
                value={lineTarget}
                onChange={(e) => setLineTarget(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="ln-n">Notes (optional)</Label>
              <Textarea
                id="ln-n"
                rows={2}
                value={lineNotes}
                onChange={(e) => setLineNotes(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLineForPeriod(null)}>
              Cancel
            </Button>
            <Button onClick={() => void onSaveLine()}>Save line</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
