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

const criteria = [
  {
    name: 'Patronize',
    max: 15,
    rule:
      '15 if sales invoice + any amount last year > 0; else if CAC products > 0; else if loan release + loan payments > 0; else 0.',
  },
  {
    name: 'Capital buildup',
    max: 10,
    rule: '10 if annual capital buildup ≥ 1,500; else 0.',
  },
  {
    name: 'Basic shares',
    max: 5,
    rule: '5 if basic shares ≥ 40,000; else 0.',
  },
  {
    name: 'Delinquency',
    max: 40,
    rule:
      '0 if charge-off > 0. Otherwise by days delinquent: 181+ → 0; 91–180 → 5; 61–90 → 10; 31–60 → 20; 1–30 → 30; 0 → 40.',
  },
  {
    name: 'Kaagapay',
    max: 10,
    rule: '10 if Kaagapay1 ≥ 1,000 or Kaagapay2 > 0; else 0.',
  },
  {
    name: 'Savings',
    max: 10,
    rule: '5 if savings ≥ 1,000; plus 5 if time deposits > 0.',
  },
  {
    name: 'Attendance',
    max: 10,
    rule: '10 if meetings ≥ 2; 5 if exactly 1; else 0.',
  },
]

export function CriteriaPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          MIGS scoring criteria
        </h1>
        <p className="mt-1 max-w-3xl text-muted-foreground">
          Seven components, maximum 100 points. Rating is{' '}
          <strong className="font-medium text-foreground">MIGS</strong> when
          the total is ≥ 75, otherwise{' '}
          <strong className="font-medium text-foreground">NON-MIGS</strong>.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Components (max 100)</CardTitle>
          <CardDescription>
            Weights used by the in-app calculator for each assessment year.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Component</TableHead>
                <TableHead className="text-right">Max pts</TableHead>
                <TableHead>Rule</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {criteria.map((c) => (
                <TableRow key={c.name}>
                  <TableCell className="font-medium">{c.name}</TableCell>
                  <TableCell className="text-right tabular-nums">{c.max}</TableCell>
                  <TableCell className="text-muted-foreground">{c.rule}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Patronage & DPR fields</CardTitle>
          <CardDescription>
            Related reporting uses share capital, average share capital,
            interest paid, dividend, patronage, gross DPR, and notes — see the
            Patronage screen for period-level allocations.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          <p>
            Column names in data include{' '}
            <code className="rounded bg-muted px-1">SHARECAPITAL</code>,{' '}
            <code className="rounded bg-muted px-1">AVGSHARECAPITAL</code>,{' '}
            <code className="rounded bg-muted px-1">INTPAID</code>,{' '}
            <code className="rounded bg-muted px-1">DIVIDEND</code>,{' '}
            <code className="rounded bg-muted px-1">PATRONAGE</code>,{' '}
            <code className="rounded bg-muted px-1">GrossDPR</code>, and{' '}
            <code className="rounded bg-muted px-1">Explanation</code>.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
