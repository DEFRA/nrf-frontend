import { describe, expect, it } from 'vitest'
import { checkForValidReviewQuoteSession } from './index.js'
import { routePath as startPath } from '../../../manage/start-page/route-path.js'
import { routePath as reviewQuoteDetailsPath } from '../../review-quote-details/route-path.js'
import { routePath as changePlanningTypePath } from '../../change/planning-type/route-path.js'
import { routePath as changeConfirmHousingPath } from '../../change/confirm-housing/route-path.js'
import { routePath as changeUnitNumberPath } from '../../change/unit-number/route-path.js'
import { routePath as changeApplicationTypeNotAvailablePath } from '../../change/application-type-not-available/route-path.js'
import { routePath as changeNotHousingPath } from '../../change/not-housing/route-path.js'
import { routePath as enterEmailPath } from '../../enter-email/route-path.js'
import { routePath as planningTypePath } from '../../../quote/planning-type/route-path.js'
import { createReviewQuoteRequest } from '../../../../test-utils/create-review-quote-request.js'
import { createMockRedirectToolkit } from '../../../../test-utils/create-mock-redirect-toolkit.js'
import { reviewQuoteSession } from '../../../../test-utils/fixtures/session.js'

describe('checkForValidReviewQuoteSession', () => {
  it('continues on the review quote details page when the session is valid', () => {
    const h = createMockRedirectToolkit()

    const result = checkForValidReviewQuoteSession(
      createReviewQuoteRequest({ path: reviewQuoteDetailsPath }),
      h
    )

    expect(result).toBe(h.continue)
    expect(h.redirect).not.toHaveBeenCalled()
  })

  it.each([
    {
      scenario: 'the quote session is missing',
      session: { requestToUse: reviewQuoteSession.requestToUse }
    },
    {
      scenario: 'the quote session is initialised but empty',
      session: { quote: {}, requestToUse: reviewQuoteSession.requestToUse }
    },
    {
      scenario: 'the request to use session is missing',
      session: { quote: reviewQuoteSession.quote }
    },
    { scenario: 'neither session exists', session: {} }
  ])('redirects to the start page when $scenario', ({ session }) => {
    const h = createMockRedirectToolkit()

    checkForValidReviewQuoteSession(
      createReviewQuoteRequest({ path: reviewQuoteDetailsPath, session }),
      h
    )

    expect(h.redirect).toHaveBeenCalledWith(startPath)
  })

  it.each([enterEmailPath, planningTypePath, startPath])(
    'does not guard %s',
    (path) => {
      const h = createMockRedirectToolkit()

      const result = checkForValidReviewQuoteSession(
        createReviewQuoteRequest({ path, session: {} }),
        h
      )

      expect(result).toBe(h.continue)
    }
  )

  it.each([
    changePlanningTypePath,
    changeConfirmHousingPath,
    changeUnitNumberPath
  ])('continues on %s when the session is valid', (path) => {
    const h = createMockRedirectToolkit()

    const result = checkForValidReviewQuoteSession(
      createReviewQuoteRequest({ path }),
      h
    )

    expect(result).toBe(h.continue)
    expect(h.redirect).not.toHaveBeenCalled()
  })

  describe('dropout change pages', () => {
    it('continues on a dropout page when the change POST just granted it and consumes the grant', () => {
      const h = createMockRedirectToolkit()
      const request = createReviewQuoteRequest({
        path: changeNotHousingPath,
        session: {
          ...reviewQuoteSession,
          dropoutJustReached: changeNotHousingPath
        }
      })

      const result = checkForValidReviewQuoteSession(request, h)

      expect(result).toBe(h.continue)
      expect(request.yar.get('dropoutJustReached')).toBe(null)
    })

    it('redirects a dropout page to the review page when no change just granted it', () => {
      const h = createMockRedirectToolkit()

      checkForValidReviewQuoteSession(
        createReviewQuoteRequest({ path: changeNotHousingPath }),
        h
      )

      expect(h.redirect).toHaveBeenCalledWith(reviewQuoteDetailsPath)
    })

    it('redirects a dropout page to the review page when the grant is for the other dropout page', () => {
      const h = createMockRedirectToolkit()

      checkForValidReviewQuoteSession(
        createReviewQuoteRequest({
          path: changeNotHousingPath,
          session: {
            ...reviewQuoteSession,
            dropoutJustReached: changeApplicationTypeNotAvailablePath
          }
        }),
        h
      )

      expect(h.redirect).toHaveBeenCalledWith(reviewQuoteDetailsPath)
    })

    it('serves HEAD from the grant without consuming it', () => {
      const h = createMockRedirectToolkit()
      const request = createReviewQuoteRequest({
        path: changeApplicationTypeNotAvailablePath,
        method: 'head',
        session: {
          ...reviewQuoteSession,
          dropoutJustReached: changeApplicationTypeNotAvailablePath
        }
      })

      const result = checkForValidReviewQuoteSession(request, h)

      expect(result).toBe(h.continue)
      expect(request.yar.get('dropoutJustReached')).toBe(
        changeApplicationTypeNotAvailablePath
      )
    })
  })

  it.each([
    changePlanningTypePath,
    changeConfirmHousingPath,
    changeUnitNumberPath,
    changeApplicationTypeNotAvailablePath,
    changeNotHousingPath
  ])('redirects %s to the start page when the session is missing', (path) => {
    const h = createMockRedirectToolkit()

    checkForValidReviewQuoteSession(
      createReviewQuoteRequest({ path, session: {} }),
      h
    )

    expect(h.redirect).toHaveBeenCalledWith(startPath)
  })

  it('redirects HEAD requests to the start page when there is no session', () => {
    const h = createMockRedirectToolkit()

    checkForValidReviewQuoteSession(
      createReviewQuoteRequest({
        path: reviewQuoteDetailsPath,
        method: 'head',
        session: {}
      }),
      h
    )

    expect(h.redirect).toHaveBeenCalledWith(startPath)
  })

  it('does not guard non-GET requests', () => {
    const h = createMockRedirectToolkit()

    const result = checkForValidReviewQuoteSession(
      createReviewQuoteRequest({
        path: reviewQuoteDetailsPath,
        method: 'post',
        session: {}
      }),
      h
    )

    expect(result).toBe(h.continue)
  })
})
