import { withValidQuoteSession } from './with-valid-quote-session.js'
import { routePath as uploadBoundaryPath } from '../server/quote/upload-boundary/routes.js'

/**
 * Prime a quote session and visit the upload page so a CDP Uploader session
 * is minted and the pending upload id is stored against the session, exactly
 * as a real user would. Returns the combined session cookie.
 * @param {object} server
 */
export async function primeUploadSession(server) {
  const cookie = await withValidQuoteSession(server)
  const uploadPage = await server.inject({
    method: 'GET',
    url: uploadBoundaryPath,
    headers: { cookie }
  })
  return []
    .concat(uploadPage.headers['set-cookie'] ?? cookie)
    .map((c) => c.split(';')[0])
    .join('; ')
}
