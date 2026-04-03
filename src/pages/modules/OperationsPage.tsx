import { useCallback, useEffect, useState } from 'react'
import {
  createStockMovement,
  listInventoryItems,
  listSuppliers,
} from '@/lib/modules-api'
import type { InventoryItem, StockMovement, Supplier } from '@/lib/module-types'
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

export function OperationsPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [items, setItems] = useState<InventoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [itemId, setItemId] = useState('')
  const [movType, setMovType] = useState<'in' | 'out' | 'transfer'>('in')
  const [qty, setQty] = useState('10')
  const [ref, setRef] = useState('')
  const [date, setDate] = useState(
    () => new Date().toISOString().slice(0, 10),
  )

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [s, i] = await Promise.all([
        listSuppliers(),
        listInventoryItems(),
      ])
      setSuppliers(s)
      setItems(i)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    if (items.length && !itemId) setItemId(items[0].id)
  }, [items, itemId])

  async function onMove() {
    setErr(null)
    try {
      await createStockMovement({
        item_id: itemId,
        movement_type: movType,
        qty: Number(qty) || 0,
        reference: ref || undefined,
        trans_date: date,
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
          POS & inventory
        </h1>
        <p className="mt-1 text-muted-foreground">
          Suppliers, SKU on-hand, and stock movements (receipt / issue /
          transfer flag).
        </p>
      </div>

      {err && (
        <p className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {err}
        </p>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Suppliers</CardTitle>
            <CardDescription>Vendor master (read-only MVP).</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Contact</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {suppliers.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-mono text-xs">{s.code}</TableCell>
                    <TableCell>{s.name}</TableCell>
                    <TableCell className="text-xs">{s.contact ?? '—'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2">
            <div>
              <CardTitle>Inventory</CardTitle>
              <CardDescription>On-hand by SKU.</CardDescription>
            </div>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger
                render={
                  <button
                    type="button"
                    className="inline-flex h-8 items-center justify-center rounded-lg border border-transparent bg-primary px-2.5 text-sm font-medium text-primary-foreground"
                  >
                    Stock movement
                  </button>
                }
              />
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Receive / issue stock</DialogTitle>
                </DialogHeader>
                <div className="grid gap-3 py-2">
                  <div className="grid gap-2">
                    <Label>Item</Label>
                    <Select
                      value={itemId}
                      onValueChange={(v) => setItemId(v ?? '')}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {items.map((i) => (
                          <SelectItem key={i.id} value={i.id}>
                            {i.sku} — {i.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label>Movement</Label>
                    <Select
                      value={movType}
                      onValueChange={(v) =>
                        setMovType(v as StockMovement['movement_type'])
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="in">Receive (in)</SelectItem>
                        <SelectItem value="out">Issue (out)</SelectItem>
                        <SelectItem value="transfer">Transfer (no qty change)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="grid gap-2">
                      <Label htmlFor="q">Qty</Label>
                      <Input
                        id="q"
                        inputMode="decimal"
                        value={qty}
                        onChange={(e) => setQty(e.target.value)}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="dt">Date</Label>
                      <Input
                        id="dt"
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="rf">Reference</Label>
                    <Input
                      id="rf"
                      value={ref}
                      onChange={(e) => setRef(e.target.value)}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={onMove}>Save</Button>
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
                    <TableHead>SKU</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead className="text-right">On hand</TableHead>
                    <TableHead className="text-right">Reorder</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((i) => (
                    <TableRow key={i.id}>
                      <TableCell className="font-mono text-xs">{i.sku}</TableCell>
                      <TableCell>{i.name}</TableCell>
                      <TableCell className="text-right tabular-nums">
                        {Number(i.qty_on_hand).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {i.reorder_level ?? '—'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
