import { quoteController } from '../../../quote/controller-get.js'
import { createPostController } from '../../../common/controllers/post-controller.js'
import getBoundaryTypeViewModel from '../../../quote/boundary-type/get-view-model.js'
import formValidation from '../../../quote/boundary-type/form-validation.js'
import getNextPage from '../../../quote/boundary-type/get-next-page.js'
import {
  saveQuoteDataToCache,
  getQuoteDataFromCache
} from '../../../quote/helpers/quote-session-cache/index.js'
import { routePath as quoteDrawBoundaryPath } from '../../../quote/draw-boundary/route-path.js'
import { routePath as quoteUploadBoundaryPath } from '../../../quote/upload-boundary/route-path.js'
import { routePath as changeDrawBoundaryPath } from '../draw-boundary/route-path.js'
import { routePath as changeUploadBoundaryPath } from '../upload-boundary/route-path.js'
import { routePath as changeFilePreviewPath } from '../file-preview/route-path.js'
import { routePath as reviewQuoteDetailsPath } from '../../review-quote-details/route-path.js'
import { routePath } from './route-path.js'

export { routePath }

// The quote journey's next step after choosing how to give a boundary, mapped
// to the same step inside the change alias.
const changePathByQuotePath = new Map([
  [quoteDrawBoundaryPath, changeDrawBoundaryPath],
  [quoteUploadBoundaryPath, changeUploadBoundaryPath]
])

/**
 * The alias serves the quote question page's own template, so the view model
 * spreads the quote page's and only swaps the back link: an edit from the
 * review page returns there, not to the quote journey's previous page.
 * @param {object} quoteData - the quote session data
 * @param {object} query - the parsed request query
 * @returns {object} view model for the change boundary type page
 */
const getViewModel = (quoteData, query) => ({
  ...getBoundaryTypeViewModel(quoteData, query),
  backLinkPath: reviewQuoteDetailsPath
})

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
const resolveRedirect = ({ nextPage, request }) => {
  if (
    nextPage === quoteUploadBoundaryPath &&
    getQuoteDataFromCache(request)?.boundaryFilename
  ) {
    return changeFilePreviewPath
  }

  return changePathByQuotePath.get(nextPage) ?? reviewQuoteDetailsPath
}

/**
 * Saves the entry type without the quote journey's rule that a changed entry
 * type clears the boundary: in the change flow, browsing between drawing and
 * uploading must not discard the saved boundary — only a newly drawn or
 * uploaded boundary replaces it.
 * @param {import('@hapi/hapi').Request} request
 * @param {object} payload - the validated payload
 * @returns {object} the merged quote session data
 */
const saveBoundaryEntryTypeToCache = (request, payload) => {
  const savedBoundary = getQuoteDataFromCache(request)?.boundaryGeojson ?? null
  const sessionData = saveQuoteDataToCache(request, payload)

  if (savedBoundary && sessionData.boundaryGeojson === null) {
    return saveQuoteDataToCache(request, { boundaryGeojson: savedBoundary })
  }

  return sessionData
}

/**
 * @openapi
 * /request-to-use/change/boundary-type:
 *   get:
 *     tags:
 *       - RequestToUse
 *     summary: Change boundary type page
 *     description: Renders the quote journey's boundary entry type form to edit the answer from the review and amend your quote details page
 *     responses:
 *       200:
 *         description: HTML form page
 *         content:
 *           text/html:
 *             schema:
 *               type: string
 *   post:
 *     tags:
 *       - RequestToUse
 *     summary: Submit a changed boundary type
 *     requestBody:
 *       required: true
 *       content:
 *         application/x-www-form-urlencoded:
 *           schema:
 *             type: object
 *             required:
 *               - boundaryEntryType
 *             properties:
 *               boundaryEntryType:
 *                 type: string
 *                 enum:
 *                   - draw
 *                   - upload
 *     responses:
 *       303:
 *         description: Redirect to the change draw boundary or change upload boundary page on success, or back to the form on validation failure
 */
export default [
  {
    method: 'GET',
    path: routePath,
    // The routeId is the quote page's template dir: this route renders the
    // quote question page itself under the request to use prefix.
    ...quoteController({ routeId: 'boundary-type', getViewModel })
  },
  {
    method: 'POST',
    path: routePath,
    ...createPostController({
      formValidation,
      getNextPage,
      saveToSession: saveBoundaryEntryTypeToCache,
      resolveRedirect
    })
  }
]
