import { statusCodes } from '../../common/constants/status-codes.js'
import { recalculateLevy } from '../../common/services/nrf-impact-assessor.js'
import { getBoundaryDropoutPath } from '../../quote/helpers/boundary-dropout/index.js'
import { getQuoteDataFromCache } from '../../quote/helpers/quote-session-cache/index.js'
import { routePath as acceptLevyPath } from '../accept-levy/route-path.js'
import { dropoutPageAliases } from '../helpers/change-answer/index.js'
import { requestToUseSession } from '../helpers/request-to-use-session/index.js'

export const reviewQuoteDetailsPostController = {
  async handler(request, h) {
    const quoteData = getQuoteDataFromCache(request)

    // A boundary dropout saves the ineligible geojson so backing out keeps the
    // edit alive; continuing from the review page must show that dropout again
    // rather than price an ineligible quote. fromSummary links the dropout
    // back to this page instead of the boundary step.
    const dropoutPath = getBoundaryDropoutPath(quoteData)
    if (dropoutPath) {
      return h
        .redirect(`${dropoutPageAliases.get(dropoutPath)}?fromSummary=true`)
        .code(statusCodes.redirectAfterPost)
    }

    const levy = await recalculateLevy({
      units: quoteData?.housingUnits,
      requestDate: new Date().toISOString()
    })
    requestToUseSession.save(request, { levy, acceptLevy: undefined })

    return h.redirect(acceptLevyPath).code(statusCodes.redirectAfterPost)
  }
}
