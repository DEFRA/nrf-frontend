import Boom from '@hapi/boom'
import { clearValidationFlashFromCache } from '../../common/helpers/form-validation-session/index.js'
import { areRequiredAnswersComplete } from '../helpers/are-required-answers-complete/index.js'
import {
  getAddressForCurrentAccount,
  requestToUseSession
} from '../helpers/request-to-use-session/index.js'

/**
 * Fails an incomplete request with the incomplete answers error page rather
 * than letting it reach the view or the submit controller.
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
    throw Boom.badRequest()
  }

  return h.continue
}
