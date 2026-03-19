import { describe, it, expect, vi } from 'vitest'
import { deleteSubmitController } from './controller-post.js'
import { clearQuoteDataFromCache } from '../helpers/get-quote-session/index.js'

vi.mock('../helpers/get-quote-session/index.js', () => ({
  clearQuoteDataFromCache: vi.fn()
}))

describe('deleteSubmitController', () => {
  it('should clear the quote session and redirect to the start page', async () => {
    const codeResponse = Symbol('codeResponse')
    const h = {
      redirect: vi
        .fn()
        .mockReturnValue({ code: vi.fn().mockReturnValue(codeResponse) })
    }
    const request = {}

    const result = await deleteSubmitController.handler(request, h)

    expect(clearQuoteDataFromCache).toHaveBeenCalledWith(request)
    expect(h.redirect).toHaveBeenCalledWith('/quote/delete-quote-confirmation')
    expect(h.redirect().code).toHaveBeenCalledWith(303)
    expect(result).toBe(codeResponse)
  })
})
