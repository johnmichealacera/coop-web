/**
 * MIGS member rating: seven components, max 100 points.
 * Rating is MIGS when total >= 75, otherwise NON-MIGS.
 */

export type MigsInputs = {
  salesInvoice: number
  anyAmountLastYear: number
  cacProducts: number
  loanRelease: number
  loanPayments: number
  capitalBuildup: number
  basicShares: number
  delinquencyDays: number
  chargeOff: number
  kaagapay1: number
  kaagapay2: number
  savings: number
  timeDeposits: number
  attendance: number
}

export type MigsBreakdown = {
  patronize: number
  capitalBuildup: number
  basicShares: number
  delinquency: number
  kaagapay: number
  savings: number
  attendance: number
  total: number
  rating: 'MIGS' | 'NON-MIGS'
}

export function computeMigsScore(i: MigsInputs): MigsBreakdown {
  const patronize =
    i.salesInvoice + i.anyAmountLastYear > 0
      ? 15
      : i.cacProducts > 0
        ? 15
        : i.loanRelease + i.loanPayments > 0
          ? 15
          : 0

  const capitalBuildupPts = i.capitalBuildup >= 1500 ? 10 : 0
  const basicSharesPts = i.basicShares >= 40000 ? 5 : 0

  let delinquency = 0
  if (i.chargeOff > 0) {
    delinquency = 0
  } else {
    const d = i.delinquencyDays
    if (d >= 181) delinquency = 0
    else if (d >= 91 && d <= 180.99) delinquency = 5
    else if (d >= 61 && d <= 90.99) delinquency = 10
    else if (d >= 31 && d <= 60.99) delinquency = 20
    else if (d >= 1 && d <= 30.99) delinquency = 30
    else if (d === 0) delinquency = 40
  }

  const kaagapay = i.kaagapay1 >= 1000 || i.kaagapay2 > 0 ? 10 : 0
  const savingsPts =
    (i.savings >= 1000 ? 5 : 0) + (i.timeDeposits > 0 ? 5 : 0)
  const attendancePts =
    i.attendance >= 2 ? 10 : i.attendance === 1 ? 5 : 0

  const total =
    patronize +
    capitalBuildupPts +
    basicSharesPts +
    delinquency +
    kaagapay +
    savingsPts +
    attendancePts

  const rating: 'MIGS' | 'NON-MIGS' = total >= 75 ? 'MIGS' : 'NON-MIGS'

  return {
    patronize,
    capitalBuildup: capitalBuildupPts,
    basicShares: basicSharesPts,
    delinquency,
    kaagapay,
    savings: savingsPts,
    attendance: attendancePts,
    total,
    rating,
  }
}
