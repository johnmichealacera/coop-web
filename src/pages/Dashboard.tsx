import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  Calculator,
  LineChart,
  PiggyBank,
  PieChart,
  Shield,
  ShoppingCart,
  Users,
  Wallet,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { listMembers } from '@/lib/data'
import { getDashboardModuleStats } from '@/lib/modules-api'

export function DashboardPage() {
  const [loading, setLoading] = useState(true)
  const [migs, setMigs] = useState(0)
  const [non, setNon] = useState(0)
  const [total, setTotal] = useState(0)
  const [openLoans, setOpenLoans] = useState(0)
  const [postedGl, setPostedGl] = useState(0)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const [rows, mod] = await Promise.all([
          listMembers(),
          getDashboardModuleStats(),
        ])
        if (cancelled) return
        setTotal(rows.length)
        let a = 0
        let b = 0
        for (const r of rows) {
          if (r.breakdown?.rating === 'MIGS') a++
          else if (r.breakdown?.rating === 'NON-MIGS') b++
        }
        setMigs(a)
        setNon(b)
        setOpenLoans(mod.openLoans)
        setPostedGl(mod.postedJournals)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Cooperative operations
        </h1>
        <p className="mt-1 text-muted-foreground">
          Member services, MIGS scoring, loans, treasury, accounting, inventory,
          reports, and budget — unified for your cooperative.
        </p>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-5">
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Members</CardDescription>
              <CardTitle className="text-3xl tabular-nums">{total}</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Records in the current data source (demo or Supabase).
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>MIGS (latest)</CardDescription>
              <CardTitle className="text-3xl tabular-nums text-primary">
                {migs}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex items-center gap-2 text-sm">
              <Badge variant="default">≥ 75 pts</Badge>
              <span className="text-muted-foreground">per policy</span>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Non-MIGS (latest)</CardDescription>
              <CardTitle className="text-3xl tabular-nums">{non}</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Members with score below threshold or no assessment.
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Open loans</CardDescription>
              <CardTitle className="text-3xl tabular-nums">{openLoans}</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Draft → approved (not journalized).
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Posted journals</CardDescription>
              <CardTitle className="text-3xl tabular-nums">{postedGl}</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              GL entries posted.
            </CardContent>
          </Card>
        </div>
      )}

      <div>
        <h2 className="text-lg font-semibold">Modules</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Jump to a functional area of the platform.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              to: '/modules/loans',
              title: 'Loans',
              desc: 'Applications and approvals.',
              icon: PiggyBank,
            },
            {
              to: '/modules/treasury',
              title: 'Treasury',
              desc: 'Receipts, transfers, disbursements.',
              icon: Wallet,
            },
            {
              to: '/modules/accounting',
              title: 'Accounting',
              desc: 'Chart of accounts and journals.',
              icon: Calculator,
            },
            {
              to: '/modules/operations',
              title: 'POS & inventory',
              desc: 'Items, suppliers, stock.',
              icon: ShoppingCart,
            },
            {
              to: '/modules/reports',
              title: 'Reports',
              desc: 'KPIs and activity lists.',
              icon: LineChart,
            },
            {
              to: '/modules/budget',
              title: 'Budget',
              desc: 'Periods and targets.',
              icon: PieChart,
            },
            {
              to: '/modules/admin',
              title: 'Admin',
              desc: 'Branches and lookup data.',
              icon: Shield,
            },
          ].map(({ to, title, desc, icon: Icon }) => (
            <Link key={to} to={to}>
              <Card className="h-full transition-colors hover:bg-muted/50">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base">{title}</CardTitle>
                    <Icon className="size-5 shrink-0 text-primary" />
                  </div>
                  <CardDescription className="text-xs">{desc}</CardDescription>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="size-5" />
            Member data & MIGS
          </CardTitle>
          <CardDescription>
            Open a member to edit annual inputs and see the live MIGS breakdown
            (total ≥ 75 → MIGS).
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Link className={cn(buttonVariants())} to="/members">
            View members
            <ArrowRight className="size-4" />
          </Link>
          <Link
            className={cn(buttonVariants({ variant: 'outline' }))}
            to="/criteria"
          >
            Review scoring rules
          </Link>
          <Link
            className={cn(buttonVariants({ variant: 'outline' }))}
            to="/patronage"
          >
            Patronage / DPR
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}
