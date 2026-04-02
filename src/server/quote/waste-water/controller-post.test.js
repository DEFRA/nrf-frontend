import { describe, it, expect } from 'vitest'
import { wasteWaterPostController } from './controller-post.js'

import { saveValidationFlashToCache } from '../helpers/form-validation-session/index.js'
import { saveQuoteDataToCache } from '../helpers/quote-session-cache/index.js'

vi.mock('../helpers/quote-session-cache/index.js', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    saveQuoteDataToCache: vi.fn()
  }
})

vi.mock(
  '../helpers/form-validation-session/index.js',
  async (importOriginal) => {
    const actual = await importOriginal()
    return {
      ...actual,
      saveValidationFlashToCache: vi.fn()
    }
  }
)

const cachedOptions = [
  { id: '101', name: 'Great Billing WRC', distance: 3.2 },
  { id: '202', name: 'Letchworth WWTP', distance: 7.5 }
]

const buildRequest = (payload = {}, sessionOptions = cachedOptions) => ({
  payload,
  path: '/quote/waste-water',
  yar: {
    get: vi.fn().mockReturnValue(sessionOptions),
    set: vi.fn()
  }
})

const buildH = () => ({
  redirect: vi.fn().mockReturnValue({
    code: vi.fn().mockReturnValue({ takeover: vi.fn() })
  })
})

const buildGetNextPage = () => vi.fn().mockReturnValue('/quote/email')
const formValidation = () => () => {}

describe('wasteWaterPostController', () => {
  it('should save the WWTW ID and resolved name when a known option is selected', () => {
    vi.mocked(saveQuoteDataToCache).mockReturnValue({})
    const controller = wasteWaterPostController({
      formValidation,
      getNextPage: buildGetNextPage()
    })
    const request = buildRequest({ wasteWaterTreatmentWorks: '101' })
    const h = buildH()

    controller.handler(request, h)

    expect(saveQuoteDataToCache).toHaveBeenCalledWith(request, {
      wasteWaterTreatmentWorksId: '101',
      wasteWaterTreatmentWorksName: 'Great Billing WRC'
    })
    expect(h.redirect).toHaveBeenCalledWith('/quote/email')
  })

  it('should save null name when the user selects i-dont-know', () => {
    vi.mocked(saveQuoteDataToCache).mockReturnValue({})
    const controller = wasteWaterPostController({
      formValidation,
      getNextPage: buildGetNextPage()
    })
    const request = buildRequest({ wasteWaterTreatmentWorks: 'i-dont-know' })
    const h = buildH()

    controller.handler(request, h)

    expect(saveQuoteDataToCache).toHaveBeenCalledWith(request, {
      wasteWaterTreatmentWorksId: null,
      wasteWaterTreatmentWorksName: null
    })
  })

  it('should save null name when the selected ID is not in the cached options', () => {
    vi.mocked(saveQuoteDataToCache).mockReturnValue({})
    const controller = wasteWaterPostController({
      formValidation,
      getNextPage: buildGetNextPage()
    })
    const request = buildRequest({ wasteWaterTreatmentWorks: '999' })
    const h = buildH()

    controller.handler(request, h)

    expect(saveQuoteDataToCache).toHaveBeenCalledWith(request, {
      wasteWaterTreatmentWorksId: '999',
      wasteWaterTreatmentWorksName: null
    })
  })

  it('should save null name when there are no cached options', () => {
    vi.mocked(saveQuoteDataToCache).mockReturnValue({})
    const controller = wasteWaterPostController({
      formValidation,
      getNextPage: buildGetNextPage()
    })
    const request = buildRequest({ wasteWaterTreatmentWorks: '101' }, null)
    const h = buildH()

    controller.handler(request, h)

    expect(saveQuoteDataToCache).toHaveBeenCalledWith(request, {
      wasteWaterTreatmentWorksId: '101',
      wasteWaterTreatmentWorksName: null
    })
  })

  it('should redirect with 303 status code', () => {
    vi.mocked(saveQuoteDataToCache).mockReturnValue({})
    const controller = wasteWaterPostController({
      formValidation,
      getNextPage: buildGetNextPage()
    })
    const request = buildRequest({ wasteWaterTreatmentWorks: 'i-dont-know' })
    const codeMock = vi.fn()
    const h = {
      redirect: vi.fn().mockReturnValue({ code: codeMock })
    }

    controller.handler(request, h)

    expect(h.redirect).toHaveBeenCalledWith('/quote/email')
    expect(codeMock).toHaveBeenCalledWith(303)
  })

  it('should save validation errors to flash and redirect on validation failure', () => {
    const controller = wasteWaterPostController({
      formValidation,
      getNextPage: buildGetNextPage()
    })
    const request = buildRequest({})
    const h = buildH()
    const err = {
      details: [
        { path: 'wasteWaterTreatmentWorks', message: 'Selection required' }
      ]
    }

    controller.options.validate.failAction(request, h, err)

    expect(saveValidationFlashToCache).toHaveBeenCalledWith(request, {
      validationErrors: expect.objectContaining({
        summary: expect.arrayContaining([
          expect.objectContaining({ href: '#wasteWaterTreatmentWorks' })
        ])
      }),
      formSubmitData: request.payload
    })
    expect(h.redirect).toHaveBeenCalledWith(request.path)
  })
})
