import { requestToUseSession } from '../server/request-to-use/helpers/request-to-use-session/index.js'

/**
 * Registers an onPostHandler on the test server that records the request to use
 * session after every request that reaches its handler. The returned reader
 * gives the session as it stood after the most recent such request, or null
 * when there is none, so a test can assert on answers no page shows. It is
 * not updated by a response taken over before the handler (sign-in redirects,
 * session guards) or by an error.
 * @param {import('@hapi/hapi').Server} server
 * @returns {() => object | null} reader for the last session seen
 */
export function observeRequestToUseSession(server) {
  let session = null
  server.ext('onPostHandler', function recordSession(request, h) {
    session = requestToUseSession.get(request)
    return h.continue
  })
  return () => session
}
