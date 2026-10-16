import { retrieveQuoteSession } from '../helpers/retrieve-quote-session/index.js'
import { redirectToFormWithValidationErrors } from '../../common/helpers/redirect-to-form-with-validation-errors.js'
import { clearJourneySessions } from '../../common/helpers/journey-session/index.js'
import { statusCodes } from '../../common/constants/status-codes.js'
import { quoteMatchesEmail } from '../helpers/quote-matches-email/index.js'
import { routePath as startPath } from '../../manage/start-page/route-path.js'
import formValidation from './form-validation.js'
import getNextPage from './get-next-page.js'

export const enterEmailPostController = {
  options: {
    validate: {
      payload: formValidation(),
      failAction: redirectToFormWithValidationErrors
    }
  },
  async handler(request, h) {
    const nrlReference = retrieveQuoteSession.get(request)?.nrlReference
    if (!nrlReference) {
      return h.redirect(startPath).code(statusCodes.redirectAfterPost)
    }

    const { email } = request.payload
    const quoteMatched = await quoteMatchesEmail({ nrlReference, email })

    if (quoteMatched) {
      clearJourneySessions(request)
    } else {
      // Kept so the email page can show it again from the back link on the dropout page.
      retrieveQuoteSession.save(request, { email })
    }

    return h
      .redirect(getNextPage(quoteMatched))
      .code(statusCodes.redirectAfterPost)
  }
}
