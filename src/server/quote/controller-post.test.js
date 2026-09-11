import { describe, it, expect } from 'vitest'
import {
  quotePostController,
  resolveChangeModeRedirect
} from './controller-post.js'
import getNextPage from './unit-number/get-next-page.js'
import { routePath as checkYourAnswersPath } from './check-your-answers/route-path.js'
import { routePath as confirmHousingPath } from './confirm-housing/route-path.js'
import { routePath as applicationTypeNotAvailablePath } from './application-type-not-available/route-path.js'

describe('quotePostController', () => {
  // Minimal stateful session so the real quote cache and validation flash run
  const buildRequest = (payload = {}) => {
    const session = {}
    return {
      payload,
      path: '/quote/boundary-type',
      url: { search: '' },
      query: {},
      logger: { error: vi.fn() },
      yar: {
        get: (key) => session[key],
        set: (key, value) => {
          session[key] = value
        }
      }
    }
  }

  const buildH = () => ({
    redirect: vi.fn().mockReturnValue({
      code: vi.fn().mockReturnValue({ takeover: vi.fn() })
    })
  })

  it('should save the payload to cache and redirect to the next page on successful submission', () => {
    const controller = quotePostController({
      formValidation: () => () => {},
      getNextPage
    })
    const request = buildRequest({ housingUnits: 10 })
    const h = buildH()

    controller.handler(request, h)

    expect(request.yar.get('quote')).toEqual(
      expect.objectContaining({ housingUnits: 10 })
    )
    expect(h.redirect).toHaveBeenCalledWith('/quote/boundary-type')
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

    expect(request.yar.get('quoteFlash')).toEqual({
      validationErrors: expect.objectContaining({
        summary: expect.arrayContaining([
          expect.objectContaining({ href: '#field1' })
        ])
      }),
      formSubmitData: request.payload
    })
    expect(h.redirect).toHaveBeenCalledWith(
      `${request.path}${request.url.search}`
    )
  })
})

describe('resolveChangeModeRedirect', () => {
  it('should return to check-your-answers in change mode on a non-dropout next page', () => {
    expect(
      resolveChangeModeRedirect({
        nextPage: confirmHousingPath,
        query: { change: 'true' }
      })
    ).toBe(checkYourAnswersPath)
  })

  it('should redirect to the dropout page carrying change=true in change mode', () => {
    expect(
      resolveChangeModeRedirect({
        nextPage: applicationTypeNotAvailablePath,
        query: { change: 'true' }
      })
    ).toBe(`${applicationTypeNotAvailablePath}?change=true`)
  })

  it('should redirect to the dropout page without the param outside change mode', () => {
    expect(
      resolveChangeModeRedirect({
        nextPage: applicationTypeNotAvailablePath,
        query: {}
      })
    ).toBe(applicationTypeNotAvailablePath)
  })

  it('should follow the next page outside change mode', () => {
    expect(
      resolveChangeModeRedirect({ nextPage: confirmHousingPath, query: {} })
    ).toBe(confirmHousingPath)
  })
})
