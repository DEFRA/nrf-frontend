import { createUploadBoundaryHandler } from '../../../quote/upload-boundary/controller.js'
import getUploadBoundaryViewModel from '../../../quote/upload-boundary/get-view-model.js'
import { fileUploadRateLimitPre } from '../../../quote/helpers/session-rate-limit/index.js'
import { routePath as changeBoundaryTypePath } from '../boundary-type/route-path.js'
import { routePath as changeCheckingFilePath } from '../checking-file/route-path.js'
import { routePath } from './route-path.js'

export { routePath }

/**
 * The alias serves the quote upload boundary page's own template, so the view
 * model spreads the quote page's and only swaps the back link: an edit from
 * the review page returns to the change boundary type page.
 * @param {object} quoteData - the quote session data
 * @param {object} query - the parsed request query
 * @returns {object} view model for the change upload boundary page
 */
const getViewModel = (quoteData, query) => ({
  ...getUploadBoundaryViewModel(quoteData, query),
  backLinkPath: changeBoundaryTypePath
})

const handler = createUploadBoundaryHandler({
  // Baked into the CDP upload session as the return URL, so the uploader hop
  // comes back inside the change alias.
  checkingFilePath: changeCheckingFilePath,
  getViewModel
})

/**
 * @openapi
 * /request-to-use/change/upload-boundary:
 *   get:
 *     tags:
 *       - RequestToUse
 *     summary: Change boundary by uploading a file page
 *     description: Initiates a CDP upload session and renders the quote journey's upload boundary page to upload a new boundary from the review and amend your quote details page
 *     responses:
 *       200:
 *         description: HTML upload page with upload URL
 *         content:
 *           text/html:
 *             schema:
 *               type: string
 */
export default [
  {
    method: 'GET',
    path: routePath,
    options: {
      // Rate limit on the GET because the controller calls initiateUpload() on
      // every page load — each visit starts a new CDP upload session, so this
      // accurately limits upload initiations rather than passive page views.
      pre: [fileUploadRateLimitPre]
    },
    handler
  }
]
