import {
  saveQuoteDataToCache,
  getQuoteDataFromCache
} from '../helpers/quote-session-cache/index.js'

/**
 * Saves the entry type and keeps any saved boundary in place. A changed
 * entry type only takes effect when the new option's page saves a boundary
 * of its own, so the browse-back chain (choose how → upload → back →
 * choose how → draw) still finds the drawn boundary — clearing it here
 * would discard the user's work the moment they looked at the other
 * option. Shared by the quote journey and the request to use change alias.
 * @param {import('@hapi/hapi').Request} request
 * @param {object} payload - the validated payload
 * @returns {object} the merged quote session data
 */
export default function saveBoundaryEntryTypeToCache(request, payload) {
  const savedBoundary = getQuoteDataFromCache(request)?.boundaryGeojson ?? null
  const sessionData = saveQuoteDataToCache(request, payload)

  if (savedBoundary && sessionData.boundaryGeojson === null) {
    return saveQuoteDataToCache(request, { boundaryGeojson: savedBoundary })
  }

  return sessionData
}
