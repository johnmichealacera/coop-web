/**
 * Standard loan math used for amortizing schedules and average daily balance (ADB).
 * Aligns with typical cooperative annuity / declining-balance spreadsheet logic.
 */

export type AmortizationRow = {
  period: number
  payment: number
  interest: number
  principal: number
  balance: number
}

/** Level monthly payment for a fixed-rate amortizing loan. Rate is per period (e.g. monthly). */
export function levelPayment(
  principal: number,
  ratePerPeriod: number,
  numPeriods: number,
): number {
  const p = Math.max(0, principal)
  const n = Math.max(0, Math.floor(numPeriods))
  if (n <= 0) return 0
  const r = ratePerPeriod
  if (r <= 0) return p / n
  const factor = 1 - (1 + r) ** -n
  if (factor <= 0) return p / n
  return (p * r) / factor
}

/** Full amortization schedule; final payment clears any penny residual on the balance. */
export function amortizationSchedule(
  principal: number,
  ratePerPeriod: number,
  numPeriods: number,
): AmortizationRow[] {
  const p0 = Math.max(0, principal)
  const n = Math.max(0, Math.floor(numPeriods))
  if (n <= 0 || p0 === 0) return []

  const target = levelPayment(p0, ratePerPeriod, n)
  const rows: AmortizationRow[] = []
  let balance = p0
  const r = ratePerPeriod

  for (let k = 1; k <= n; k++) {
    const isLast = k === n
    const interest = r > 0 ? balance * r : 0
    let principalPart: number
    if (isLast) {
      principalPart = balance
    } else {
      principalPart = target - interest
    }
    const actualPay = principalPart + interest
    balance = Math.max(0, balance - principalPart)
    rows.push({
      period: k,
      payment: Math.round(actualPay * 100) / 100,
      interest: Math.round(interest * 100) / 100,
      principal: Math.round(principalPart * 100) / 100,
      balance: Math.round(balance * 100) / 100,
    })
  }

  return rows
}

/** Average daily balance over a list of end-of-day balances (same length as days in period). */
export function averageDailyBalance(dailyBalances: number[]): number {
  if (dailyBalances.length === 0) return 0
  const sum = dailyBalances.reduce((a, b) => a + b, 0)
  return sum / dailyBalances.length
}
