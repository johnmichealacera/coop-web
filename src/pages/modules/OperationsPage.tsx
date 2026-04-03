import { useCallback, useEffect, useState } from 'react'
import {
  createInventoryItem,
  createStockMovement,
  createSupplier,
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
  const [openMove, setOpenMove] = useState(false)
  const [openItem, setOpenItem] = useState(false)
  const [openSupplier, setOpenSupplier] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [supCode, setSupCode] = useState('')
  const [supName, setSupName] = useState('')
  const [supContact, setSupContact] = useState('')
  const [itemId, setItemId] = useState('')
  const [movType, setMovType] = useState<'in' | 'out' | 'transfer'>('in')
  const [qty, setQty] = useState('10')
  const [ref, setRef] = useState('')
  const [date, setDate] = useState(
    () => new Date().toISOString().slice(0, 10),
  )
  const [invSku, setInvSku] = useState('')
  const [invName, setInvName] = useState('')
  const [invUnit, setInvUnit] = useState('pc')
  const [invQty, setInvQty] = useState('0')
  const [invReorder, setInvReorder] = useState('')

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

  async function onSaveSupplier() {
    setErr(null)
    try {
      await createSupplier({
        code: supCode,
        name: supName,
        contact: supContact || undefined,
      })
      setOpenSupplier(false)
      setSupCode('')
      setSupName('')
      setSupContact('')
      await load()
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Could not add supplier')
    }
  }

  async function onSaveItem() {
    setErr(null)
    try {
      const created = await createInventoryItem({
        sku: invSku,
        name: invName,
        unit: invUnit || undefined,
        qty_on_hand: Number(invQty) || 0,
        reorder_level:
          invReorder.trim() === '' ? null : Number(invReorder) || 0,
      })
      setOpenItem(false)
      setInvSku('')
      setInvName('')
      setInvUnit('pc')
      setInvQty('0')
      setInvReorder('')
      setItemId(created.id)
      await load()
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Could not add item')
    }
  }

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
      setOpenMove(false)
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
          Suppliers, item balances, and stock received, issued, or transferred.
        </p>
      </div>

      {err && (
        <p className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {err}
        </p>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2">
            <div>
              <CardTitle>Suppliers</CardTitle>
              <CardDescription>
                Supplier codes, names, and contacts for purchasing and receiving.
              </CardDescription>
            </div>
            <Dialog open={openSupplier} onOpenChange={setOpenSupplier}>
              <DialogTrigger
                render={
                  <Button type="button" size="sm">
                    Add supplier
                  </Button>
                }
              />
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Add supplier</DialogTitle>
                </DialogHeader>
                <div className="grid gap-3 py-2">
                  <div className="grid gap-2">
                    <Label htmlFor="sup-code">Code</Label>
                    <Input
                      id="sup-code"
                      autoComplete="off"
                      placeholder="e.g. SUP-02"
                      value={supCode}
                      onChange={(e) => setSupCode(e.target.value)}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="sup-name">Name</Label>
                    <Input
                      id="sup-name"
                      value={supName}
                      onChange={(e) => setSupName(e.target.value)}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="sup-contact">Contact (optional)</Label>
                    <Input
                      id="sup-contact"
                      placeholder="Phone or email"
                      value={supContact}
                      onChange={(e) => setSupContact(e.target.value)}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setOpenSupplier(false)}
                  >
                    Cancel
                  </Button>
                  <Button onClick={() => void onSaveSupplier()}>Save</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            {suppliers.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No suppliers yet. Click Add supplier to register vendors you buy
                from.
              </p>
            ) : (
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
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2">
            <div>
              <CardTitle>Inventory</CardTitle>
              <CardDescription>
                Quantity on hand and reorder level by item.
              </CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              <Dialog open={openItem} onOpenChange={setOpenItem}>
                <DialogTrigger
                  render={<Button type="button" size="sm">Add item</Button>}
                />
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Add inventory item</DialogTitle>
                  </DialogHeader>
                  <div className="grid gap-3 py-2">
                    <div className="grid gap-2">
                      <Label htmlFor="inv-sku">SKU</Label>
                      <Input
                        id="inv-sku"
                        autoComplete="off"
                        placeholder="e.g. SKU-RICE25"
                        value={invSku}
                        onChange={(e) => setInvSku(e.target.value)}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="inv-name">Name</Label>
                      <Input
                        id="inv-name"
                        placeholder="Item description"
                        value={invName}
                        onChange={(e) => setInvName(e.target.value)}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="grid gap-2">
                        <Label htmlFor="inv-unit">Unit</Label>
                        <Input
                          id="inv-unit"
                          placeholder="pc, bag, kg…"
                          value={invUnit}
                          onChange={(e) => setInvUnit(e.target.value)}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="inv-qty">Starting on hand</Label>
                        <Input
                          id="inv-qty"
                          inputMode="decimal"
                          value={invQty}
                          onChange={(e) => setInvQty(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="inv-ro">Reorder level (optional)</Label>
                      <Input
                        id="inv-ro"
                        inputMode="decimal"
                        placeholder="Alert when below this qty"
                        value={invReorder}
                        onChange={(e) => setInvReorder(e.target.value)}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setOpenItem(false)}
                    >
                      Cancel
                    </Button>
                    <Button onClick={() => void onSaveItem()}>Save</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              <Dialog open={openMove} onOpenChange={setOpenMove}>
                <DialogTrigger
                  render={
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={items.length === 0}
                    >
                      Record movement
                    </Button>
                  }
                />
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Record stock movement</DialogTitle>
                </DialogHeader>
                <div className="grid gap-3 py-2">
                  <div className="grid gap-2">
                    <Label>Item</Label>
                    <Select
                      value={itemId}
                      onValueChange={(v) => setItemId(v ?? '')}
                      itemToStringLabel={(id) => {
                        const i = items.find((x) => x.id === id)
                        return i ? `${i.name} (${i.sku})` : 'Select item'
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select item" />
                      </SelectTrigger>
                      <SelectContent>
                        {items.map((i) => (
                          <SelectItem key={i.id} value={i.id}>
                            {i.name} ({i.sku})
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
                  <Button variant="outline" onClick={() => setOpenMove(false)}>
                    Cancel
                  </Button>
                  <Button onClick={onMove}>Save</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-sm text-muted-foreground">Loading…</p>
            ) : items.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No stock items yet. Use Add item to register SKUs you sell or
                consume.
              </p>
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
