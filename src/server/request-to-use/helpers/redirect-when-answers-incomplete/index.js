import { statusCodes } from '../../../common/constants/status-codes.js'
import { clearValidationFlashFromCache } from '../../../common/helpers/form-validation-session/index.js'
import { routePath as reviewQuoteDetailsPath } from '../../review-quote-details/route-path.js'
import { areRequiredAnswersComplete } from '../are-required-answers-complete/index.js'
import {
  getAddressForCurrentAccount,
  requestToUseSession
} from '../request-to-use-session/index.js'

/**
 * Sends a signed-in visitor whose earlier request to use answers are
 * incomplete back to the review and amend page, where the steps after it
 * start again. Nothing is rendered or saved.
 * @param {import('@hapi/hapi').Request} request
 * @param {import('@hapi/hapi').ResponseToolkit} h
 * @returns {import('@hapi/hapi').Lifecycle.ReturnValue} continue, or a redirect to the review and amend page
 */
export function redirectWhenAnswersIncomplete(request, h) {
  const complete = areRequiredAnswersComplete({
    requestToUse: requestToUseSession.get(request),
    address: getAddressForCurrentAccount(request)
  })

  if (complete) {
    return h.continue
  }

  // A failed submit saves its error for a form page to show when its redirect
  // is followed, but the review page replaces that page
  clearValidationFlashFromCache(request)

  return h.redirect(reviewQuoteDetailsPath).code(statusCodes.found).takeover()
}
