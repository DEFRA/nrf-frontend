import { describe, it, expect, vi } from 'vitest'
import { clearQuoteDataFromCache } from '../session-cache.js'
import { deleteSubmitController } from './controller-post.js'

vi.mock('../session-cache.js', () => ({
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
    expect(h.redirect).toHaveBeenCalledWith('/')
    expect(h.redirect().code).toHaveBeenCalledWith(303)
    expect(result).toBe(codeResponse)
  })
})
