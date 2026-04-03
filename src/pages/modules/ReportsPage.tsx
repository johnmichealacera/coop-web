import { useEffect, useState } from 'react'
import {
  getDashboardModuleStats,
  listLoanApplications,
  listTreasuryTransactions,
} from '@/lib/modules-api'
import type {
  DashboardModuleStats,
  LoanApplication,
  TreasuryTransaction,
} from '@/lib/module-types'
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

export function ReportsPage() {
  const [stats, setStats] = useState<DashboardModuleStats | null>(null)
  const [loans, setLoans] = useState<LoanApplication[]>([])
  const [treasury, setTreasury] = useState<TreasuryTransaction[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const [s, l, t] = await Promise.all([
          getDashboardModuleStats(),
          listLoanApplications(),
          listTreasuryTransactions(),
        ])
        if (!cancelled) {
          setStats(s)
          setLoans(l)
          setTreasury(t.slice(0, 20))
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const ym = new Date().toISOString().slice(0, 7)
  const monthLabel = new Date().toLocaleString(undefined, {
    month: 'long',
    year: 'numeric',
  })
  const receiptsMonth = treasury
    .filter((x) => x.trans_date.startsWith(ym) && x.tx_type === 'receipt')
    .reduce((a, x) => a + Number(x.amount), 0)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Reports & inquiries
        </h1>
        <p className="mt-1 text-muted-foreground">
          Key figures and recent activity across loans, treasury, general ledger,
          inventory, and budget.
        </p>
      </div>

      {loading || !stats ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Open loan pipeline</CardDescription>
              <CardTitle className="text-3xl tabular-nums">
                {stats.openLoans}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground">
              Loan applications from draft through approved, before they are
              journalized.
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Receipts · {monthLabel}</CardDescription>
              <CardTitle className="text-3xl tabular-nums">
                {receiptsMonth.toLocaleString()}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground">
              Total amount of member receipts recorded in treasury this calendar
              month.
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Posted journals</CardDescription>
              <CardTitle className="text-3xl tabular-nums">
                {stats.postedJournals}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground">
              Journal entries posted to the general ledger.
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Inventory SKUs</CardDescription>
              <CardTitle className="text-3xl tabular-nums">
                {stats.inventorySkus}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground">
              Stock items (SKUs) on file.
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Budget periods</CardDescription>
              <CardTitle className="text-3xl tabular-nums">
                {stats.budgetPeriods}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground">
              Budget cycles set up for targets and monitoring.
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Loans by status</CardDescription>
            </CardHeader>
            <CardContent className="text-sm">
              <p className="mb-2 text-xs text-muted-foreground">
                Count of applications in each workflow stage.
              </p>
              {Object.entries(stats.loansByStatus).map(([k, v]) => (
                <div key={k} className="flex justify-between border-b border-border py-1 last:border-0">
                  <span>{k}</span>
                  <span className="tabular-nums font-medium">{v}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Loan register</CardTitle>
          <CardDescription>
            Reference, status, and principal for each application.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ref</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Principal</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loans.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={3}
                    className="text-muted-foreground"
                  >
                    No loan applications yet.
                  </TableCell>
                </TableRow>
              ) : (
                loans.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-mono text-xs">
                      {r.reference_no}
                    </TableCell>
                    <TableCell>{r.status}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {Number(r.principal).toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Treasury activity</CardTitle>
          <CardDescription>
            Up to 20 most recent transactions (date, type, product, amount).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Product</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {treasury.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="text-muted-foreground"
                  >
                    No treasury transactions yet.
                  </TableCell>
                </TableRow>
              ) : (
                treasury.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>{r.trans_date}</TableCell>
                    <TableCell>{r.tx_type}</TableCell>
                    <TableCell>{r.product}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {Number(r.amount).toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
