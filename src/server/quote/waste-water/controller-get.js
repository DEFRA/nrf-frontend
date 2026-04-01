import {
  getValidationFlashFromCache,
  clearValidationFlashFromCache
} from '../helpers/form-validation-session/index.js'
import { getQuoteDataFromCache } from '../helpers/quote-session-cache/index.js'
import { getWasteWaterTreatmentWorks } from '../../common/services/waste-water-treatment-works.js'

const cacheKey = 'nearbyWasteWaterOptions'

export const wasteWaterGetController = ({ routeId, getViewModel }) => ({
  async handler(request, h) {
    const formValidationErrors = getValidationFlashFromCache(request)
    let validationErrors
    let quoteData = getQuoteDataFromCache(request)
    if (formValidationErrors) {
      quoteData = { ...quoteData, ...formValidationErrors.formSubmitData }
      validationErrors = formValidationErrors.validationErrors
      clearValidationFlashFromCache(request)
    }

    let cachedOptions = request.yar.get(cacheKey)
    if (!cachedOptions) {
      const boundaryGeometry = quoteData?.boundaryGeojson?.boundaryGeometryWgs84
      cachedOptions = await getWasteWaterTreatmentWorks(boundaryGeometry)
      request.yar.set(cacheKey, cachedOptions)
    }

    const baseViewModel = await getViewModel(quoteData, { cachedOptions })
    const viewModel = {
      ...baseViewModel,
      formSubmitData: quoteData,
      validationErrors
    }
    return h.view(`quote/${routeId}/index`, viewModel)
  }
})
