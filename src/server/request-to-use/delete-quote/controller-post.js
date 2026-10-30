import { referenceParam } from '@defra/nrf-library'
import { deleteRequestToBackend } from '../../common/services/nrf-backend.js'
import { clearJourneySessions } from '../../common/helpers/journey-session/index.js'
import { statusCodes } from '../../common/constants/status-codes.js'
import { isQuoteDataComplete } from '../../quote/helpers/quote-session-cache/index.js'
import { requestToUseSession } from '../helpers/request-to-use-session/index.js'
import { routePath as startPath } from '../../manage/start-page/route-path.js'
import getNextPage from './get-next-page.js'

/**
 * The delete is only honoured when the session still carries what magic link
 * redemption established: the quote's reference and the complete quote it
 * seeded. Anything else — a stale or missing session, a double submit after
 * the session was cleared — is sent back to the start page without calling
 * the backend.
 * @param {import('@hapi/hapi').Request} request
 * @param {string | undefined} reference - the session's NRL reference
 * @returns {boolean}
 */
const hasRedeemedQuoteInSession = (request, reference) =>
  referenceParam.validate(reference).error === undefined &&
  isQuoteDataComplete(request)

export const deleteQuotePostController = {
  async handler(request, h) {
    const reference = requestToUseSession.get(request)?.nrlReference

    if (!hasRedeemedQuoteInSession(request, reference)) {
      return h.redirect(startPath).code(statusCodes.redirectAfterPost)
    }

    // Delete before clearing anything: when the delete fails the session
    // survives untouched and the error page renders, so the user can retry
    await deleteRequestToBackend({ endpointPath: `/quotes/${reference}` })
    clearJourneySessions(request)
    return h.redirect(getNextPage()).code(statusCodes.redirectAfterPost)
  }
}
