import { describe, it, expect } from 'vitest'
import { quotePostController } from './controller-post.js'
import getNextPage from './unit-number/get-next-page.js'

import { saveValidationFlashToCache } from './helpers/form-validation-session/index.js'
import { saveQuoteDataToCache } from './helpers/quote-session-cache/index.js'

vi.mock('./helpers/quote-session-cache/index.js', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    saveQuoteDataToCache: vi.fn(),
    saveValidationFlashToCache: vi.fn()
  }
})

vi.mock(
  './helpers/form-validation-session/index.js',
  async (importOriginal) => {
    const actual = await importOriginal()
    return {
      ...actual,
      saveValidationFlashToCache: vi.fn()
    }
  }
)

describe('quotePostController', () => {
  const changeQuery = '?change=true'

  const buildRequest = (payload = {}, { query = {}, search = '' } = {}) => ({
    payload,
    query,
    path: '/quote/boundary-type',
    url: { search },
    yar: { get: vi.fn(), set: vi.fn() }
  })

  const buildH = () => ({
    redirect: vi.fn().mockReturnValue({
      code: vi.fn().mockReturnValue({ takeover: vi.fn() })
    })
  })

  it('should save the payload to cache and redirect to the next page on successful submission', () => {
    const mergedQuoteData = { housingUnits: 10 }
    vi.mocked(saveQuoteDataToCache).mockReturnValue(mergedQuoteData)
    const controller = quotePostController({
      formValidation: () => () => {},
      getNextPage
    })
    const request = buildRequest({ housingUnits: 10 })
    const h = buildH()

    controller.handler(request, h)

    expect(saveQuoteDataToCache).toHaveBeenCalledWith(request, request.payload)
    expect(h.redirect).toHaveBeenCalledWith('/quote/boundary-type')
  })

  it('should redirect to check your answers when submitted in change mode', () => {
    const getNextPageMock = vi.fn()
    const controller = quotePostController({
      formValidation: () => () => {},
      getNextPage: getNextPageMock
    })
    const request = buildRequest(
      { housingUnits: 10 },
      { query: { change: 'true' }, search: changeQuery }
    )
    const h = buildH()

    controller.handler(request, h)

    expect(saveQuoteDataToCache).toHaveBeenCalledWith(request, request.payload)
    expect(getNextPageMock).not.toHaveBeenCalled()
    expect(h.redirect).toHaveBeenCalledWith('/quote/check-your-answers')
  })

  it('should save validation errors to flash and redirect on validation failure', () => {
    const controller = quotePostController({
      formValidation: () => () => {},
      getNextPage: vi.fn()
    })
    const request = buildRequest({ field1: 'bad value' })
    const h = buildH()
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
    expect(h.redirect).toHaveBeenCalledWith(request.path)
  })

  it('should preserve the query string when redirecting back after a validation failure', () => {
    const controller = quotePostController({
      formValidation: () => () => {},
      getNextPage: vi.fn()
    })
    const request = buildRequest(
      { field1: 'bad value' },
      { query: { change: 'true' }, search: changeQuery }
    )
    const h = buildH()
    const err = { details: [{ path: 'field1', message: 'Required' }] }

    controller.options.validate.failAction(request, h, err)

    expect(h.redirect).toHaveBeenCalledWith(
      `/quote/boundary-type${changeQuery}`
    )
  })
})
