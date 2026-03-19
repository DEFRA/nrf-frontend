import { describe, expect, it, vi } from 'vitest'
import { checkForValidQuoteSession } from './index.js'
import { routePath as boundaryTypePath } from '../../boundary-type/routes.js'
import { routePath as confirmationPath } from '../../confirmation/routes.js'
import { routePath as startPath } from '../../start/routes.js'
import { getQuoteDataFromCache } from '../get-quote-session/index.js'
import { routePath as deleteConfirmationPath } from '../../delete-quote-confirmation/routes.js'

vi.mock('../get-quote-session/index.js')

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
  it('continues when boundaryEntryType is present', () => {
    vi.mocked(getQuoteDataFromCache).mockReturnValue({
      boundaryEntryType: 'draw'
    })
    const request = makeRequest({ path: '/quote/residential' })
    const h = makeH()

    const result = checkForValidQuoteSession(request, h)

    expect(result).toBe(h.continue)
    expect(h.redirect).not.toHaveBeenCalled()
  })

  it('redirects to start when boundaryEntryType is absent', () => {
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

  it('continues without session check for boundary-type page', () => {
    const request = makeRequest({ path: boundaryTypePath })
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

  it('continues without session check for non-GET requests', () => {
    const request = makeRequest({ path: '/quote/residential', method: 'post' })
    const h = makeH()

    const result = checkForValidQuoteSession(request, h)

    expect(result).toBe(h.continue)
    expect(getQuoteDataFromCache).not.toHaveBeenCalled()
  })
})
