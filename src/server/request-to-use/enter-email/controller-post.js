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

    // Saved after any clear so the email confirmation page can show the
    // address the link was sent to; when no quote matched it also re-displays
    // on the email page from the dropout page's back link.
    retrieveQuoteSession.save(request, { email })

    return h
      .redirect(getNextPage(quoteMatched))
      .code(statusCodes.redirectAfterPost)
  }
}
