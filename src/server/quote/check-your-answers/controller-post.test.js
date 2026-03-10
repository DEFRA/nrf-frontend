import { describe, it, expect, vi } from 'vitest'
import { getQuoteDataFromCache } from '../session-cache.js'
import { postRequestToBackend } from '../../common/services/nrf-backend.js'
import { quoteSubmitController } from './controller-post.js'

vi.mock('../session-cache.js', () => ({
  getQuoteDataFromCache: vi.fn()
}))

vi.mock('../../common/services/nrf-backend.js', () => ({
  postRequestToBackend: vi.fn()
}))

describe('quoteSubmitController', () => {
  it('should post the email address to the backend and redirect with the reference', async () => {
    getQuoteDataFromCache.mockReturnValue({ email: 'test@example.com' })
    postRequestToBackend.mockResolvedValue({
      payload: { reference: 'REF-001' }
    })

    const codeResponse = Symbol('codeResponse')
    const h = {
      redirect: vi
        .fn()
        .mockReturnValue({ code: vi.fn().mockReturnValue(codeResponse) })
    }
    const request = {}

    const result = await quoteSubmitController.handler(request, h)

    expect(getQuoteDataFromCache).toHaveBeenCalledWith(request)
    expect(postRequestToBackend).toHaveBeenCalledWith({
      endpointPath: '/quote',
      payload: { emailAddress: 'test@example.com' }
    })
    expect(h.redirect).toHaveBeenCalledWith('/quote/next?reference=REF-001')
    expect(h.redirect().code).toHaveBeenCalledWith(303)
    expect(result).toBe(codeResponse)
  })

  it('should propagate errors thrown by postRequestToBackend', async () => {
    getQuoteDataFromCache.mockReturnValue({ email: 'test@example.com' })
    postRequestToBackend.mockRejectedValue(new Error('Backend unavailable'))

    const h = { redirect: vi.fn() }

    await expect(quoteSubmitController.handler({}, h)).rejects.toThrow(
      'Backend unavailable'
    )
  })
})
