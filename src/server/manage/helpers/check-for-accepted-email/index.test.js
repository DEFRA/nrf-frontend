import { describe, expect, it } from 'vitest'
import { checkForAcceptedEmail } from './index.js'
import { routePath as startPath } from '../../start-page/route-path.js'
import { routePath as whatWouldYouLikeToDoPath } from '../../what-would-you-like-to-do/route-path.js'
import { createRetrieveQuoteRequest } from '../../../../test-utils/create-retrieve-quote-request.js'
import { createMockRedirectToolkit } from '../../../../test-utils/create-mock-redirect-toolkit.js'
import { fullQuote } from '../../../../test-utils/fixtures/quote.js'
import {
  quoteJourneySession,
  requestToUseJourneySession
} from '../../../../test-utils/fixtures/session.js'

const emailAcceptedSession = {
  manage: requestToUseJourneySession.manage,
  retrieveQuote: { email: fullQuote.email.address }
}

describe('checkForAcceptedEmail', () => {
  it('redirects the what would you like to do page to the start page once the email was accepted', () => {
    const h = createMockRedirectToolkit()

    checkForAcceptedEmail(
      createRetrieveQuoteRequest({
        path: whatWouldYouLikeToDoPath,
        session: emailAcceptedSession
      }),
      h
    )

    expect(h.redirect).toHaveBeenCalledWith(startPath)
  })

  it.each([
    { scenario: 'there is no session', session: {} },
    {
      scenario: 'retrieve quote answers exist without an accepted email',
      session: {
        manage: requestToUseJourneySession.manage,
        retrieveQuote: { hasNrlReference: 'yes' }
      }
    },
    {
      scenario: 'the email sits alongside other answers after a dropout',
      session: {
        manage: requestToUseJourneySession.manage,
        retrieveQuote: {
          hasNrlReference: 'yes',
          nrlReference: fullQuote.reference,
          email: fullQuote.email.address
        }
      }
    },
    { scenario: 'the quote journey was chosen', session: quoteJourneySession }
  ])('continues when $scenario', ({ session }) => {
    const h = createMockRedirectToolkit()

    const result = checkForAcceptedEmail(
      createRetrieveQuoteRequest({ path: whatWouldYouLikeToDoPath, session }),
      h
    )

    expect(result).toBe(h.continue)
  })

  it.each([
    { scenario: 'other pages', path: startPath, method: 'get' },
    {
      scenario: 'non-GET requests',
      path: whatWouldYouLikeToDoPath,
      method: 'post'
    }
  ])('ignores $scenario', ({ path, method }) => {
    const h = createMockRedirectToolkit()

    const result = checkForAcceptedEmail(
      createRetrieveQuoteRequest({
        path,
        method,
        session: emailAcceptedSession
      }),
      h
    )

    expect(result).toBe(h.continue)
  })
})
