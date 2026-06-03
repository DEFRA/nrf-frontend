import { describe, it, expect } from 'vitest'
import { http, HttpResponse } from 'msw'
import { config } from '../../../config/config.js'
import { confirmationGetController } from './controller-get.js'
import { setupMswServer } from '../../../test-utils/setup-msw-server.js'

const backendUrl = config.get('backend').apiUrl

const server = setupMswServer()

describe('confirmationGetController', () => {
  const routeId = 'confirmation'
  const baseViewModel = { pageTitle: 'Your details have been submitted' }
  const getViewModel = () => baseViewModel
  const buildH = () => ({
    view: (template, model) => ({ template, model })
  })

  it('should render the confirmation view when the quote exists', async () => {
    server.use(
      http.get(`${backendUrl}/quotes/NRF-123456`, () =>
        HttpResponse.json({ accessStatus: 'invalid', quote: null })
      )
    )

    const controller = confirmationGetController({ routeId, getViewModel })
    const request = { query: { reference: 'NRF-123456' } }

    const result = await controller.handler(request, buildH())

    expect(result.template).toBe('quote/confirmation/index')
    expect(result.model).toMatchObject(baseViewModel)
    expect(result.model.reference).toBe('NRF-123456')
  })

  it('should return not found when the quote does not exist', async () => {
    server.use(
      http.get(`${backendUrl}/quotes/NRF-999999`, () =>
        HttpResponse.json({ accessStatus: 'not_found', quote: null })
      )
    )

    const controller = confirmationGetController({ routeId, getViewModel })
    const request = { query: { reference: 'NRF-999999' } }

    const result = await controller.handler(request, buildH())

    expect(result.isBoom).toBe(true)
    expect(result.output.statusCode).toBe(404)
  })

  it('should propagate errors thrown by the backend', async () => {
    server.use(
      http.get(`${backendUrl}/quotes/NRF-FAIL`, () =>
        HttpResponse.json({ message: 'Server error' }, { status: 500 })
      )
    )

    const controller = confirmationGetController({ routeId, getViewModel })
    const request = { query: { reference: 'NRF-FAIL' } }

    await expect(controller.handler(request, buildH())).rejects.toThrow()
  })
})
