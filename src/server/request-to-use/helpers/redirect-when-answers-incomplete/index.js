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
 * start again. The error a failed submit left is cleared first, as the review
 * page replaces the form that would have shown it. Nothing is rendered.
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

  clearValidationFlashFromCache(request)

  return h.redirect(reviewQuoteDetailsPath).code(statusCodes.found).takeover()
}
