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

  it('should render the correct view with the quote data', async () => {
    const quote = {
      reference: 'NRF-123456',
      email: { address: 'test@example.com' },
      boundary: { userInputType: 'upload', filename: null }
    }

    server.use(
      http.get(`${backendUrl}/quotes/NRF-123456`, () =>
        HttpResponse.json(quote)
      )
    )

    const request = {
      params: { reference: 'NRF-123456', token: 'abctoken123' }
    }

    const result = await quoteDetailsGetController.handler(request, buildH())

    expect(result.template).toBe('quote/quote-details/index')
    expect(result.model.pageHeading).toBe(heading)
    expect(result.model.quote).toEqual(quote)
  })

  it('should propagate errors thrown by the backend', async () => {
    server.use(
      http.get(`${backendUrl}/quotes/NRF-FAIL`, () =>
        HttpResponse.json({ message: 'Not Found' }, { status: 404 })
      )
    )

    const request = {
      params: { reference: 'NRF-FAIL', token: 'bad-token' }
    }

    await expect(
      quoteDetailsGetController.handler(request, buildH())
    ).rejects.toThrow()
  })
})
