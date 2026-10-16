import { describe, it, expect } from 'vitest'
import getNextPage from './get-next-page.js'
import { routePath as emailConfirmationPath } from '../email-confirmation/route-path.js'
import { routePath as quoteNotMatchedPath } from '../quote-not-matched/route-path.js'

describe('enter-email getNextPage', () => {
  it('goes to the email confirmation page when a quote matched', () => {
    expect(getNextPage(true)).toBe(emailConfirmationPath)
  })

  it('goes to the quote not matched page when no quote matched', () => {
    expect(getNextPage(false)).toBe(quoteNotMatchedPath)
  })
})
