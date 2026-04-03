import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { createMember, listBranches, listMembers } from '@/lib/data'
import type { Branch, MemberWithLatest } from '@/lib/types'

export function MembersPage() {
  const [loading, setLoading] = useState(true)
  const [rows, setRows] = useState<MemberWithLatest[]>([])
  const [branches, setBranches] = useState<Branch[]>([])
  const [open, setOpen] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [branchId, setBranchId] = useState('')
  const [clientId, setClientId] = useState('')
  const [fullName, setFullName] = useState('')
  const [dateOpened, setDateOpened] = useState('')

  const load = useCallback(async () => {
    const [data, b] = await Promise.all([listMembers(), listBranches()])
    setRows(data)
    setBranches(b)
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
    if (branches.length && !branchId) setBranchId(branches[0].id)
  }, [branches, branchId])

  async function onCreate() {
    setErr(null)
    try {
      await createMember({
        branch_id: branchId,
        client_id: clientId,
        full_name: fullName,
        date_opened: dateOpened.trim() || null,
      })
      setOpen(false)
      setClientId('')
      setFullName('')
      setDateOpened('')
      await load()
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Could not add member')
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Members</h1>
        <p className="mt-1 text-muted-foreground">
          Branch + client ID, with latest MIGS rating from stored assessments.
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
            <CardTitle>Directory</CardTitle>
            <CardDescription>
              Select a member to adjust inputs and recalculate MIGS.
            </CardDescription>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger render={<Button type="button">Add member</Button>} />
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Add member</DialogTitle>
              </DialogHeader>
              <div className="grid gap-3 py-2">
                <div className="grid gap-2">
                  <Label htmlFor="mbr-branch">Branch</Label>
                  <Select
                    value={branchId}
                    onValueChange={(v) => setBranchId(v ?? '')}
                  >
                    <SelectTrigger id="mbr-branch">
                      <SelectValue placeholder="Branch" />
                    </SelectTrigger>
                    <SelectContent>
                      {branches.map((b) => (
                        <SelectItem key={b.id} value={b.id}>
                          {b.code} — {b.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="mbr-cid">Client ID</Label>
                  <Input
                    id="mbr-cid"
                    autoComplete="off"
                    placeholder="e.g. 100003"
                    value={clientId}
                    onChange={(e) => setClientId(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="mbr-name">Full name</Label>
                  <Input
                    id="mbr-name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="mbr-do">Date opened (optional)</Label>
                  <Input
                    id="mbr-do"
                    type="date"
                    value={dateOpened}
                    onChange={(e) => setDateOpened(e.target.value)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={() => void onCreate()}>Save</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-40 w-full" />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Client ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Year</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell className="font-mono text-sm">
                      {m.client_id}
                    </TableCell>
                    <TableCell>{m.full_name}</TableCell>
                    <TableCell>
                      {m.latest?.assessment_year ?? '—'}
                    </TableCell>
                    <TableCell className="tabular-nums">
                      {m.breakdown?.total ?? '—'}
                    </TableCell>
                    <TableCell>
                      {m.breakdown ? (
                        <Badge
                          variant={
                            m.breakdown.rating === 'MIGS'
                              ? 'default'
                              : 'secondary'
                          }
                        >
                          {m.breakdown.rating}
                        </Badge>
                      ) : (
                        '—'
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Link
                        className={cn(
                          buttonVariants({ variant: 'outline', size: 'sm' }),
                        )}
                        to={`/members/${m.id}`}
                      >
                        Open
                      </Link>
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
