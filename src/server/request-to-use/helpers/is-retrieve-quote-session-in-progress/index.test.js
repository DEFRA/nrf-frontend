import { describe, expect, it } from 'vitest'
import { checkForValidRetrieveQuoteSession } from './index.js'
import { routePath as startPath } from '../../../manage/start-page/route-path.js'
import { routePath as whatWouldYouLikeToDoPath } from '../../../manage/what-would-you-like-to-do/route-path.js'
import { routePath as haveNrlReferencePath } from '../../have-nrl-reference/route-path.js'
import { routePath as enterNrlReferencePath } from '../../enter-nrl-reference/route-path.js'
import { routePath as enterEmailPath } from '../../enter-email/route-path.js'
import { routePath as noNrlReferencePath } from '../../no-nrl-reference/route-path.js'
import { routePath as emailConfirmationPath } from '../../email-confirmation/route-path.js'
import { routePath as quoteNotMatchedPath } from '../../quote-not-matched/route-path.js'
import { routePath as planningTypePath } from '../../../quote/planning-type/route-path.js'
import { createRetrieveQuoteRequest } from '../../../../test-utils/create-retrieve-quote-request.js'
import { createMockRedirectToolkit } from '../../../../test-utils/create-mock-redirect-toolkit.js'
import { fullQuote } from '../../../../test-utils/fixtures/quote.js'
import {
  quoteJourneySession,
  requestToUseJourneySession
} from '../../../../test-utils/fixtures/session.js'

const validReference = fullQuote.reference
const validEmail = fullQuote.email.address
const guardedPaths = [
  haveNrlReferencePath,
  enterNrlReferencePath,
  enterEmailPath
]

describe('checkForValidRetrieveQuoteSession', () => {
  it.each(guardedPaths)('continues on %s when the session is valid', (path) => {
    const h = createMockRedirectToolkit()

    const result = checkForValidRetrieveQuoteSession(
      createRetrieveQuoteRequest({
        path,
        session: {
          ...requestToUseJourneySession,
          retrieveQuote: { nrlReference: validReference }
        }
      }),
      h
    )

    expect(result).toBe(h.continue)
    expect(h.redirect).not.toHaveBeenCalled()
  })

  it.each(guardedPaths)(
    'redirects %s to the start page when there is no session',
    (path) => {
      const h = createMockRedirectToolkit()

      checkForValidRetrieveQuoteSession(
        createRetrieveQuoteRequest({ path, session: {} }),
        h
      )

      expect(h.redirect).toHaveBeenCalledWith(startPath)
    }
  )

  it.each([
    {
      scenario: 'the quote journey was chosen',
      session: { ...quoteJourneySession, retrieveQuote: {} }
    },
    {
      scenario: 'only an email has been saved, with no NRL reference',
      session: {
        manage: requestToUseJourneySession.manage,
        retrieveQuote: { email: validEmail }
      }
    },
    {
      scenario: 'the retrieve quote answers have been cleared',
      session: { manage: requestToUseJourneySession.manage }
    }
  ])('redirects to the start page when $scenario', ({ session }) => {
    const h = createMockRedirectToolkit()

    checkForValidRetrieveQuoteSession(
      createRetrieveQuoteRequest({ path: enterEmailPath, session }),
      h
    )

    expect(h.redirect).toHaveBeenCalledWith(startPath)
  })

  it.each([haveNrlReferencePath, enterNrlReferencePath])(
    'redirects %s to the start page when only an email remains after it was accepted',
    (path) => {
      const h = createMockRedirectToolkit()

      checkForValidRetrieveQuoteSession(
        createRetrieveQuoteRequest({
          path,
          session: {
            manage: requestToUseJourneySession.manage,
            retrieveQuote: { email: validEmail }
          }
        }),
        h
      )

      expect(h.redirect).toHaveBeenCalledWith(startPath)
    }
  )

  it.each([haveNrlReferencePath, enterNrlReferencePath])(
    'continues on %s after a dropout, when the email sits alongside other answers',
    (path) => {
      const h = createMockRedirectToolkit()

      const result = checkForValidRetrieveQuoteSession(
        createRetrieveQuoteRequest({
          path,
          session: {
            manage: requestToUseJourneySession.manage,
            retrieveQuote: {
              hasNrlReference: 'yes',
              nrlReference: validReference,
              email: validEmail
            }
          }
        }),
        h
      )

      expect(result).toBe(h.continue)
    }
  )

  it.each([
    whatWouldYouLikeToDoPath,
    noNrlReferencePath,
    emailConfirmationPath,
    quoteNotMatchedPath,
    planningTypePath
  ])('does not guard %s', (path) => {
    const h = createMockRedirectToolkit()

    const result = checkForValidRetrieveQuoteSession(
      createRetrieveQuoteRequest({ path, session: {} }),
      h
    )

    expect(result).toBe(h.continue)
  })

  it('does not guard non-GET requests', () => {
    const h = createMockRedirectToolkit()

    const result = checkForValidRetrieveQuoteSession(
      createRetrieveQuoteRequest({
        path: enterEmailPath,
        method: 'post',
        session: {}
      }),
      h
    )

    expect(result).toBe(h.continue)
  })

  describe('prefilled reference', () => {
    it('starts the request to use journey and continues for a valid reference', () => {
      const h = createMockRedirectToolkit()
      const request = createRetrieveQuoteRequest({
        path: enterNrlReferencePath,
        query: { nrlReference: validReference },
        session: {}
      })

      const result = checkForValidRetrieveQuoteSession(request, h)

      expect(result).toBe(h.continue)
      expect(request.yar.get('manage')).toEqual({
        whatWouldYouLikeToDo: 'request-to-use'
      })
      expect(request.yar.get('retrieveQuote')).toEqual({})
    })

    it('clears the quote and keeps saved retrieve quote answers', () => {
      const saved = { hasNrlReference: 'yes' }
      const request = createRetrieveQuoteRequest({
        path: enterNrlReferencePath,
        query: { nrlReference: validReference },
        session: { quote: { planningType: 'other' }, retrieveQuote: saved }
      })

      checkForValidRetrieveQuoteSession(request, createMockRedirectToolkit())

      expect(request.yar.get('quote')).toBeNull()
      expect(request.yar.get('retrieveQuote')).toEqual(saved)
    })

    it.each([
      { scenario: 'is invalid', query: { nrlReference: 'not-a-reference' } },
      { scenario: 'is missing', query: {} },
      { scenario: 'is empty', query: { nrlReference: '' } }
    ])(
      'redirects to the start page when the reference $scenario',
      ({ query }) => {
        const h = createMockRedirectToolkit()
        const request = createRetrieveQuoteRequest({
          path: enterNrlReferencePath,
          query,
          session: {}
        })

        checkForValidRetrieveQuoteSession(request, h)

        expect(h.redirect).toHaveBeenCalledWith(startPath)
        expect(request.yar.get('manage')).toBeNull()
      }
    )

    it('ignores the reference on other guarded pages', () => {
      const h = createMockRedirectToolkit()
      const request = createRetrieveQuoteRequest({
        path: enterEmailPath,
        query: { nrlReference: validReference },
        session: {}
      })

      checkForValidRetrieveQuoteSession(request, h)

      expect(h.redirect).toHaveBeenCalledWith(startPath)
    })
  })
})
