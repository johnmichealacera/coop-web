import { useCallback, useEffect, useState } from 'react'
import {
  createBatchReceiptJournal,
  createJournalEntry,
  listChartOfAccounts,
  listJournalEntries,
  postJournalEntry,
} from '@/lib/modules-api'
import type { ChartOfAccountRow, JournalEntry } from '@/lib/module-types'
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
import { Badge } from '@/components/ui/badge'

export function AccountingPage() {
  const [coa, setCoa] = useState<ChartOfAccountRow[]>([])
  const [journals, setJournals] = useState<(JournalEntry & { lines?: { id: string; coa_code: string; debit: number; credit: number; description: string | null }[] })[]>([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState<string | null>(null)
  const [open, setOpen] = useState(false)
  const [openBatch, setOpenBatch] = useState(false)

  const [entryDate, setEntryDate] = useState(
    () => new Date().toISOString().slice(0, 10),
  )
  const [memo, setMemo] = useState('')
  const [c1, setC1] = useState('2101')
  const [amt, setAmt] = useState('5000')

  const [batchFile, setBatchFile] = useState('RCP00001')
  const [batchAmt, setBatchAmt] = useState('10000')
  const [batchProduct, setBatchProduct] = useState<
    'share_capital' | 'time_deposit' | 'savings'
  >('savings')
  const [batchDate, setBatchDate] = useState(
    () => new Date().toISOString().slice(0, 10),
  )

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [c, j] = await Promise.all([
        listChartOfAccounts(),
        listJournalEntries(),
      ])
      setCoa(c)
      setJournals(j)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  async function onSaveJournal() {
    setErr(null)
    try {
      const amount = Number(amt) || 0
      await createJournalEntry({
        entry_date: entryDate,
        journal_type: 'general',
        memo: memo || undefined,
        lines: [
          {
            coa_code: '1010',
            description: 'Debit line',
            debit: amount,
            credit: 0,
          },
          {
            coa_code: c1,
            description: 'Credit line',
            debit: 0,
            credit: amount,
          },
        ],
      })
      setOpen(false)
      await load()
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Failed')
    }
  }

  async function onBatch() {
    setErr(null)
    try {
      await createBatchReceiptJournal({
        amount: Number(batchAmt) || 0,
        product: batchProduct,
        trans_date: batchDate,
        file_label: batchFile,
      })
      setOpenBatch(false)
      await load()
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Failed')
    }
  }

  async function onPost(id: string) {
    setErr(null)
    try {
      await postJournalEntry(id)
      await load()
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Failed')
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Accounting & GL
        </h1>
        <p className="mt-1 text-muted-foreground">
          Chart of accounts, balanced journal entries, and batch receipt posting
          (collection payment vs member subsidiary ledger).
        </p>
      </div>

      {err && (
        <p className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {err}
        </p>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Chart of accounts</CardTitle>
          <CardDescription>
            Account codes and types used for journal entries and reporting.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {coa.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell className="font-mono">{a.code}</TableCell>
                    <TableCell>{a.name}</TableCell>
                    <TableCell>{a.account_type}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2">
            <div>
              <CardTitle>General journal</CardTitle>
              <CardDescription>
                Two-line balanced entry (debit cash, credit liability).
              </CardDescription>
            </div>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger
                render={
                  <button
                    type="button"
                    className="inline-flex h-8 items-center justify-center rounded-lg border border-transparent bg-primary px-2.5 text-sm font-medium text-primary-foreground"
                  >
                    New journal
                  </button>
                }
              />
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>New journal entry</DialogTitle>
                </DialogHeader>
                <div className="grid gap-3 py-2">
                  <div className="grid gap-2">
                    <Label htmlFor="ed">Entry date</Label>
                    <Input
                      id="ed"
                      type="date"
                      value={entryDate}
                      onChange={(e) => setEntryDate(e.target.value)}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="memo">Memo</Label>
                    <Textarea
                      id="memo"
                      rows={2}
                      value={memo}
                      onChange={(e) => setMemo(e.target.value)}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Amount (balanced: 1010 debit / credit account)</Label>
                    <Input
                      inputMode="decimal"
                      value={amt}
                      onChange={(e) => setAmt(e.target.value)}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Credit account code</Label>
                    <Input
                      value={c1}
                      onChange={(e) => setC1(e.target.value)}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Debit line fixed to 1010 (cash on hand) for this MVP.
                  </p>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={onSaveJournal}>Save draft</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Ref</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {journals.map((j) => (
                  <TableRow key={j.id}>
                    <TableCell>{j.entry_date}</TableCell>
                    <TableCell className="font-mono text-xs">
                      {j.reference ?? j.journal_type}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          j.status === 'posted' ? 'default' : 'secondary'
                        }
                      >
                        {j.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {j.status === 'draft' && (
                        <Button size="sm" onClick={() => onPost(j.id)}>
                          Post
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2">
            <div>
              <CardTitle>Batch upload (simulated)</CardTitle>
              <CardDescription>
                Short file label (up to 8 characters), amount, and product
                mapping to a two-line journal.
              </CardDescription>
            </div>
            <Dialog open={openBatch} onOpenChange={setOpenBatch}>
              <DialogTrigger
                render={
                  <button
                    type="button"
                    className="inline-flex h-8 items-center justify-center rounded-lg border border-border bg-background px-2.5 text-sm font-medium"
                  >
                    Open batch wizard
                  </button>
                }
              />
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>File upload amount</DialogTitle>
                </DialogHeader>
                <div className="grid gap-3 py-2">
                  <div className="grid gap-2">
                    <Label htmlFor="bf">File label (≤8 chars)</Label>
                    <Input
                      id="bf"
                      maxLength={8}
                      value={batchFile}
                      onChange={(e) =>
                        setBatchFile(e.target.value.slice(0, 8))
                      }
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Product (SL)</Label>
                    <Select
                      value={batchProduct}
                      onValueChange={(v) =>
                        setBatchProduct(
                          v as 'share_capital' | 'time_deposit' | 'savings',
                        )
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="savings">Savings</SelectItem>
                        <SelectItem value="time_deposit">Time deposit</SelectItem>
                        <SelectItem value="share_capital">Share capital</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="ba">Amount</Label>
                    <Input
                      id="ba"
                      inputMode="decimal"
                      value={batchAmt}
                      onChange={(e) => setBatchAmt(e.target.value)}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="bd">Transaction date</Label>
                    <Input
                      id="bd"
                      type="date"
                      value={batchDate}
                      onChange={(e) => setBatchDate(e.target.value)}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setOpenBatch(false)}>
                    Cancel
                  </Button>
                  <Button onClick={onBatch}>Create journal entry</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            <p>
              Pro forma: Debit <strong className="text-foreground">1010</strong>{' '}
              collection payment, credit the selected liability/equity account
              (2101 / 2201 / 3101).
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
