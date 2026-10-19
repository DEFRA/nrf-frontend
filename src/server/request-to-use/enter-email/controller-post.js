import { retrieveQuoteSession } from '../helpers/retrieve-quote-session/index.js'
import { clearJourneySessions } from '../../common/helpers/journey-session/index.js'
import { statusCodes } from '../../common/constants/status-codes.js'
import { requestEmailQuoteLinkFromBackend } from '../../common/services/nrf-backend.js'
import { routePath as startPath } from '../../manage/start-page/route-path.js'
import getNextPage from './get-next-page.js'

export const enterEmailPostController = {
  async handler(request, h) {
    const nrlReference = retrieveQuoteSession.get(request)?.nrlReference
    if (!nrlReference) {
      return h.redirect(startPath).code(statusCodes.redirectAfterPost)
    }

    const { email } = request.payload
    const quoteMatched = await requestEmailQuoteLinkFromBackend({
      nrlReference,
      email
    })

    if (quoteMatched) {
      clearJourneySessions(request)
    }
    // Kept so the confirmation page can show it, and the email page can show it
    // again from the back link on the dropout page.
    retrieveQuoteSession.save(request, { email })

    return h
      .redirect(getNextPage(quoteMatched))
      .code(statusCodes.redirectAfterPost)
  }
}
