import { createFilePreviewHandlers } from '../../../quote/file-preview/controller.js'
import getFilePreviewViewModel from '../../../quote/file-preview/get-view-model.js'
import { routePath as changeBoundaryTypePath } from '../boundary-type/route-path.js'
import { routePath as changeUploadBoundaryPath } from '../upload-boundary/route-path.js'
import { routePath as reviewQuoteDetailsPath } from '../../review-quote-details/route-path.js'
import { routePath } from './route-path.js'

export { routePath }

/**
 * The alias serves the quote file preview page's own template, so the view
 * model spreads the quote page's and repoints its links at the change alias:
 * retrying the upload, drawing instead, and the back link all stay inside the
 * request to use journey.
 * @param {object} viewModelArgs - the file preview view model arguments
 * @returns {object} view model for the change file preview page
 */
const getViewModel = (viewModelArgs) => ({
  ...getFilePreviewViewModel(viewModelArgs),
  backLinkPath: changeUploadBoundaryPath,
  uploadBoundaryPath: changeUploadBoundaryPath,
  boundaryTypePath: changeBoundaryTypePath
})

const { handler, postHandler } = createFilePreviewHandlers({
  uploadBoundaryPath: changeUploadBoundaryPath,
  successPath: reviewQuoteDetailsPath,
  getViewModel
})

/**
 * @openapi
 * /request-to-use/change/file-preview:
 *   get:
 *     tags:
 *       - RequestToUse
 *     summary: Change boundary file preview page
 *     description: Renders the quote journey's uploaded boundary preview, with retry and draw-instead links pointing into the change alias
 *     responses:
 *       200:
 *         description: HTML preview page
 *         content:
 *           text/html:
 *             schema:
 *               type: string
 *   post:
 *     tags:
 *       - RequestToUse
 *     summary: Accept a changed boundary
 *     description: Saves the previewed boundary to the quote session and redirects to the review and amend page, or to the eligibility outcome page
 *     responses:
 *       303:
 *         description: Redirect to the review and amend page, or to the excluded area or no EDP page
 */
export default [
  {
    method: 'GET',
    path: routePath,
    handler
  },
  {
    method: 'POST',
    path: routePath,
    handler: postHandler
  }
]
