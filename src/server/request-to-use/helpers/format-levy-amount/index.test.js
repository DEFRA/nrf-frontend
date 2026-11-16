import { describe, expect, it } from 'vitest'
import { formatLevyAmount } from './index.js'

describe('formatLevyAmount', () => {
  it('shows whole pound amounts without pence', () => {
    expect(formatLevyAmount(26750)).toBe('£26,750')
  })

  it('shows fractional amounts with pence', () => {
    expect(formatLevyAmount(27123.5)).toBe('£27,123.50')
  })
})
