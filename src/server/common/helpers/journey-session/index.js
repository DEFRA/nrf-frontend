import { manageSession } from '../../../manage/helpers/manage-session/index.js'
import { clearValidationFlashFromCache } from '../form-validation-session/index.js'
import { retrieveQuoteSession } from '../../../request-to-use/helpers/retrieve-quote-session/index.js'
import {
  clearQuoteDataFromCache,
  getQuoteDataFromCache,
  initQuoteSession
} from '../../../quote/helpers/quote-session-cache/index.js'

const requestToUseKey = 'requestToUse'

export const journeys = {
  quote: 'quote',
  requestToUse: 'request-to-use'
}

/**
 * Clears everything a journey stores except the what would you like to do
 * answer, which is only cleared when the user starts again or cancels.
 * @param {import('@hapi/hapi').Request} request
 */
export const clearJourneySessions = (request) => {
  clearQuoteDataFromCache(request)
  retrieveQuoteSession.clear(request)
  request.yar.clear(requestToUseKey)
}

/**
 * Clears everything the user has entered, including the what would you like
 * to do answer and any validation flash. Used when the user starts again or
 * cancels.
 * @param {import('@hapi/hapi').Request} request
 */
export const clearAllSessionData = (request) => {
  clearJourneySessions(request)
  manageSession.clear(request)
  clearValidationFlashFromCache(request)
}

/**
 * @param {import('@hapi/hapi').Request} request
 */
const initialiseQuote = (request) => {
  if (getQuoteDataFromCache(request) === null) {
    initQuoteSession(request)
  }
  retrieveQuoteSession.clear(request)
  request.yar.clear(requestToUseKey)
}

/**
 * @param {import('@hapi/hapi').Request} request
 */
const initialiseRetrieveQuote = (request) => {
  if (retrieveQuoteSession.get(request) === null) {
    retrieveQuoteSession.init(request)
  }
  clearQuoteDataFromCache(request)
  request.yar.clear(requestToUseKey)
}

/**
 * Records the chosen journey and switches session state to it: the chosen
 * journey's data is kept (or created if missing) and the other journey's data
 * is cleared.
 * @param {object} params
 * @param {import('@hapi/hapi').Request} params.request
 * @param {string} params.journey - one of journeys
 * @returns {object | null} the saved what would you like to do data
 */
export const selectJourney = ({ request, journey }) => {
  const manageData = manageSession.save(request, {
    whatWouldYouLikeToDo: journey
  })
  if (journey === journeys.quote) {
    initialiseQuote(request)
  } else {
    initialiseRetrieveQuote(request)
  }
  return manageData
}
