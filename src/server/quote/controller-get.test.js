import { describe, it, expect } from 'vitest'
import { quoteController } from './controller-get.js'
import {
  getQuoteDataFromCache,
  getValidationFlashFromCache,
  clearValidationFlashFromCache
} from './session-cache.js'

vi.mock('./session-cache.js')

describe('quoteController', () => {
  const routeId = 'start'
  const viewModel = { pageTitle: 'Start' }
  const getViewModel = () => viewModel
  const buildH = () => ({
    view: (template, model) => {
      const response = { template, model }
      response.header = () => response
      return response
    }
  })

  it('should render the correct view with the view model', () => {
    const controller = quoteController({ routeId, getViewModel })
    const result = controller.handler({}, buildH())
    expect(result.template).toBe('quote/start/index')
    expect(result.model).toEqual(viewModel)
  })

  it('should remember the users previous selection', () => {
    vi.mocked(getQuoteDataFromCache).mockReturnValue({
      boundaryEntryType: 'draw'
    })
    const controller = quoteController({ routeId, getViewModel })
    const result = controller.handler({}, buildH())
    expect(result.model.formSubmitData.boundaryEntryType).toBe('draw')
  })

  it('should render form validation errors and formSubmitData if they were stored in flash', () => {
    const flash = {
      validationErrors: { summary: [{ href: '#field1', text: 'Required' }] },
      formSubmitData: { field1: 'bad' }
    }
    vi.mocked(getValidationFlashFromCache).mockReturnValue(flash)
    const controller = quoteController({ routeId, getViewModel })
    const request = {}

    const result = controller.handler(request, buildH())

    expect(result.model.validationErrors).toEqual(flash.validationErrors)
    expect(result.model.formSubmitData).toEqual(flash.formSubmitData)
  })

  it('should clear the flash after reading it', () => {
    const flash = {
      validationErrors: { summary: [] },
      formSubmitData: {}
    }
    vi.mocked(getValidationFlashFromCache).mockReturnValue(flash)
    const controller = quoteController({ routeId, getViewModel })
    const request = {}

    controller.handler(request, buildH())

    expect(clearValidationFlashFromCache).toHaveBeenCalledWith(request)
  })

  it('should fall back to quote cache for formSubmitData when there is no flash', () => {
    vi.mocked(getValidationFlashFromCache).mockReturnValue(null)
    vi.mocked(getQuoteDataFromCache).mockReturnValue({
      boundaryEntryType: 'upload'
    })
    const controller = quoteController({ routeId, getViewModel })

    const result = controller.handler({}, buildH())

    expect(result.model.formSubmitData).toEqual({ boundaryEntryType: 'upload' })
    expect(result.model.validationErrors).toBeUndefined()
  })
})
