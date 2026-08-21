import { statusCodes } from '../common/constants/status-codes.js'
import { saveToSessionCache } from './session-cache.js'

export const requestToUsePostController = ({
  getNextPage,
  payloadOptions
}) => ({
  options: {
    ...(payloadOptions && { payload: payloadOptions })
  },
  handler(request, h) {
    const { payload } = request
    const quoteData = saveToSessionCache(request, payload)
    const nextPage = getNextPage(quoteData)
    return h.redirect(nextPage).code(statusCodes.redirectAfterPost)
  }
})
