import { useEffect, useState } from 'react'
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
import { Skeleton } from '@/components/ui/skeleton'
import { listPatronage } from '@/lib/data'
import type { Member, PatronageAllocation } from '@/lib/types'

type Row = PatronageAllocation & { member?: Member }

export function PatronagePage() {
  const [loading, setLoading] = useState(true)
  const [rows, setRows] = useState<Row[]>([])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const data = await listPatronage()
        if (!cancelled) setRows(data)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Patronage / DPR
        </h1>
        <p className="mt-1 max-w-3xl text-muted-foreground">
          Period-level allocation per member: share capital, interest paid,
          dividend, patronage, and gross DPR.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Allocations</CardTitle>
          <CardDescription>
            Period-level snapshot per member (expand later with full batch
            queries).
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-40 w-full" />
          ) : rows.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No patronage rows yet. Seed data in Supabase or use demo mode.
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
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          {rows.some((r) => r.explanation) && (
            <div className="mt-4 space-y-2 text-sm text-muted-foreground">
              {rows.map(
                (r) =>
                  r.explanation && (
                    <p key={`${r.id}-note`}>
                      <span className="font-medium text-foreground">
                        {r.member?.full_name}:{' '}
                      </span>
                      {r.explanation}
                    </p>
                  ),
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
