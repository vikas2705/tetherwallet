import Decimal from 'decimal.js'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'

dayjs.extend(relativeTime)

/**
 * Format a bigint balance from base units to human-readable decimal string
 */
export function formatBalance(
  rawBalance: bigint | string | number,
  decimals: number,
  maxDecimalPlaces = 6,
): string {
  try {
    const d = new Decimal(rawBalance.toString())
    const divisor = new Decimal(10).pow(decimals)
    const result = d.div(divisor)

    if (result.isZero()) return '0'

    // Trim trailing zeros but keep meaningful decimals
    const formatted = result.toDecimalPlaces(maxDecimalPlaces).toFixed()
    return formatted.replace(/\.?0+$/, '') || '0'
  } catch {
    return '0'
  }
}

/**
 * Format balance with symbol
 */
export function formatBalanceWithSymbol(
  rawBalance: bigint | string | number,
  decimals: number,
  symbol: string,
): string {
  return `${formatBalance(rawBalance, decimals)} ${symbol}`
}

/**
 * Format a USD value
 */
export function formatUSD(value: number): string {
  if (value === 0) return '$0.00'
  if (value < 0.01) return '<$0.01'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

/**
 * Shorten an address for display
 */
export function shortenAddress(address: string | undefined | null, chars = 6): string {
  const s = typeof address === 'string' ? address : ''
  if (!s || s.length < chars * 2 + 2) return s
  return `${s?.slice(0, chars)}...${s?.slice(-chars)}`
}

/**
 * Format a transaction date
 */
export function formatTxDate(timestamp: number): string {
  return dayjs.unix(timestamp).fromNow()
}

/**
 * Format a full date
 */
export function formatDate(timestamp: number): string {
  return dayjs.unix(timestamp).format('MMM D, YYYY HH:mm')
}

/**
 * Parse user input amount to bigint base units
 */
export function parseAmount(amount: string, decimals: number): bigint {
  try {
    if (!amount || amount === '.' || amount === '0.') return 0n
    const d = new Decimal(amount)
    const multiplier = new Decimal(10).pow(decimals)
    return BigInt(d.mul(multiplier).toFixed(0))
  } catch {
    return 0n
  }
}

/**
 * Validate if a string is a valid number
 */
export function isValidAmount(amount: string): boolean {
  if (!amount) return false
  const num = parseFloat(amount)
  return !isNaN(num) && num > 0 && isFinite(num)
}

/**
 * Format fee in human readable form
 */
export function formatFee(feeWei: bigint, decimals: number, symbol: string): string {
  const formatted = formatBalance(feeWei, decimals, 8)
  return `${formatted} ${symbol}`
}

/**
 * Truncate a tx hash for display
 */
export function shortenTxHash(hash: string | undefined | null, chars = 8): string {
  const s = typeof hash === 'string' ? hash : ''
  if (!s || s.length < chars * 2 + 2) return s
  return `${s?.slice(0, chars)}...${s?.slice(-chars)}`
}
