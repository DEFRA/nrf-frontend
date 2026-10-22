import { routePath as quoteDrawBoundaryPath } from '../../../quote/draw-boundary/route-path.js'
import { routePath as quoteUploadBoundaryPath } from '../../../quote/upload-boundary/route-path.js'
import { routePath as changeDrawBoundaryPath } from '../draw-boundary/route-path.js'
import { routePath as changeUploadBoundaryPath } from '../upload-boundary/route-path.js'
import { routePath as changeFilePreviewPath } from '../file-preview/route-path.js'
import { getQuoteDataFromCache } from '../../../quote/helpers/quote-session-cache/index.js'
import { routePath as reviewQuoteDetailsPath } from '../../review-quote-details/route-path.js'

// The quote journey's next step after choosing how to give a boundary, mapped
// to the same step inside the change alias.
const changePathByQuotePath = new Map([
  [quoteDrawBoundaryPath, changeDrawBoundaryPath],
  [quoteUploadBoundaryPath, changeUploadBoundaryPath]
])

/**
 * A saved edit continues into the matching boundary step of the change alias
 * rather than the quote journey's, so the whole boundary chain (draw, upload,
 * check, preview) stays inside the request to use journey.
 * Re-selecting upload when the quote was made by uploading a file goes
 * straight to that file's preview: the user sees what they already have, and
 * can keep it or follow the preview's links to upload a different file.
 * @param {{ nextPage: string, request: import('@hapi/hapi').Request }} params
 * @returns {string} redirect path
 */
export default function resolveRedirect({ nextPage, request }) {
  if (
    nextPage === quoteUploadBoundaryPath &&
    getQuoteDataFromCache(request)?.boundaryFilename
  ) {
    return changeFilePreviewPath
  }

  return changePathByQuotePath.get(nextPage) ?? reviewQuoteDetailsPath
}
