import Boom from '@hapi/boom'
import { clearValidationFlashFromCache } from '../../common/helpers/form-validation-session/index.js'
import { areRequiredAnswersComplete } from '../helpers/are-required-answers-complete/index.js'
import {
  getAddressForCurrentAccount,
  requestToUseSession
} from '../helpers/request-to-use-session/index.js'
import { routePath as reviewQuoteDetailsPath } from '../review-quote-details/route-path.js'

/**
 * Fails an incomplete request with the incomplete answers error page rather
 * than letting it reach the view or the submit controller. The shared error
 * handler renders `data.completeDetailsPath` as that page's link.
 * @type {import('@hapi/hapi').Lifecycle.Method}
 */
export const requireCompleteAnswers = (request, h) => {
  const complete = areRequiredAnswersComplete({
    requestToUse: requestToUseSession.get(request),
    address: getAddressForCurrentAccount(request)
  })

  if (!complete) {
    // An unticked submit saves its error for this page to show on redirect,
    // but the error page replaces it
    clearValidationFlashFromCache(request)
    throw Boom.badRequest('Request to use answers are incomplete', {
      completeDetailsPath: reviewQuoteDetailsPath
    })
  }

  return h.continue
}
