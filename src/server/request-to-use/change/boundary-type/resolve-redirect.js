import { routePath as quoteDrawBoundaryPath } from '../../../quote/draw-boundary/route-path.js'
import { routePath as quoteUploadBoundaryPath } from '../../../quote/upload-boundary/route-path.js'
import { routePath as changeDrawBoundaryPath } from '../draw-boundary/route-path.js'
import { routePath as changeUploadBoundaryPath } from '../upload-boundary/route-path.js'
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
 * check, preview) stays inside the request to use journey. Choosing upload
 * always opens the upload page — even when the quote was made by uploading a
 * file — because the preview page's "Upload a new file or draw on a map" link
 * sends the user back through here, and shortcutting them to the existing
 * file's preview would make uploading a different file impossible.
 * @param {{ nextPage: string }} params
 * @returns {string} redirect path
 */
export default function resolveRedirect({ nextPage }) {
  return changePathByQuotePath.get(nextPage) ?? reviewQuoteDetailsPath
}
