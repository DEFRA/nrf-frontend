import { describe, expect, it } from 'vitest'
import { checkForValidRetrieveQuoteSession } from './index.js'
import { routePath as startPath } from '../../../manage/start-page/route-path.js'
import { routePath as whatWouldYouLikeToDoPath } from '../../../manage/what-would-you-like-to-do/route-path.js'
import { routePath as haveNrlReferencePath } from '../../have-nrl-reference/route-path.js'
import { routePath as enterNrlReferencePath } from '../../enter-nrl-reference/route-path.js'
import { routePath as enterEmailPath } from '../../enter-email/route-path.js'
import { routePath as noNrlReferencePath } from '../../no-nrl-reference/route-path.js'
import { createSessionRequest } from '../../../../test-utils/create-session-request.js'
import { createMockRedirectToolkit } from '../../../../test-utils/create-mock-redirect-toolkit.js'
import { requestToUseJourneySession } from '../../../../test-utils/fixtures/session.js'

const validReference = 'NRL-123456'
const guardedPaths = [
  haveNrlReferencePath,
  enterNrlReferencePath,
  enterEmailPath
]

const makeRequest = ({
  path,
  method = 'get',
  query = {},
  session = requestToUseJourneySession
}) => createSessionRequest({ session, path, method, query })

const makeH = createMockRedirectToolkit

describe('checkForValidRetrieveQuoteSession', () => {
  it.each(guardedPaths)('continues on %s when the session is valid', (path) => {
    const h = makeH()

    const result = checkForValidRetrieveQuoteSession(makeRequest({ path }), h)

    expect(result).toBe(h.continue)
    expect(h.redirect).not.toHaveBeenCalled()
  })

  it.each(guardedPaths)(
    'redirects %s to the start page when there is no session',
    (path) => {
      const h = makeH()

      checkForValidRetrieveQuoteSession(makeRequest({ path, session: {} }), h)

      expect(h.redirect).toHaveBeenCalledWith(startPath)
    }
  )

  it.each([
    {
      scenario: 'the quote journey was chosen',
      session: {
        manage: { whatWouldYouLikeToDo: 'quote' },
        retrieveQuote: {}
      }
    },
    {
      scenario: 'the retrieve quote answers have been cleared',
      session: { manage: requestToUseJourneySession.manage }
    }
  ])('redirects to the start page when $scenario', ({ session }) => {
    const h = makeH()

    checkForValidRetrieveQuoteSession(
      makeRequest({ path: enterEmailPath, session }),
      h
    )

    expect(h.redirect).toHaveBeenCalledWith(startPath)
  })

  it.each([whatWouldYouLikeToDoPath, noNrlReferencePath, '/quote/unit-number'])(
    'does not guard %s',
    (path) => {
      const h = makeH()

      const result = checkForValidRetrieveQuoteSession(
        makeRequest({ path, session: {} }),
        h
      )

      expect(result).toBe(h.continue)
    }
  )

  it('does not guard non-GET requests', () => {
    const h = makeH()

    const result = checkForValidRetrieveQuoteSession(
      makeRequest({ path: enterEmailPath, method: 'post', session: {} }),
      h
    )

    expect(result).toBe(h.continue)
  })

  describe('prefilled reference', () => {
    const prefillRequest = (query, session = {}) =>
      makeRequest({ path: enterNrlReferencePath, query, session })

    it('starts the request to use journey and continues for a valid reference', () => {
      const h = makeH()
      const request = prefillRequest({ nrlReference: validReference })

      const result = checkForValidRetrieveQuoteSession(request, h)

      expect(result).toBe(h.continue)
      expect(request.yar.get('manage')).toEqual({
        whatWouldYouLikeToDo: 'request-to-use'
      })
      expect(request.yar.get('retrieveQuote')).toEqual({})
    })

    it('clears the quote and keeps saved retrieve quote answers', () => {
      const saved = { hasNrlReference: 'yes' }
      const request = prefillRequest(
        { nrlReference: validReference },
        { quote: { planningType: 'other' }, retrieveQuote: saved }
      )

      checkForValidRetrieveQuoteSession(request, makeH())

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
        const h = makeH()
        const request = prefillRequest(query)

        checkForValidRetrieveQuoteSession(request, h)

        expect(h.redirect).toHaveBeenCalledWith(startPath)
        expect(request.yar.get('manage')).toBeNull()
      }
    )

    it('ignores the reference on other guarded pages', () => {
      const h = makeH()
      const request = makeRequest({
        path: enterEmailPath,
        query: { nrlReference: validReference },
        session: {}
      })

      checkForValidRetrieveQuoteSession(request, h)

      expect(h.redirect).toHaveBeenCalledWith(startPath)
    })
  })
})
