import { describe, it, expect } from 'vitest'
import { http, HttpResponse } from 'msw'
import { confirmationGetController } from './controller-get.js'
import { setupMswServer } from '../../../test-utils/setup-msw-server.js'

const server = setupMswServer()

describe('confirmationGetController', () => {
  const routeId = 'confirmation'
  const baseViewModel = { pageTitle: 'Your details have been submitted' }
  const getViewModel = () => baseViewModel
  const buildH = () => ({
    view: (template, model) => ({ template, model })
  })

  it('should render the correct view with the view model and quote details', async () => {
    const quote = { reference: 'NRF-123456', email: 'test@example.com' }

    server.use(
      http.get('http://localhost:3001/quote/NRF-123456', () =>
        HttpResponse.json(quote)
      )
    )

    const controller = confirmationGetController({ routeId, getViewModel })
    const request = { query: { reference: 'NRF-123456' } }

    const result = await controller.handler(request, buildH())

    expect(result.template).toBe('quote/confirmation/index')
    expect(result.model).toMatchObject(baseViewModel)
    expect(result.model.reference).toBe('NRF-123456')
    expect(result.model.quote).toEqual(quote)
  })

  it('should propagate errors thrown by the backend', async () => {
    server.use(
      http.get('http://localhost:3001/quote/NRF-FAIL', () =>
        HttpResponse.json({ message: 'Not Found' }, { status: 404 })
      )
    )

    const controller = confirmationGetController({ routeId, getViewModel })
    const request = { query: { reference: 'NRF-FAIL' } }

    await expect(controller.handler(request, buildH())).rejects.toThrow()
  })
})
