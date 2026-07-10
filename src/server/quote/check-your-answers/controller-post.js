import { statusCodes } from '../../common/constants/status-codes.js'
import { postRequestToBackend } from '../../common/services/nrf-backend.js'
import { routePath as routePathConfirmation } from '../confirmation/routes.js'
import {
  clearQuoteDataFromCache,
  getCompleteQuoteDataFromCache
} from '../helpers/quote-session-cache/index.js'
import { isAnalyticsDisabled } from '../../cookies/helpers/cookie-service.js'

export const quoteSubmitController = {
  async handler(request, h) {
    const { isHousing, ...quoteData } = getCompleteQuoteDataFromCache(request)
    if (isAnalyticsDisabled(request)) {
      quoteData.disableAnalyticsAudit = true
    }
    const response = await postRequestToBackend({
      endpointPath: '/quotes',
      payload: quoteData
    })
    clearQuoteDataFromCache(request)
    const nrfReference = response.payload.reference
    return h
      .redirect(`${routePathConfirmation}?reference=${nrfReference}`)
      .code(statusCodes.redirectAfterPost)
  }
}
