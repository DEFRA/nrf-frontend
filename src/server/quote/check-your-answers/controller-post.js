import { statusCodes } from '../../common/constants/status-codes.js'
import {
  getQuoteDataFromCache,
  saveQuoteDataToCache
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
    const nrfReference = response.payload.reference
    saveQuoteDataToCache(request, { nrfReference })
    return h
      .redirect(`${routePathConfirmation}?reference=${nrfReference}`)
      .code(statusCodes.redirectAfterPost)
  }
}
