import { statusCodes } from '../../common/constants/status-codes.js'
import { recalculateLevy } from '../../common/services/nrf-impact-assessor.js'
import { getQuoteDataFromCache } from '../../quote/helpers/quote-session-cache/index.js'
import { routePath as acceptLevyPath } from '../accept-levy/route-path.js'
import { requestToUseSession } from '../helpers/request-to-use-session/index.js'

// en-CA formats as YYYY-MM-DD. The UK calendar day is used so a user continuing
// just after midnight BST is not priced against yesterday's charge.
const getTodayInUk = () =>
  new Date().toLocaleDateString('en-CA', { timeZone: 'Europe/London' })

export const reviewQuoteDetailsPostController = {
  async handler(request, h) {
    const levy = await recalculateLevy({
      units: getQuoteDataFromCache(request)?.housingUnits,
      requestDate: getTodayInUk()
    })
    requestToUseSession.save(request, { levy })

    return h.redirect(acceptLevyPath).code(statusCodes.redirectAfterPost)
  }
}
