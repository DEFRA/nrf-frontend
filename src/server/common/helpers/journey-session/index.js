import { manageSession } from '../../../manage/helpers/manage-session/index.js'
import { clearValidationFlashFromCache } from '../form-validation-session/index.js'
import { retrieveQuoteSession } from '../../../request-to-use/helpers/retrieve-quote-session/index.js'
import {
  clearQuoteDataFromCache,
  getQuoteDataFromCache,
  initQuoteSession
} from '../../../quote/helpers/quote-session-cache/index.js'

// Written by magic link redemption (NRF2-1256), which is not built yet; cleared
// here so it never outlives a restart or a switch of journey.
const requestToUseKey = 'requestToUse'

// Quote journey state the upload controllers keep outside the quote key.
const quoteUploadKeys = [
  'boundaryFailureReason',
  'boundaryGeojson',
  'pendingUploadId',
  'pendingUploadUrl',
  'uploadRejectionReason'
]

export const journeys = {
  quote: 'quote',
  requestToUse: 'request-to-use'
}

/**
 * @param {object} params
 * @param {import('@hapi/hapi').Request} params.request
 * @param {string} params.journey - one of journeys
 * @returns {boolean} whether the user chose this journey on the what would you like to do page
 */
export const isJourneySelected = ({ request, journey }) =>
  manageSession.get(request)?.whatWouldYouLikeToDo === journey

/**
 * @param {import('@hapi/hapi').Request} request
 */
const clearQuoteJourneyData = (request) => {
  clearQuoteDataFromCache(request)
  for (const key of quoteUploadKeys) {
    request.yar.clear(key)
  }
}

/**
 * Clears everything a journey stores except the what would you like to do
 * answer, which is only cleared when the user starts again.
 * @param {import('@hapi/hapi').Request} request
 */
export const clearJourneySessions = (request) => {
  clearQuoteJourneyData(request)
  retrieveQuoteSession.clear(request)
  request.yar.clear(requestToUseKey)
}

/**
 * Clears everything the user has entered, including the what would you like
 * to do answer and any validation flash. Used when the user starts again.
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
  clearQuoteJourneyData(request)
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
