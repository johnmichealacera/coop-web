import { useCallback, useEffect, useState } from 'react'
import {
  createLookupCategory,
  createLookupValue,
  listLookupCategories,
  listLookupValues,
} from '@/lib/modules-api'
import { listBranches } from '@/lib/data'
import type { LookupCategory, LookupValue } from '@/lib/module-types'
import type { Branch } from '@/lib/types'
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

export function AdminPage() {
  const [branches, setBranches] = useState<Branch[]>([])
  const [cats, setCats] = useState<LookupCategory[]>([])
  const [vals, setVals] = useState<LookupValue[]>([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState<string | null>(null)
  const [openCat, setOpenCat] = useState(false)
  const [openVal, setOpenVal] = useState(false)
  const [catCode, setCatCode] = useState('')
  const [catName, setCatName] = useState('')
  const [valCat, setValCat] = useState('')
  const [valCode, setValCode] = useState('')
  const [valDesc, setValDesc] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [b, c, v] = await Promise.all([
        listBranches(),
        listLookupCategories(),
        listLookupValues(),
      ])
      setBranches(b)
      setCats(c)
      setVals(v)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    if (cats.length && !valCat) setValCat(cats[0].id)
  }, [cats, valCat])

  async function saveCat() {
    setErr(null)
    try {
      await createLookupCategory({ code: catCode, name: catName })
      setOpenCat(false)
      setCatCode('')
      setCatName('')
      await load()
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Failed')
    }
  }

  async function saveVal() {
    setErr(null)
    try {
      await createLookupValue({
        category_id: valCat,
        code: valCode,
        description: valDesc,
      })
      setOpenVal(false)
      setValCode('')
      setValDesc('')
      await load()
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Failed')
    }
  }

  const catLabel = (id: string) =>
    cats.find((c) => c.id === id)?.code ?? id

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Administration
        </h1>
        <p className="mt-1 text-muted-foreground">
          Branch directory (read-only) and configurable lookup lists.
        </p>
      </div>

      {err && (
        <p className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {err}
        </p>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Branches</CardTitle>
          <CardDescription>Office codes and display names.</CardDescription>
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
                </TableRow>
              </TableHeader>
              <TableBody>
                {branches.map((b) => (
                  <TableRow key={b.id}>
                    <TableCell className="tabular-nums">{b.code}</TableCell>
                    <TableCell>{b.name}</TableCell>
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
            <CardTitle>Lookup categories</CardTitle>
            <CardDescription>Group codes (e.g. LOAN_TYPE, DEPT).</CardDescription>
          </div>
          <Dialog open={openCat} onOpenChange={setOpenCat}>
            <DialogTrigger
              render={
                <button
                  type="button"
                  className="inline-flex h-8 items-center justify-center rounded-lg border border-transparent bg-primary px-2.5 text-sm font-medium text-primary-foreground"
                >
                  New category
                </button>
              }
            />
            <DialogContent>
              <DialogHeader>
                <DialogTitle>New lookup category</DialogTitle>
              </DialogHeader>
              <div className="grid gap-3 py-2">
                <div className="grid gap-2">
                  <Label htmlFor="cc">Code</Label>
                  <Input
                    id="cc"
                    value={catCode}
                    onChange={(e) => setCatCode(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="cn">Name</Label>
                  <Input
                    id="cn"
                    value={catName}
                    onChange={(e) => setCatName(e.target.value)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpenCat(false)}>
                  Cancel
                </Button>
                <Button onClick={saveCat}>Save</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Name</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cats.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-mono text-xs">{c.code}</TableCell>
                  <TableCell>{c.name}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2">
          <div>
            <CardTitle>Lookup values</CardTitle>
            <CardDescription>Codes under each category.</CardDescription>
          </div>
          <Dialog open={openVal} onOpenChange={setOpenVal}>
            <DialogTrigger
              render={
                <button
                  type="button"
                  className="inline-flex h-8 items-center justify-center rounded-lg border border-border bg-background px-2.5 text-sm font-medium"
                >
                  New value
                </button>
              }
            />
            <DialogContent>
              <DialogHeader>
                <DialogTitle>New lookup value</DialogTitle>
              </DialogHeader>
              <div className="grid gap-3 py-2">
                <div className="grid gap-2">
                  <Label>Category</Label>
                  <Select
                    value={valCat}
                    onValueChange={(v) => setValCat(v ?? '')}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {cats.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.code} — {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="vc">Code</Label>
                  <Input
                    id="vc"
                    value={valCode}
                    onChange={(e) => setValCode(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="vd">Description</Label>
                  <Textarea
                    id="vd"
                    rows={2}
                    value={valDesc}
                    onChange={(e) => setValDesc(e.target.value)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpenVal(false)}>
                  Cancel
                </Button>
                <Button onClick={saveVal}>Save</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Category</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Description</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {vals.map((v) => (
                <TableRow key={v.id}>
                  <TableCell className="font-mono text-xs">
                    {catLabel(v.category_id)}
                  </TableCell>
                  <TableCell className="font-mono text-xs">{v.code}</TableCell>
                  <TableCell>{v.description}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
