import { describe, it, expect } from 'vitest'
import getNextPage from './get-next-page.js'

describe('enter-email getNextPage', () => {
  it('goes to the email confirmation page when a quote matched', () => {
    expect(getNextPage(true)).toBe('/request-to-use/email-confirmation')
  })

  it('goes to the quote not matched page when no quote matched', () => {
    expect(getNextPage(false)).toBe('/request-to-use/quote-not-matched')
  })
})
