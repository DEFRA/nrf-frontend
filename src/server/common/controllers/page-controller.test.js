import { describe, it, expect, vi } from 'vitest'
import { createPageController } from './page-controller.js'
import {
  getValidationFlashFromCache,
  saveValidationFlashToCache
} from '../helpers/form-validation-session/index.js'
import { createSessionRequest } from '../../../test-utils/create-session-request.js'

describe('createPageController', () => {
  const routeId = 'planning-type'
  const viewModel = { pageTitle: 'Planning type' }
  const getViewModel = () => viewModel
  const buildH = () => ({
    view: (template, model) => ({ template, model })
  })
  const buildRequest = (session = {}, extra = {}) =>
    createSessionRequest({ session, ...extra })
  const flash = {
    validationErrors: { summary: [{ href: '#field1', text: 'Required' }] },
    formSubmitData: { field1: 'bad' }
  }

  it('renders the view at viewsDir/routeId/index', async () => {
    const controller = createPageController({ viewsDir: 'quote' })({
      routeId,
      getViewModel
    })

    const result = await controller.handler(buildRequest(), buildH())

    expect(result.template).toBe('quote/planning-type/index')
  })

  it('uses the viewsDir passed to the factory to build the template path', async () => {
    const controller = createPageController({ viewsDir: 'manage' })({
      routeId: 'start-page',
      getViewModel
    })

    const result = await controller.handler(buildRequest(), buildH())

    expect(result.template).toBe('manage/start-page/index')
  })

  it('merges the view model returned by getViewModel into the rendered model', async () => {
    const controller = createPageController({ viewsDir: 'quote' })({
      routeId,
      getViewModel
    })

    const result = await controller.handler(buildRequest(), buildH())

    expect(result.model).toMatchObject(viewModel)
  })

  it('awaits an async getViewModel', async () => {
    const asyncGetViewModel = () => Promise.resolve(viewModel)
    const controller = createPageController({ viewsDir: 'quote' })({
      routeId,
      getViewModel: asyncGetViewModel
    })

    const result = await controller.handler(buildRequest(), buildH())

    expect(result.model).toMatchObject(viewModel)
  })

  it('reads the quote session by default and passes it and the request query to getViewModel', async () => {
    const quoteData = { boundaryEntryType: 'draw' }
    const mockGetViewModel = vi.fn().mockReturnValue(viewModel)
    const controller = createPageController({ viewsDir: 'quote' })({
      routeId,
      getViewModel: mockGetViewModel
    })
    const request = buildRequest(
      { quote: quoteData },
      { query: { change: 'true' } }
    )

    await controller.handler(request, buildH())

    expect(mockGetViewModel).toHaveBeenCalledWith(quoteData, request.query)
  })

  it('reads the session data given by getSessionData instead of the quote session', async () => {
    const otherData = { hasNrlReference: 'yes' }
    const mockGetViewModel = vi.fn().mockReturnValue(viewModel)
    const getSessionData = vi.fn().mockReturnValue(otherData)
    const controller = createPageController({ viewsDir: 'request-to-use' })({
      routeId,
      getViewModel: mockGetViewModel,
      getSessionData
    })
    const request = buildRequest({ quote: { boundaryEntryType: 'draw' } })

    const result = await controller.handler(request, buildH())

    expect(getSessionData).toHaveBeenCalledWith(request)
    expect(mockGetViewModel).toHaveBeenCalledWith(otherData, undefined)
    expect(result.model.formSubmitData).toEqual(otherData)
  })

  it('sets formSubmitData from the session data when there is no flash', async () => {
    const quoteData = { boundaryEntryType: 'upload' }
    const controller = createPageController({ viewsDir: 'quote' })({
      routeId,
      getViewModel
    })

    const result = await controller.handler(
      buildRequest({ quote: quoteData }),
      buildH()
    )

    expect(result.model.formSubmitData).toEqual(quoteData)
    expect(result.model.validationErrors).toBeUndefined()
  })

  it('merges flashed form submit data over the session data', async () => {
    const quoteData = { boundaryEntryType: 'upload' }
    const mockGetViewModel = vi.fn().mockReturnValue(viewModel)
    const controller = createPageController({ viewsDir: 'quote' })({
      routeId,
      getViewModel: mockGetViewModel
    })
    const request = buildRequest({ quote: quoteData })
    saveValidationFlashToCache(request, flash)

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

  it('shows the flashed form data when there is no session data', async () => {
    const controller = createPageController({ viewsDir: 'request-to-use' })({
      routeId,
      getViewModel,
      getSessionData: () => null
    })
    const request = buildRequest()
    saveValidationFlashToCache(request, flash)

    const result = await controller.handler(request, buildH())

    expect(result.model.formSubmitData).toEqual(flash.formSubmitData)
  })

  it('clears the flash after reading it', async () => {
    const controller = createPageController({ viewsDir: 'quote' })({
      routeId,
      getViewModel
    })
    const request = buildRequest()
    saveValidationFlashToCache(request, flash)

    await controller.handler(request, buildH())

    expect(getValidationFlashFromCache(request)).toBeNull()
  })
})
