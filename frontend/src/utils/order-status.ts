/** Order status helpers shared by the admin dashboard and the orders section. */

/** Transitions the backend allows (mirrors App\Services\OrderLifecycle). */
const NEXT_STATUSES: Record<string, string[]> = {
  processing: ['shipped', 'cancelled'],
  shipped: ['delivered', 'returned'],
  delivered: ['returned'],
  cancelled: [],
  returned: [],
}

const LABELS: Record<string, string> = {
  processing: 'قيد التجهيز',
  shipped: 'تم الشحن',
  delivered: 'تم التوصيل',
  returned: 'مرتجع',
  cancelled: 'ملغي',
}

/** The current status plus the statuses it may move to. */
export const statusOptions = (status: string): string[] => [status, ...(NEXT_STATUSES[status] ?? [])]

export const statusLabel = (status: string): string => LABELS[status] ?? status

export const statusBadgeClass = (status: string): string =>
  ['processing', 'shipped', 'delivered', 'cancelled'].includes(status) ? `status-${status}` : ''

/** Cancelling or returning puts stock back, so staff confirm it first. */
export const restocksInventory = (status: string): boolean => status === 'cancelled' || status === 'returned'
