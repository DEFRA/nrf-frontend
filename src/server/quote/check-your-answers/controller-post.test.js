import { describe, it, expect, vi } from 'vitest'
import { http, HttpResponse } from 'msw'
import { config } from '../../../config/config.js'
import { quoteSubmitController } from './controller-post.js'
import { setupMswServer } from '../../../test-utils/setup-msw-server.js'
import {
  clearQuoteDataFromCache,
  getCompleteQuoteDataFromCache
} from '../helpers/get-quote-session/index.js'

const backendUrl = config.get('backend').apiUrl

vi.mock('../helpers/get-quote-session/index.js', () => ({
  getCompleteQuoteDataFromCache: vi.fn(),
  clearQuoteDataFromCache: vi.fn()
}))

const server = setupMswServer()

describe('quoteSubmitController', () => {
  it('should post the complete quote data to the backend and redirect with the reference', async () => {
    const quoteData = {
      boundaryEntryType: 'draw',
      developmentTypes: ['housing'],
      residentialBuildingCount: 10,
      email: 'test@example.com'
    }
    getCompleteQuoteDataFromCache.mockReturnValue(quoteData)

    let capturedBody
    server.use(
      http.post(`${backendUrl}/quotes`, async ({ request: req }) => {
        capturedBody = await req.json()
        return HttpResponse.json({ reference: 'REF-001002' })
      })
    )

    const codeResponse = Symbol('codeResponse')
    const h = {
      redirect: vi
        .fn()
        .mockReturnValue({ code: vi.fn().mockReturnValue(codeResponse) })
    }
    const request = {}

    const result = await quoteSubmitController.handler(request, h)

    expect(getCompleteQuoteDataFromCache).toHaveBeenCalledWith(request)
    expect(capturedBody).toEqual(quoteData)
    expect(clearQuoteDataFromCache).toHaveBeenCalledWith(request)
    expect(h.redirect).toHaveBeenCalledWith(
      '/quote/confirmation?reference=REF-001002'
    )
    expect(h.redirect().code).toHaveBeenCalledWith(303)
    expect(result).toBe(codeResponse)
  })

  it('should propagate errors thrown by the backend', async () => {
    getCompleteQuoteDataFromCache.mockReturnValue({ email: 'test@example.com' })

    server.use(
      http.post(`${backendUrl}/quotes`, () =>
        HttpResponse.json({ message: 'Internal Server Error' }, { status: 500 })
      )
    )

    const h = { redirect: vi.fn() }

    await expect(quoteSubmitController.handler({}, h)).rejects.toThrow()
  })
})
