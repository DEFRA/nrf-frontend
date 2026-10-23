import { statusCodes } from '../../common/constants/status-codes.js'
import { getQuoteDataFromCache } from '../../quote/helpers/quote-session-cache/index.js'
import { getContinueRedirectPath } from './get-continue-redirect-path.js'

export const reviewQuoteContinueController = {
  async handler(request, h) {
    return h
      .redirect(getContinueRedirectPath(getQuoteDataFromCache(request)))
      .code(statusCodes.redirectAfterPost)
  }
}
