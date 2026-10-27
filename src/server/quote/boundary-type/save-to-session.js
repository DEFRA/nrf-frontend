import {
  saveQuoteDataToCache,
  getQuoteDataFromCache
} from '../helpers/quote-session-cache/index.js'

/**
 * Saves the entry type without the rule that a changed entry type clears the
 * boundary: browsing between drawing and uploading must not discard the saved
 * boundary — only a newly drawn or uploaded boundary replaces it. Shared by
 * the quote journey and the request to use change alias.
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
