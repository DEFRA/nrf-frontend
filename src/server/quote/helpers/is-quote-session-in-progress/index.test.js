import { describe, expect, it, vi } from 'vitest'
import { checkForValidQuoteSession } from './index.js'
import { routePath as applicationTypeNotAvailablePath } from '../../application-type-not-available/route-path.js'
import { routePath as planningTypePath } from '../../planning-type/route-path.js'
import { routePath as confirmationPath } from '../../confirmation/routes.js'
import { routePath as startPath } from '../../../manage/start-page/routes.js'
import { getQuoteDataFromCache } from '../quote-session-cache/index.js'
import { routePath as deleteConfirmationPath } from '../../delete-quote-confirmation/routes.js'
import { routePath as confirmHousingPath } from '../../confirm-housing/route-path.js'
import { routePath as notHousingPath } from '../../not-housing/route-path.js'
import { routePath as notInEdpPath } from '../../not-in-edp/route-path.js'
import { routePath as excludedAreaPath } from '../../excluded-area/route-path.js'
import { createMockYar } from '../../../../test-utils/create-mock-yar.js'
import {
  quoteJourneySession,
  requestToUseJourneySession,
  reviewQuoteSession
} from '../../../../test-utils/fixtures/session.js'

vi.mock('../quote-session-cache/index.js')

const makeRequest = ({
  path,
  method = 'get',
  query = {},
  session = quoteJourneySession
} = {}) => ({
  path,
  method,
  query,
  yar: createMockYar(session)
})

const makeH = () => {
  const h = {
    continue: Symbol('continue'),
    redirect: vi.fn()
  }
  h.redirect.mockReturnValue({ takeover: () => Symbol('takeover') })
  return h
}

