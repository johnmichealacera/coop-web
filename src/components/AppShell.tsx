import type { ComponentType } from 'react'
import { Link, Outlet, useLocation } from 'react-router-dom'
import {
  BookOpen,
  Calculator,
  HandCoins,
  LayoutDashboard,
  Leaf,
  LineChart,
  PieChart,
  PiggyBank,
  Shield,
  ShoppingCart,
  Users,
  Wallet,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import { getConnectionMode } from '@/lib/data'

type NavItem = {
  to: string
  label: string
  icon: ComponentType<{ className?: string }>
}

function pathActive(pathname: string, to: string): boolean {
  if (to === '/') return pathname === '/'
  return pathname === to || pathname.startsWith(`${to}/`)
}

const navGroups: { label: string; items: NavItem[] }[] = [
  {
    label: 'Overview',
    items: [{ to: '/', label: 'Dashboard', icon: LayoutDashboard }],
  },
  {
    label: 'Operations',
    items: [
      { to: '/modules/loans', label: 'Loans', icon: PiggyBank },
      { to: '/modules/treasury', label: 'Treasury', icon: Wallet },
      { to: '/modules/accounting', label: 'Accounting', icon: Calculator },
      { to: '/modules/operations', label: 'POS & inventory', icon: ShoppingCart },
      { to: '/modules/reports', label: 'Reports', icon: LineChart },
      { to: '/modules/budget', label: 'Budget', icon: PieChart },
      { to: '/modules/admin', label: 'Admin & system', icon: Shield },
    ],
  },
  {
    label: 'Members',
    items: [
      { to: '/members', label: 'Members & MIGS', icon: Users },
      { to: '/patronage', label: 'Patronage / DPR', icon: HandCoins },
      { to: '/criteria', label: 'MIGS criteria', icon: BookOpen },
    ],
  },
]

const flatNav: NavItem[] = navGroups.flatMap((g) => g.items)

export function AppShell() {
  const location = useLocation()
  const mode = getConnectionMode()

  return (
    <div className="flex min-h-svh w-full bg-background">
      <aside className="hidden w-60 shrink-0 overflow-y-auto border-r border-border bg-sidebar md:flex md:flex-col">
        <div className="flex items-center gap-2 border-b border-sidebar-border px-4 py-4">
          <Leaf className="size-5 text-primary" aria-hidden />
          <div className="text-left leading-tight">
            <p className="text-sm font-semibold text-sidebar-foreground">
              Island Co-op
            </p>
            <p className="text-xs text-muted-foreground">Cooperative platform</p>
          </div>
        </div>
        <nav className="flex flex-1 flex-col gap-4 p-3">
          {navGroups.map((group) => (
            <div key={group.label}>
              <p className="mb-2 px-2 text-[10px] font-semibold tracking-wide text-muted-foreground uppercase">
                {group.label}
              </p>
              <div className="flex flex-col gap-0.5">
                {group.items.map(({ to, label, icon: Icon }) => {
                  const active = pathActive(location.pathname, to)
                  return (
                    <Link
                      key={to}
                      to={to}
                      className={cn(
                        'flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                        active
                          ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                          : 'text-sidebar-foreground/80 hover:bg-sidebar-accent/60',
                      )}
                    >
                      <Icon className="size-4 shrink-0" />
                      <span className="truncate">{label}</span>
                    </Link>
                  )
                })}
              </div>
            </div>
          ))}
        </nav>
        <Separator />
        <div className="p-3">
          <Badge variant={mode === 'supabase' ? 'default' : 'secondary'}>
            {mode === 'supabase' ? 'Supabase live' : 'Local demo data'}
          </Badge>
          <p className="mt-2 text-xs text-muted-foreground">
            Add <code className="rounded bg-muted px-1">.env</code> to connect
            your project.
          </p>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="border-b border-border md:hidden">
          <div className="flex items-center gap-3 px-4 py-3">
            <Leaf className="size-5 text-primary" />
            <span className="font-semibold">Island Co-op</span>
            <Badge variant="outline" className="ml-auto text-xs">
              {mode === 'supabase' ? 'Live' : 'Demo'}
            </Badge>
          </div>
          <nav className="flex gap-1 overflow-x-auto px-2 pb-2 text-xs">
            {flatNav.map(({ to, label }) => {
              const active = pathActive(location.pathname, to)
              return (
                <Link
                  key={to}
                  to={to}
                  className={cn(
                    'shrink-0 rounded-md px-2.5 py-1.5 whitespace-nowrap',
                    active
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground',
                  )}
                >
                  {label}
                </Link>
              )
            })}
          </nav>
        </header>
        <main className="flex-1 overflow-auto p-4 md:p-8">
          <div className="mx-auto max-w-7xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
