import {
  saveQuoteDataToCache,
  getQuoteDataFromCache
} from '../../../quote/helpers/quote-session-cache/index.js'

/**
 * Saves the entry type without the quote journey's rule that a changed entry
 * type clears the boundary: in the change flow, browsing between drawing and
 * uploading must not discard the saved boundary — only a newly drawn or
 * uploaded boundary replaces it.
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
