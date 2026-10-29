import { withValidQuoteSession } from './with-valid-quote-session.js'
import { routePath as uploadBoundaryPath } from '../server/quote/upload-boundary/route-path.js'

/**
 * Prime a session and visit an upload page so a CDP Uploader session is
 * minted and the pending upload id is stored against the session, exactly as
 * a real user would. Returns the combined session cookie.
 * @param {object} params
 * @param {object} params.server
 * @param {string} [params.uploadPagePath] - the upload page to visit
 *   (default: the quote journey's)
 * @param {(server: object) => Promise<string>} [params.primeSession] - how the
 *   session is primed before the visit (default: the quote journey's answers)
 */
export async function primeUploadSession({
  server,
  uploadPagePath = uploadBoundaryPath,
  primeSession = withValidQuoteSession
}) {
  const cookie = await primeSession(server)
  const uploadPage = await server.inject({
    method: 'GET',
    url: uploadPagePath,
    headers: { cookie }
  })
  return []
    .concat(uploadPage.headers['set-cookie'] ?? cookie)
    .map((c) => c.split(';')[0])
    .join('; ')
}