describe('checkForValidQuoteSession', () => {
  it('continues when a quote session exists', () => {
    vi.mocked(getQuoteDataFromCache).mockReturnValue({
      planningType: 'full-planning-permission'
    })
    const request = makeRequest({ path: '/quote/unit-number' })
    const h = makeH()

    const result = checkForValidQuoteSession(request, h)

    expect(result).toBe(h.continue)
    expect(h.redirect).not.toHaveBeenCalled()
  })

  it('continues when session is initialised but empty', () => {
    vi.mocked(getQuoteDataFromCache).mockReturnValue({})
    const request = makeRequest({ path: '/quote/planning-type' })
    const h = makeH()

    const result = checkForValidQuoteSession(request, h)

    expect(result).toBe(h.continue)
    expect(h.redirect).not.toHaveBeenCalled()
  })

  it('redirects to start when no quote session exists', () => {
    vi.mocked(getQuoteDataFromCache).mockReturnValue(null)
    const request = makeRequest({ path: '/quote/planning-type' })
    const h = makeH()

    checkForValidQuoteSession(request, h)

    expect(h.redirect).toHaveBeenCalledWith(startPath)
  })

  it.each([
    { scenario: 'nothing has been chosen', session: {} },
    {
      scenario: 'request to use was chosen',
      session: { manage: requestToUseJourneySession.manage }
    }
  ])(
    'redirects to start when the quote journey is not selected because $scenario',
    ({ session }) => {
      vi.mocked(getQuoteDataFromCache).mockReturnValue({})
      const request = makeRequest({ path: planningTypePath, session })
      const h = makeH()

      checkForValidQuoteSession(request, h)

      expect(h.redirect).toHaveBeenCalledWith(startPath)
    }
  )

  // A user editing their saved quote from the review and amend page chose the
  // request to use journey, but their ineligible answers redirect to the quote
  // journey's dropout pages — those must render, not bounce to the start page.
  it.each([
    notInEdpPath,
    excludedAreaPath,
    notHousingPath,
    applicationTypeNotAvailablePath
  ])(
    'continues on %s when the user is editing a saved quote from the review page',
    (path) => {
      vi.mocked(getQuoteDataFromCache).mockReturnValue({
        planningType: 'full-planning-permission',
        isHousing: 'yes'
      })
      const request = makeRequest({
        path,
        session: {
          manage: requestToUseJourneySession.manage,
          ...reviewQuoteSession
        }
      })
      const h = makeH()

      const result = checkForValidQuoteSession(request, h)

      expect(result).toBe(h.continue)
      expect(h.redirect).not.toHaveBeenCalled()
    }
  )

  it('redirects a dropout page to start when the request to use session is missing', () => {
    vi.mocked(getQuoteDataFromCache).mockReturnValue({})
    const request = makeRequest({
      path: notInEdpPath,
      session: { manage: requestToUseJourneySession.manage }
    })
    const h = makeH()

    checkForValidQuoteSession(request, h)

    expect(h.redirect).toHaveBeenCalledWith(startPath)
  })

  it('redirects a quote journey page other than a dropout to start when the user is editing a saved quote', () => {
    vi.mocked(getQuoteDataFromCache).mockReturnValue({})
    const request = makeRequest({
      path: '/quote/check-your-answers',
      session: {
        manage: requestToUseJourneySession.manage,
        ...reviewQuoteSession
      }
    })
    const h = makeH()

    checkForValidQuoteSession(request, h)

    expect(h.redirect).toHaveBeenCalledWith(startPath)
  })

  it('continues without session check for non-quote paths', () => {
    const request = makeRequest({ path: '/about' })
    const h = makeH()

    const result = checkForValidQuoteSession(request, h)

    expect(result).toBe(h.continue)
    expect(getQuoteDataFromCache).not.toHaveBeenCalled()
  })

  it('redirects to application-type-not-available when planningType is "other"', () => {
    vi.mocked(getQuoteDataFromCache).mockReturnValue({ planningType: 'other' })
    const request = makeRequest({ path: '/quote/boundary-type' })
    const h = makeH()

    checkForValidQuoteSession(request, h)

    expect(h.redirect).toHaveBeenCalledWith(applicationTypeNotAvailablePath)
  })

  it('carries change=true to application-type-not-available when the intercepted request had it', () => {
    vi.mocked(getQuoteDataFromCache).mockReturnValue({ planningType: 'other' })
    const request = makeRequest({
      path: '/quote/check-your-answers',
      query: { change: 'true' }
    })
    const h = makeH()

    checkForValidQuoteSession(request, h)

    expect(h.redirect).toHaveBeenCalledWith(
      `${applicationTypeNotAvailablePath}?change=true`
    )
  })

  it('continues on planning-type when planningType is "other"', () => {
    vi.mocked(getQuoteDataFromCache).mockReturnValue({ planningType: 'other' })
    const request = makeRequest({ path: planningTypePath })
    const h = makeH()

    const result = checkForValidQuoteSession(request, h)

    expect(result).toBe(h.continue)
    expect(h.redirect).not.toHaveBeenCalled()
  })

  it('continues on application-type-not-available when planningType is "other"', () => {
    vi.mocked(getQuoteDataFromCache).mockReturnValue({ planningType: 'other' })
    const request = makeRequest({ path: applicationTypeNotAvailablePath })
    const h = makeH()

    const result = checkForValidQuoteSession(request, h)

    expect(result).toBe(h.continue)
    expect(h.redirect).not.toHaveBeenCalled()
  })

  it('continues without session check for confirmation page', () => {
    const request = makeRequest({ path: confirmationPath })
    const h = makeH()

    const result = checkForValidQuoteSession(request, h)

    expect(result).toBe(h.continue)
    expect(getQuoteDataFromCache).not.toHaveBeenCalled()
  })

  it('continues without session check for delete quote confirmation page', () => {
    const request = makeRequest({ path: deleteConfirmationPath })
    const h = makeH()

    const result = checkForValidQuoteSession(request, h)

    expect(result).toBe(h.continue)
    expect(getQuoteDataFromCache).not.toHaveBeenCalled()
  })

  it('redirects to not-housing when isHousing is "no"', () => {
    vi.mocked(getQuoteDataFromCache).mockReturnValue({ isHousing: 'no' })
    const request = makeRequest({ path: '/quote/boundary-type' })
    const h = makeH()

    checkForValidQuoteSession(request, h)

    expect(h.redirect).toHaveBeenCalledWith(notHousingPath)
  })

  it('carries change=true to not-housing when the intercepted request had it', () => {
    vi.mocked(getQuoteDataFromCache).mockReturnValue({ isHousing: 'no' })
    const request = makeRequest({
      path: '/quote/check-your-answers',
      query: { change: 'true' }
    })
    const h = makeH()

    checkForValidQuoteSession(request, h)

    expect(h.redirect).toHaveBeenCalledWith(`${notHousingPath}?change=true`)
  })

  it('continues on not-housing when isHousing is "no"', () => {
    vi.mocked(getQuoteDataFromCache).mockReturnValue({ isHousing: 'no' })
    const request = makeRequest({ path: notHousingPath })
    const h = makeH()

    const result = checkForValidQuoteSession(request, h)

    expect(result).toBe(h.continue)
    expect(h.redirect).not.toHaveBeenCalled()
  })

  it('continues on confirm-housing when isHousing is "no"', () => {
    vi.mocked(getQuoteDataFromCache).mockReturnValue({ isHousing: 'no' })
    const request = makeRequest({ path: confirmHousingPath })
    const h = makeH()

    const result = checkForValidQuoteSession(request, h)

    expect(result).toBe(h.continue)
    expect(h.redirect).not.toHaveBeenCalled()
  })

  it('continues on planning-type when isHousing is "no"', () => {
    vi.mocked(getQuoteDataFromCache).mockReturnValue({ isHousing: 'no' })
    const request = makeRequest({ path: planningTypePath })
    const h = makeH()

    const result = checkForValidQuoteSession(request, h)

    expect(result).toBe(h.continue)
    expect(h.redirect).not.toHaveBeenCalled()
  })

  it('continues without session check for non-GET requests', () => {
    const request = makeRequest({ path: '/quote/unit-number', method: 'post' })
    const h = makeH()

    const result = checkForValidQuoteSession(request, h)

    expect(result).toBe(h.continue)
    expect(getQuoteDataFromCache).not.toHaveBeenCalled()
  })
})
