import { describe, it, expect } from 'vitest'
import { http, HttpResponse } from 'msw'
import { config } from '../../../config/config.js'
import { quoteDetailsGetController } from './controller-get.js'
import { setupMswServer } from '../../../test-utils/setup-msw-server.js'
import { heading } from './get-view-model.js'

const backendUrl = config.get('backend').apiUrl

const server = setupMswServer()

describe('quoteDetailsGetController', () => {
  const buildH = () => ({
    view: (template, model) => ({ template, model }),
    state: vi.fn()
  })

  // A normal browser User-Agent is treated as a human visit; a known bot/
  // previewer UA triggers the prefetch stub.
  const browserUserAgent =
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15'

  const buildRequest = ({ reference, token, state, userAgent } = {}) => ({
    params: {
      reference: reference ?? 'NRF-123456',
      token: token ?? 'abctoken123'
    },
    headers: { 'user-agent': userAgent ?? browserUserAgent },
    state: state ?? {}
  })

  const mockBackend = (reference, body, status = 200) => {
    server.use(
      http.get(`${backendUrl}/quotes/${reference}`, () =>
        HttpResponse.json(body, { status })
      )
    )
  }

  it('should render the quote details view when the status is valid', async () => {
    const quote = {
      reference: 'NRF-123456',
      email: { address: 'test@example.com' },
      boundary: { userInputType: 'upload', filename: null }
    }
    mockBackend('NRF-123456', { accessStatus: 'valid', quote })

    const result = await quoteDetailsGetController.handler(
      buildRequest(),
      buildH()
    )

    expect(result.template).toBe('quote/quote-details/index')
    expect(result.model.pageHeading).toBe(heading)
    expect(result.model.quote).toEqual(quote)
  })

  it.each([
    ['invalid', 'The link is invalid'],
    [
      'not_found',
      'The NRF reference you have supplied does not match an existing quote'
    ],
    ['expired', 'This link has expired']
  ])(
    'should render the error view with the right message for status %s',
    async (status, message) => {
      mockBackend('NRF-123456', { accessStatus: status, quote: null })

      const result = await quoteDetailsGetController.handler(
        buildRequest(),
        buildH()
      )

      expect(result.template).toBe('quote/quote-details/error')
      expect(result.model.pageHeading).toBe(message)
    }
  )

  it('should propagate errors thrown by the backend', async () => {
    mockBackend('NRF-FAIL', { message: 'Server error' }, 500)

    const request = buildRequest({ reference: 'NRF-FAIL', token: 'bad-token' })

    await expect(
      quoteDetailsGetController.handler(request, buildH())
    ).rejects.toThrow()
  })

  it('should render the no-data stub for a prefetch request', async () => {
    let backendCalled = false
    server.use(
      http.get(`${backendUrl}/quotes/NRF-123456`, () => {
        backendCalled = true
        return HttpResponse.json({ accessStatus: 'valid', quote: {} })
      })
    )

    const request = buildRequest({ userAgent: 'Slackbot-LinkExpanding 1.0' })

    const result = await quoteDetailsGetController.handler(request, buildH())

    expect(result.template).toBe('quote/quote-details/stub')
    expect(backendCalled).toBe(false)
  })

  it('should set the session cookie on a fresh valid arrival', async () => {
    mockBackend('NRF-123456', {
      accessStatus: 'valid',
      quote: { reference: 'NRF-123456' }
    })
    const h = buildH()

    await quoteDetailsGetController.handler(buildRequest(), h)

    expect(h.state).toHaveBeenCalledWith(
      'quote_details_session',
      expect.objectContaining({ reference: 'NRF-123456' }),
      expect.objectContaining({ path: '/quote/NRF-123456' })
    )
  })

  it('should not set the cookie again when one is already present', async () => {
    mockBackend('NRF-123456', {
      accessStatus: 'valid',
      quote: { reference: 'NRF-123456' }
    })
    const h = buildH()
    const request = buildRequest({
      state: { quote_details_session: { reference: 'NRF-123456' } }
    })

    await quoteDetailsGetController.handler(request, h)

    expect(h.state).not.toHaveBeenCalled()
  })
})
