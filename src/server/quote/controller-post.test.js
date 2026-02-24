import { describe, it, expect } from 'vitest'
import { quotePostController } from './controller-post.js'

import { saveValidationFlashToCache } from './session-cache.js'

vi.mock('./session-cache.js', async (importOriginal) => {
  const actual = await importOriginal()
  return { ...actual, saveValidationFlashToCache: vi.fn() }
})

describe('quotePostController', () => {
  const formValidation = () => () => {}
  const getNextPage = () => '/quote/next'

  it('should save the form data to cache and redirect to /quote/next on successful submission', () => {
    const controller = quotePostController({ formValidation, getNextPage })
    const h = {
      redirect: (path) => ({
        redirectTo: path,
        code: () => ({ redirectTo: path })
      })
    }
    const getExistingSessionCacheValue = vi
      .fn()
      .mockReturnValue({ field1: 'value1' })
    const request = {
      payload: { field2: 'value2' },
      yar: { get: getExistingSessionCacheValue, set: vi.fn() }
    }
    const result = controller.handler(request, h)
    expect(getExistingSessionCacheValue).toHaveBeenCalledWith('quote')
    expect(request.yar.set).toHaveBeenCalledWith('quote', {
      field1: 'value1',
      field2: 'value2'
    })
    expect(result.redirectTo).toBe('/quote/next')
  })

  it('should save validation errors to flash and redirect on validation failure', () => {
    const controller = quotePostController({ formValidation, getNextPage })
    const redirect = vi.fn().mockReturnValue({
      code: () => ({ takeover: () => {} })
    })
    const h = { redirect }
    const request = {
      payload: { field1: 'bad value' },
      path: '/quote/boundary-type',
      yar: { get: vi.fn().mockReturnValue(null), set: vi.fn() }
    }
    const err = { details: [{ path: 'field1', message: 'Required' }] }

    controller.options.validate.failAction(request, h, err)

    expect(saveValidationFlashToCache).toHaveBeenCalledWith(request, {
      validationErrors: expect.objectContaining({
        summary: expect.arrayContaining([
          expect.objectContaining({ href: '#field1' })
        ])
      }),
      formSubmitData: request.payload
    })
    expect(redirect).toHaveBeenCalledWith(request.path)
  })
})
