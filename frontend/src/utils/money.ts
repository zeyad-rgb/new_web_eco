const money = new Intl.NumberFormat('ar-EG', {
  style: 'currency',
  currency: 'EGP',
  maximumFractionDigits: 0,
})

export function formatMoney(amountInPiastres: number): string {
  return money.format(amountInPiastres / 100)
}
