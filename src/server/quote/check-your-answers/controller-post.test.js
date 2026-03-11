import { describe, it, expect, vi } from 'vitest'
import { http, HttpResponse } from 'msw'
import { config } from '../../../config/config.js'
import {
  getQuoteDataFromCache,
  saveQuoteDataToCache
} from '../session-cache.js'
import { quoteSubmitController } from './controller-post.js'
import { setupMswServer } from '../../../test-utils/setup-msw-server.js'

const backendUrl = config.get('backend').apiUrl

vi.mock('../session-cache.js', () => ({
  getQuoteDataFromCache: vi.fn(),
  saveQuoteDataToCache: vi.fn()
}))

const server = setupMswServer()

describe('quoteSubmitController', () => {
  it('should post the email address to the backend and redirect with the reference', async () => {
    getQuoteDataFromCache.mockReturnValue({ email: 'test@example.com' })

    server.use(
      http.post(`${backendUrl}/quote`, () =>
        HttpResponse.json({ reference: 'REF-001002' })
      )
    )

    const codeResponse = Symbol('codeResponse')
    const h = {
      redirect: vi
        .fn()
        .mockReturnValue({ code: vi.fn().mockReturnValue(codeResponse) })
    }
    const request = {}

    const result = await quoteSubmitController.handler(request, h)

    expect(getQuoteDataFromCache).toHaveBeenCalledWith(request)
    expect(saveQuoteDataToCache).toHaveBeenCalledWith(request, {
      nrfReference: 'REF-001002'
    })
    expect(h.redirect).toHaveBeenCalledWith(
      '/quote/confirmation?reference=REF-001002'
    )
    expect(h.redirect().code).toHaveBeenCalledWith(303)
    expect(result).toBe(codeResponse)
  })

  it('should propagate errors thrown by the backend', async () => {
    getQuoteDataFromCache.mockReturnValue({ email: 'test@example.com' })

    server.use(
      http.post(`${backendUrl}/quote`, () =>
        HttpResponse.json({ message: 'Internal Server Error' }, { status: 500 })
      )
    )

    const h = { redirect: vi.fn() }

    await expect(quoteSubmitController.handler({}, h)).rejects.toThrow()
  })
})
