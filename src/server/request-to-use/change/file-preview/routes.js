import { createFilePreviewHandlers } from '../../../quote/file-preview/controller.js'
import { routePath as changeUploadBoundaryPath } from '../upload-boundary/route-path.js'
import { routePath as reviewQuoteDetailsPath } from '../../review-quote-details/route-path.js'
import getViewModel from './get-view-model.js'
import { routePath } from './route-path.js'

export { routePath }

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
