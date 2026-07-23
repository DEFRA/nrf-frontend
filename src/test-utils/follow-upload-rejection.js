import { loadPage } from './load-page.js'
import { routePath as uploadReceivedPath } from '../server/quote/upload-received/routes.js'
import { routePath as uploadBoundaryPath } from '../server/quote/upload-boundary/routes.js'

/**
 * Visit the upload-received page (which triggers the boundary check and the
 * redirect-with-flash on rejection), then load the upload page the user is
 * redirected back to, returning its document.
 * @param {object} params
 * @param {object} params.server
 * @param {string} params.cookie
 */
export async function followUploadRejection({ server, cookie }) {
  await server.inject({
    method: 'GET',
    url: uploadReceivedPath,
    headers: { cookie }
  })
  return loadPage({ requestUrl: uploadBoundaryPath, server, cookie })
}
