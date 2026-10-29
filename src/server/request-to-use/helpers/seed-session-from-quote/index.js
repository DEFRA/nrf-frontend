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
  // The quote record stores only the checked geometry (PostGIS ST_AsGeoJSON),
  // so it is nested in the check-response shape the map pages read
  // (boundaryGeometryWgs84) — a redraw then starts from the saved boundary.
  // The file preview reads the intersecting EDPs from the same blob and would
  // otherwise bounce to the not-in-EDP page, so they are rebuilt from the
  // quote's own EDP list in the check response's label shape. Only the
  // metadata stays unset until the boundary is redrawn or re-uploaded.
  saveQuoteDataToCache(request, {
    boundaryGeojson: {
      boundaryGeometryWgs84: JSON.parse(quote.boundary.geoJsonWgs84),
      intersectingEdps: quote.edps.map(({ edpName: label }) => ({ label }))
    }
  })

  requestToUseSession.save(request, { nrlReference: quote.reference })
}
