import { describe, it, expect, vi } from 'vitest'
import { createPageController } from './page-controller.js'
import {
  getValidationFlashFromCache,
  clearValidationFlashFromCache
} from '../../quote/helpers/form-validation-session/index.js'
import { getQuoteDataFromCache } from '../../quote/helpers/quote-session-cache/index.js'

vi.mock('../../quote/helpers/quote-session-cache/index.js')
vi.mock('../../quote/helpers/form-validation-session/index.js')

describe('createPageController', () => {
  const routeId = 'planning-type'
  const viewModel = { pageTitle: 'Planning type' }
  const getViewModel = () => viewModel
  const buildH = () => ({
    view: (template, model) => ({ template, model })
  })

  it('renders the view at viewsDir/routeId/index', async () => {
    const controller = createPageController({ viewsDir: 'quote' })({
      routeId,
      getViewModel
    })

    const result = await controller.handler({}, buildH())

    expect(result.template).toBe('quote/planning-type/index')
  })

  it('uses the viewsDir passed to the factory to build the template path', async () => {
    const controller = createPageController({ viewsDir: 'manage' })({
      routeId: 'start-page',
      getViewModel
    })

    const result = await controller.handler({}, buildH())

    expect(result.template).toBe('manage/start-page/index')
  })

  it('merges the view model returned by getViewModel into the rendered model', async () => {
    const controller = createPageController({ viewsDir: 'quote' })({
      routeId,
      getViewModel
    })

    const result = await controller.handler({}, buildH())

    expect(result.model).toMatchObject(viewModel)
  })

  it('awaits an async getViewModel', async () => {
    const asyncGetViewModel = () => Promise.resolve(viewModel)
    const controller = createPageController({ viewsDir: 'quote' })({
      routeId,
      getViewModel: asyncGetViewModel
    })

    const result = await controller.handler({}, buildH())

    expect(result.model).toMatchObject(viewModel)
  })

  it('calls getViewModel with the cached quote data and the request query', async () => {
    const quoteData = { boundaryEntryType: 'draw' }
    vi.mocked(getQuoteDataFromCache).mockReturnValue(quoteData)
    const mockGetViewModel = vi.fn().mockReturnValue(viewModel)
    const controller = createPageController({ viewsDir: 'quote' })({
      routeId,
      getViewModel: mockGetViewModel
    })
    const request = { query: { change: 'true' } }

    await controller.handler(request, buildH())

    expect(mockGetViewModel).toHaveBeenCalledWith(quoteData, request.query)
  })

  it('sets formSubmitData from the cached quote data when there is no flash', async () => {
    vi.mocked(getValidationFlashFromCache).mockReturnValue(null)
    const quoteData = { boundaryEntryType: 'upload' }
    vi.mocked(getQuoteDataFromCache).mockReturnValue(quoteData)
    const controller = createPageController({ viewsDir: 'quote' })({
      routeId,
      getViewModel
    })

    const result = await controller.handler({}, buildH())

    expect(result.model.formSubmitData).toEqual(quoteData)
    expect(result.model.validationErrors).toBeUndefined()
  })

  it('merges flashed form submit data over the cached quote data', async () => {
    const quoteData = { boundaryEntryType: 'upload' }
    vi.mocked(getQuoteDataFromCache).mockReturnValue(quoteData)
    const flash = {
      validationErrors: { summary: [{ href: '#field1', text: 'Required' }] },
      formSubmitData: { field1: 'bad' }
    }
    vi.mocked(getValidationFlashFromCache).mockReturnValue(flash)
    const mockGetViewModel = vi.fn().mockReturnValue(viewModel)
    const controller = createPageController({ viewsDir: 'quote' })({
      routeId,
      getViewModel: mockGetViewModel
    })
    const request = {}

    const result = await controller.handler(request, buildH())

    expect(mockGetViewModel).toHaveBeenCalledWith(
      { ...quoteData, ...flash.formSubmitData },
      undefined
    )
    expect(result.model.formSubmitData).toEqual({
      ...quoteData,
      ...flash.formSubmitData
    })
    expect(result.model.validationErrors).toEqual(flash.validationErrors)
  })

  it('clears the flash after reading it', async () => {
    const flash = {
      validationErrors: { summary: [] },
      formSubmitData: {}
    }
    vi.mocked(getValidationFlashFromCache).mockReturnValue(flash)
    const controller = createPageController({ viewsDir: 'quote' })({
      routeId,
      getViewModel
    })
    const request = {}

    await controller.handler(request, buildH())

    expect(clearValidationFlashFromCache).toHaveBeenCalledWith(request)
  })

  it('does not clear the flash when there is none to clear', async () => {
    vi.mocked(getValidationFlashFromCache).mockReturnValue(null)
    const controller = createPageController({ viewsDir: 'quote' })({
      routeId,
      getViewModel
    })

    await controller.handler({}, buildH())

    expect(clearValidationFlashFromCache).not.toHaveBeenCalled()
  })
})
