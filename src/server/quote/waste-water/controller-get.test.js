import { describe, it, expect, vi } from 'vitest'
import { http, HttpResponse } from 'msw'
import { wasteWaterGetController } from './controller-get.js'

import {
  getValidationFlashFromCache,
  clearValidationFlashFromCache
} from '../helpers/form-validation-session/index.js'
import { getQuoteDataFromCache } from '../helpers/quote-session-cache/index.js'
import { config } from '../../../config/config.js'
import { setupMswServer } from '../../../test-utils/setup-msw-server.js'

vi.mock(
  '../helpers/form-validation-session/index.js',
  async (importOriginal) => {
    const actual = await importOriginal()
    return {
      ...actual,
      getValidationFlashFromCache: vi.fn(),
      clearValidationFlashFromCache: vi.fn()
    }
  }
)

vi.mock('../helpers/quote-session-cache/index.js', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    getQuoteDataFromCache: vi.fn()
  }
})

const backendUrl = config.get('backend').apiUrl
const server = setupMswServer()

const cachedOptions = [{ id: '1', name: 'Test WRC', distance: 2.1 }]

const buildRequest = ({ yarOptions = cachedOptions } = {}) => ({
  yar: {
    get: vi.fn().mockReturnValue(yarOptions),
    set: vi.fn(),
    clear: vi.fn()
  }
})

const buildH = () => ({
  view: vi.fn().mockReturnValue('view-response')
})

const routeId = 'waste-water'
const getViewModel = vi.fn()

describe('wasteWaterGetController', () => {
  it('should render the view with quoteData and cached options when no flash', async () => {
    const quoteData = { wasteWaterTreatmentWorksId: '1' }
    vi.mocked(getQuoteDataFromCache).mockReturnValue(quoteData)
    vi.mocked(getValidationFlashFromCache).mockReturnValue(null)
    getViewModel.mockResolvedValue({ pageHeading: 'Test' })

    const controller = wasteWaterGetController({ routeId, getViewModel })
    const request = buildRequest()
    const h = buildH()

    await controller.handler(request, h)

    expect(getViewModel).toHaveBeenCalledWith(quoteData, { cachedOptions })
    expect(h.view).toHaveBeenCalledWith('quote/waste-water/index', {
      pageHeading: 'Test',
      formSubmitData: quoteData,
      validationErrors: undefined
    })
  })

  it('should use options from yar cache without calling the service', async () => {
    vi.mocked(getQuoteDataFromCache).mockReturnValue({})
    vi.mocked(getValidationFlashFromCache).mockReturnValue(null)
    getViewModel.mockResolvedValue({})

    const controller = wasteWaterGetController({ routeId, getViewModel })
    const request = buildRequest({ yarOptions: cachedOptions })
    const h = buildH()

    // MSW has onUnhandledRequest: 'error', so any HTTP call to the backend would throw
    await expect(controller.handler(request, h)).resolves.not.toThrow()
    expect(getViewModel).toHaveBeenCalledWith({}, { cachedOptions })
  })

  it('should fetch and cache options from service when yar cache is empty', async () => {
    const geometry = { type: 'Polygon', coordinates: [] }
    const quoteData = { boundaryGeojson: { boundaryGeometryWgs84: geometry } }
    vi.mocked(getQuoteDataFromCache).mockReturnValue(quoteData)
    vi.mocked(getValidationFlashFromCache).mockReturnValue(null)
    getViewModel.mockResolvedValue({})

    server.use(
      http.post(`${backendUrl}/wwtw/nearby`, () =>
        HttpResponse.json({
          nearbyWwtws: [{ wwtwId: '1', wwtwName: 'Test WRC', distanceKm: 2.1 }]
        })
      )
    )

    const controller = wasteWaterGetController({ routeId, getViewModel })
    const request = buildRequest({ yarOptions: null })
    const h = buildH()

    await controller.handler(request, h)

    expect(request.yar.set).toHaveBeenCalledWith(
      'nearbyWasteWaterOptions',
      cachedOptions
    )
    expect(getViewModel).toHaveBeenCalledWith(quoteData, { cachedOptions })
  })

  it('should merge flash data and pass validation errors to the view', async () => {
    const quoteData = { wasteWaterTreatmentWorksId: '1' }
    const flash = {
      validationErrors: { summary: [{ text: 'Select an option' }] },
      formSubmitData: { wasteWaterTreatmentWorks: '' }
    }
    vi.mocked(getQuoteDataFromCache).mockReturnValue(quoteData)
    vi.mocked(getValidationFlashFromCache).mockReturnValue(flash)
    getViewModel.mockResolvedValue({})

    const controller = wasteWaterGetController({ routeId, getViewModel })
    const request = buildRequest()
    const h = buildH()

    await controller.handler(request, h)

    expect(clearValidationFlashFromCache).toHaveBeenCalledWith(request)
    expect(getViewModel).toHaveBeenCalledWith(
      { ...quoteData, ...flash.formSubmitData },
      { cachedOptions }
    )
    expect(h.view).toHaveBeenCalledWith('quote/waste-water/index', {
      formSubmitData: { ...quoteData, ...flash.formSubmitData },
      validationErrors: flash.validationErrors
    })
  })
})
