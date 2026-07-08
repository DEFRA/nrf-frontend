import { describe, expect, it, vi } from 'vitest'
import { checkForValidQuoteSession } from './index.js'
import { routePath as planningTypePath } from '../../planning-type/routes.js'
import { routePath as applicationTypeNotAvailablePath } from '../../application-type-not-available/routes.js'
import { routePath as confirmationPath } from '../../confirmation/routes.js'
import { routePath as startPath } from '../../start/routes.js'
import { getQuoteDataFromCache } from '../quote-session-cache/index.js'
import { routePath as deleteConfirmationPath } from '../../delete-quote-confirmation/routes.js'

vi.mock('../quote-session-cache/index.js')

const makeRequest = ({ path, method = 'get' } = {}) => ({ path, method })

const makeH = () => {
  const h = {
    continue: Symbol('continue'),
    redirect: vi.fn()
  }
  h.redirect.mockReturnValue({ takeover: () => Symbol('takeover') })
  return h
}

describe('checkForValidQuoteSession', () => {
  it('continues when planningType is present', () => {
    vi.mocked(getQuoteDataFromCache).mockReturnValue({
      planningType: 'full-planning-permission'
    })
    const request = makeRequest({ path: '/quote/residential' })
    const h = makeH()

    const result = checkForValidQuoteSession(request, h)

    expect(result).toBe(h.continue)
    expect(h.redirect).not.toHaveBeenCalled()
  })

  it('redirects to start when planningType is absent', () => {
    vi.mocked(getQuoteDataFromCache).mockReturnValue({})
    const request = makeRequest({ path: '/quote/residential' })
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

  it('continues without session check for application-type-not-available page', () => {
    const request = makeRequest({ path: applicationTypeNotAvailablePath })
    const h = makeH()

    const result = checkForValidQuoteSession(request, h)

    expect(result).toBe(h.continue)
    expect(getQuoteDataFromCache).not.toHaveBeenCalled()
  })

  it('continues without session check for planning-type page', () => {
    const request = makeRequest({ path: planningTypePath })
    const h = makeH()

    const result = checkForValidQuoteSession(request, h)

    expect(result).toBe(h.continue)
    expect(getQuoteDataFromCache).not.toHaveBeenCalled()
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

  it('continues without session check for quote details page', () => {
    const request = makeRequest({ path: '/quote/NRF-123456/abc123token' })
    const h = makeH()

    const result = checkForValidQuoteSession(request, h)

    expect(result).toBe(h.continue)
    expect(getQuoteDataFromCache).not.toHaveBeenCalled()
  })

  it('continues without session check for non-GET requests', () => {
    const request = makeRequest({ path: '/quote/residential', method: 'post' })
    const h = makeH()

    const result = checkForValidQuoteSession(request, h)

    expect(result).toBe(h.continue)
    expect(getQuoteDataFromCache).not.toHaveBeenCalled()
  })
})
