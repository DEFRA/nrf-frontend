import {
  getValidationFlashFromCache,
  clearValidationFlashFromCache
} from '../helpers/form-validation-session/index.js'
import { getQuoteDataFromCache } from '../helpers/quote-session-cache/index.js'
import { getWasteWaterTreatmentWorks } from '../../common/services/waste-water-treatment-works.js'

const cacheKey = 'nearbyWasteWaterOptions'
const iDontKnowValue = 'i-dont-know'

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
    const formSubmitData = {
      ...quoteData,
      wasteWaterTreatmentWorksId:
        quoteData?.wasteWaterTreatmentWorksId === null
          ? iDontKnowValue
          : quoteData?.wasteWaterTreatmentWorksId
    }
    const viewModel = {
      ...baseViewModel,
      formSubmitData,
      validationErrors
    }
    return h.view(`quote/${routeId}/index`, viewModel)
  }
})
