import { createCheckingFileHandler } from '../../../quote/checking-file/controller.js'
import { routePath as changeUploadBoundaryPath } from '../upload-boundary/route-path.js'
import { routePath as changeFilePreviewPath } from '../file-preview/route-path.js'
import { routePath } from './route-path.js'

export { routePath }

/**
 * @openapi
 * /request-to-use/change/checking-file:
 *   get:
 *     tags:
 *       - RequestToUse
 *     summary: Checking uploaded boundary file page
 *     description: Polls upload status and renders the quote journey's checking file page, sending rejected uploads and checked boundaries back into the change alias
 *     responses:
 *       200:
 *         description: HTML upload status page
 *         content:
 *           text/html:
 *             schema:
 *               type: string
 */
export default [
  {
    method: 'GET',
    path: routePath,
    handler: createCheckingFileHandler({
      uploadBoundaryPath: changeUploadBoundaryPath,
      filePreviewPath: changeFilePreviewPath
    })
  }
]
