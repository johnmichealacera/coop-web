import { useCallback, useEffect, useState } from 'react'
import {
  createTreasuryTransaction,
  listMembersLite,
  listTreasuryTransactions,
} from '@/lib/modules-api'
import type { TreasuryTransaction } from '@/lib/module-types'
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'
import type { Member } from '@/lib/types'

const TX_TYPES = [
  { value: 'receipt', label: 'Receipt' },
  { value: 'withdrawal', label: 'Withdrawal' },
  { value: 'transfer_out', label: 'Transfer out' },
  { value: 'transfer_in', label: 'Transfer in' },
  { value: 'disbursement', label: 'Disbursement' },
] as const

const PRODUCTS = [
  'savings',
  'share_capital',
  'time_deposit',
  'loan_payment',
  'collection',
]

export function TreasuryPage() {
  const [rows, setRows] = useState<TreasuryTransaction[]>([])
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [memberId, setMemberId] = useState('')
  const [txType, setTxType] = useState<string>('receipt')
  const [product, setProduct] = useState('savings')
  const [amount, setAmount] = useState('1000')
  const [reference, setReference] = useState('')
  const [transDate, setTransDate] = useState(
    () => new Date().toISOString().slice(0, 10),
  )
  const [memo, setMemo] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [t, m] = await Promise.all([
        listTreasuryTransactions(),
        listMembersLite(),
      ])
      setRows(t)
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

  const name = (id: string | null) =>
    id ? (members.find((x) => x.id === id)?.full_name ?? id) : '—'

  async function onSubmit() {
    setErr(null)
    try {
      await createTreasuryTransaction({
        member_id: memberId,
        tx_type: txType as TreasuryTransaction['tx_type'],
        product,
        amount: Number(amount) || 0,
        reference: reference || undefined,
        trans_date: transDate,
        memo: memo || undefined,
      })
      setOpen(false)
      await load()
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Failed')
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Treasury & tellering
        </h1>
        <p className="mt-1 text-muted-foreground">
          Record receipts, withdrawals, transfers, and disbursements against
          member subsidiary ledgers (simplified SL product codes).
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
            <CardTitle>Transactions</CardTitle>
            <CardDescription>
              Front-office style entries — link to member where applicable.
            </CardDescription>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger
              render={
                <button
                  type="button"
                  className="inline-flex h-8 items-center justify-center rounded-lg border border-transparent bg-primary px-2.5 text-sm font-medium text-primary-foreground"
                >
                  New transaction
                </button>
              }
            />
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>New treasury transaction</DialogTitle>
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
                  <Label>Type</Label>
                  <Select
                    value={txType}
                    onValueChange={(v) => setTxType(v ?? 'receipt')}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TX_TYPES.map((t) => (
                        <SelectItem key={t.value} value={t.value}>
                          {t.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Product (SL)</Label>
                  <Select
                    value={product}
                    onValueChange={(v) => setProduct(v ?? 'savings')}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PRODUCTS.map((p) => (
                        <SelectItem key={p} value={p}>
                          {p}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="grid gap-2">
                    <Label htmlFor="amt">Amount</Label>
                    <Input
                      id="amt"
                      inputMode="decimal"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="td">Date</Label>
                    <Input
                      id="td"
                      type="date"
                      value={transDate}
                      onChange={(e) => setTransDate(e.target.value)}
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="ref">Reference</Label>
                  <Input
                    id="ref"
                    value={reference}
                    onChange={(e) => setReference(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="mem">Memo</Label>
                  <Textarea
                    id="mem"
                    rows={2}
                    value={memo}
                    onChange={(e) => setMemo(e.target.value)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={onSubmit}>Save</Button>
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
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Member</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Ref</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="whitespace-nowrap">
                      {r.trans_date}
                    </TableCell>
                    <TableCell>{r.tx_type}</TableCell>
                    <TableCell>{r.product}</TableCell>
                    <TableCell>{name(r.member_id)}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {Number(r.amount).toLocaleString()}
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {r.reference ?? '—'}
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
