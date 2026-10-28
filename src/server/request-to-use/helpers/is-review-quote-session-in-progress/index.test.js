import { describe, expect, it } from 'vitest'
import { checkForValidReviewQuoteSession } from './index.js'
import { routePath as startPath } from '../../../manage/start-page/route-path.js'
import { routePath as reviewQuoteDetailsPath } from '../../review-quote-details/route-path.js'
import { routePath as acceptLevyPath } from '../../accept-levy/route-path.js'
import { routePath as defraAccountUserTypePath } from '../../defra-account-user-type/route-path.js'
import { routePath as changePlanningTypePath } from '../../change/planning-type/route-path.js'
import { routePath as changeConfirmHousingPath } from '../../change/confirm-housing/route-path.js'
import { routePath as changeUnitNumberPath } from '../../change/unit-number/route-path.js'
import { routePath as changeApplicationTypeNotAvailablePath } from '../../change/application-type-not-available/route-path.js'
import { routePath as changeNotHousingPath } from '../../change/not-housing/route-path.js'
import { routePath as changeBoundaryTypeAliasPath } from '../../change/boundary-type/route-path.js'
import { routePath as changeUploadBoundaryPath } from '../../change/upload-boundary/route-path.js'
import { routePath as enterEmailPath } from '../../enter-email/route-path.js'
import { routePath as planningTypePath } from '../../../quote/planning-type/route-path.js'
import { createReviewQuoteRequest } from '../../../../test-utils/create-review-quote-request.js'
import { createMockRedirectToolkit } from '../../../../test-utils/create-mock-redirect-toolkit.js'
import {
  acceptLevySession,
  reviewQuoteSession
} from '../../../../test-utils/fixtures/session.js'

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
    changeUnitNumberPath,
    changeApplicationTypeNotAvailablePath,
    changeNotHousingPath
  ])('continues on %s when the session is valid', (path) => {
    const h = createMockRedirectToolkit()

    const result = checkForValidReviewQuoteSession(
      createReviewQuoteRequest({ path }),
      h
    )

    expect(result).toBe(h.continue)
    expect(h.redirect).not.toHaveBeenCalled()
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

  // Mid-edit state: choosing a different boundary entry type clears the saved
  // boundary until a new one is drawn or uploaded, so the change pages — and
  // the dropout pages an ineligible change redirects to from them — must not
  // require a complete quote; the user needs them to finish the swap.
  it.each([
    {
      scenario: 'the upload page, reached by switching from a drawn boundary',
      path: changeUploadBoundaryPath
    },
    {
      scenario: 'the boundary type page, reached with the browser back button',
      path: changeBoundaryTypeAliasPath
    },
    {
      scenario:
        'the not housing dropout page, reached by an ineligible housing change',
      path: changeNotHousingPath
    },
    {
      scenario:
        'the application type not available dropout page, reached by an ineligible planning type change',
      path: changeApplicationTypeNotAvailablePath
    }
  ])('continues on $scenario while the boundary is cleared', ({ path }) => {
    const h = createMockRedirectToolkit()

    const result = checkForValidReviewQuoteSession(
      createReviewQuoteRequest({
        path,
        session: {
          quote: { ...reviewQuoteSession.quote, boundaryGeojson: null },
          requestToUse: reviewQuoteSession.requestToUse
        }
      }),
      h
    )

    expect(result).toBe(h.continue)
    expect(h.redirect).not.toHaveBeenCalled()
  })

  it('continues on the accept levy page when the session is valid', () => {
    const h = createMockRedirectToolkit()

    const result = checkForValidReviewQuoteSession(
      createReviewQuoteRequest({
        path: acceptLevyPath,
        session: acceptLevySession
      }),
      h
    )

    expect(result).toBe(h.continue)
    expect(h.redirect).not.toHaveBeenCalled()
  })

  it('continues on the who are you requesting to use the levy for page when the session is valid', () => {
    const h = createMockRedirectToolkit()

    const result = checkForValidReviewQuoteSession(
      createReviewQuoteRequest({ path: defraAccountUserTypePath }),
      h
    )

    expect(result).toBe(h.continue)
  })

  it('redirects the who are you requesting to use the levy for page to the start page when there is no session', () => {
    const h = createMockRedirectToolkit()

    checkForValidReviewQuoteSession(
      createReviewQuoteRequest({ path: defraAccountUserTypePath, session: {} }),
      h
    )

    expect(h.redirect).toHaveBeenCalledWith(startPath)
  })

  it('redirects the review page to the start page when the boundary is cleared mid-edit', () => {
    const h = createMockRedirectToolkit()

    checkForValidReviewQuoteSession(
      createReviewQuoteRequest({
        path: reviewQuoteDetailsPath,
        session: {
          quote: { ...reviewQuoteSession.quote, boundaryGeojson: null },
          requestToUse: reviewQuoteSession.requestToUse
        }
      }),
      h
    )

    expect(h.redirect).toHaveBeenCalledWith(startPath)
  })

  it.each([
    { scenario: 'there is no session', session: {} },
    {
      scenario: 'the quote session is missing',
      session: { requestToUse: acceptLevySession.requestToUse }
    }
  ])(
    'redirects the accept levy page to the start page when $scenario',
    ({ session }) => {
      const h = createMockRedirectToolkit()

      checkForValidReviewQuoteSession(
        createReviewQuoteRequest({ path: acceptLevyPath, session }),
        h
      )

      expect(h.redirect).toHaveBeenCalledWith(startPath)
    }
  )

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
