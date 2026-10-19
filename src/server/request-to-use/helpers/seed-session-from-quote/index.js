import {
  clearAllSessionData,
  journeys
} from '../../../common/helpers/journey-session/index.js'
import { manageSession } from '../../../manage/helpers/manage-session/index.js'
import { saveQuoteDataToCache } from '../../../quote/helpers/quote-session-cache/index.js'
import { requestToUseSession } from '../request-to-use-session/index.js'

/**
 * Maps a quote record from the backend to the quote journey's session shape.
 * isHousing is not stored in the database: a saved quote can only exist for a
 * housing development.
 * @param {object} quote - quote record from the backend
 * @returns {object} quote session data, without the boundary geojson
 */
const toQuoteSessionData = (quote) => ({
  planningType: quote.planningType,
  housingUnits: quote.housingUnits,
  email: quote.email.address,
  isHousing: 'yes',
  boundaryEntryType: quote.boundary.userInputType,
  boundaryFilename: quote.boundary.filename
})

/**
 * Starts a fresh request to use session from a saved quote: clears everything
 * the user had, selects the request to use journey, fills the quote answers
 * from the record and keeps the NRL reference, which belongs to the request
 * rather than the quote answers.
 * @param {object} params
 * @param {import('@hapi/hapi').Request} params.request
 * @param {object} params.quote - quote record from the backend
 */
export const seedSessionFromQuote = ({ request, quote }) => {
  clearAllSessionData(request)
  manageSession.save(request, { whatWouldYouLikeToDo: journeys.requestToUse })

  saveQuoteDataToCache(request, toQuoteSessionData(quote))
  // Saved separately: changing the boundary entry type in the call above clears
  // the geojson, so it must be written after the entry type is in place.
  saveQuoteDataToCache(request, {
    boundaryGeojson: JSON.parse(quote.boundary.geoJsonWgs84)
  })

  requestToUseSession.save(request, { nrlReference: quote.reference })
}
