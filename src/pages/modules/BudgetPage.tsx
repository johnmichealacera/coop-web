import { useCallback, useEffect, useState } from 'react'
import { advanceBudgetStatus, listBudgetPeriods } from '@/lib/modules-api'
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

export function BudgetPage() {
  const [periods, setPeriods] = useState<
    (BudgetPeriod & { lines?: BudgetLine[] })[]
  >([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState<string | null>(null)

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
          Budget periods, GL targets, and approval tagging (new → submitted →
          approved).
        </p>
      </div>

      {err && (
        <p className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {err}
        </p>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Budget periods</CardTitle>
          <CardDescription>
            Lines store target amounts per COA code for reporting.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
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
                      <Button size="sm" onClick={() => act(p.id, 'submit')}>
                        Submit
                      </Button>
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
                  </p>
                )}
              </div>
            ))
          )}
        </CardContent>
      </Card>

    </div>
  )
}
