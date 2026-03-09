import { statusCodes } from '../../common/constants/status-codes.js'
import { getQuoteDataFromCache } from '../session-cache.js'
import { postRequestToBackend } from '../../common/services/nrf-backend.js'

export const quoteSubmitController = {
  async handler(request, h) {
    const quoteData = getQuoteDataFromCache(request)
    const response = await postRequestToBackend({
      endpointPath: '/quote',
      payload: { emailAddress: quoteData.email }
    })
    const nextPage = `/quote/next?reference=${response.payload.reference}`
    return h.redirect(nextPage).code(statusCodes.redirectAfterPost)
  }
}
