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
    view: (template, model) => ({ template, model })
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
    mockBackend('NRF-123456', { status: 'valid', quote })

    const request = {
      params: { reference: 'NRF-123456', token: 'abctoken123' }
    }

    const result = await quoteDetailsGetController.handler(request, buildH())

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
      mockBackend('NRF-123456', { status, quote: null })

      const request = {
        params: { reference: 'NRF-123456', token: 'abctoken123' }
      }

      const result = await quoteDetailsGetController.handler(request, buildH())

      expect(result.template).toBe('quote/quote-details/error')
      expect(result.model.pageHeading).toBe(message)
    }
  )

  it('should propagate errors thrown by the backend', async () => {
    mockBackend('NRF-FAIL', { message: 'Server error' }, 500)

    const request = {
      params: { reference: 'NRF-FAIL', token: 'bad-token' }
    }

    await expect(
      quoteDetailsGetController.handler(request, buildH())
    ).rejects.toThrow()
  })
})
