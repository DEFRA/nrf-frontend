import { describe, it, expect } from 'vitest'
import { quoteMatchesEmail } from './index.js'
import { setupMswServer } from '../../../../test-utils/setup-msw-server.js'
import {
  mockReadQuote,
  mockGetQuoteError
} from '../../../../test-utils/mock-get-quote.js'
import { statusCodes } from '../../../common/constants/status-codes.js'
import { fullQuote } from '../../../../test-utils/fixtures/quote.js'

const nrlReference = fullQuote.reference
const email = fullQuote.email.address

describe('quoteMatchesEmail', () => {
  const server = setupMswServer()

  it('matches the email the quote was made with', async () => {
    mockReadQuote(server)
    expect(await quoteMatchesEmail({ nrlReference, email })).toBe(true)
  })

  it('ignores case and surrounding whitespace', async () => {
    mockReadQuote(server)
    expect(
      await quoteMatchesEmail({
        nrlReference,
        email: `  ${email.toUpperCase()} `
      })
    ).toBe(true)
  })

  it('does not match a different email', async () => {
    mockReadQuote(server)
    expect(
      await quoteMatchesEmail({ nrlReference, email: 'other@example.com' })
    ).toBe(false)
  })

  it('does not match when the quote has no email', async () => {
    mockReadQuote(server, { ...fullQuote, email: undefined })
    expect(await quoteMatchesEmail({ nrlReference, email })).toBe(false)
  })

  it('does not match when no quote exists for the reference', async () => {
    mockGetQuoteError(server, nrlReference, statusCodes.notFound)
    expect(await quoteMatchesEmail({ nrlReference, email })).toBe(false)
  })

  it('rethrows other backend errors', async () => {
    mockGetQuoteError(server, nrlReference, statusCodes.internalServerError)
    await expect(quoteMatchesEmail({ nrlReference, email })).rejects.toThrow()
  })
})
