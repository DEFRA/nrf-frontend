import { statusCodes } from '../../common/constants/status-codes.js'
import {
  clearQuoteDataFromCache,
  getQuoteDataFromCache
} from '../session-cache.js'
import { postRequestToBackend } from '../../common/services/nrf-backend.js'
import { routePath as routePathConfirmation } from '../confirmation/routes.js'

export const quoteSubmitController = {
  async handler(request, h) {
    const quoteData = getQuoteDataFromCache(request)
    const response = await postRequestToBackend({
      endpointPath: '/quote',
      payload: { emailAddress: quoteData.email }
    })
    clearQuoteDataFromCache(request)
    const nrfReference = response.payload.reference
    return h
      .redirect(`${routePathConfirmation}?reference=${nrfReference}`)
      .code(statusCodes.redirectAfterPost)
  }
}
