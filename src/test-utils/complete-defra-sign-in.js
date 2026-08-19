import { getYarCookie } from './yar-cookie.js'

/**
 * Completes a mocked DEFRA ID sign-in against a running test server: starts the
 * OAuth flow, then drives the provider callback with a fresh authorization code.
 * @param {Object} options
 * @param {import('@hapi/hapi').Server} options.server - Initialised Hapi server
 * @param {string} [options.cookie] - Existing session cookie (e.g. one that already
 *   holds the requested return path) to carry through the flow
 * @returns {Promise<{response: import('@hapi/hapi').Response, cookie: string}>} The
 *   /login/return response and the session cookie to use for subsequent requests
 */
export async function completeDefraSignIn({ server, cookie }) {
  const signIn = await server.inject({
    method: 'GET',
    url: '/auth/sign-in',
    headers: cookie ? { cookie } : {}
  })
  const state = new URL(signIn.headers.location).searchParams.get('state')

  const response = await server.inject({
    method: 'GET',
    url: `/login/return?code=test-auth-code&state=${encodeURIComponent(state)}`,
    headers: { cookie: getYarCookie(signIn) }
  })

  return { response, cookie: getYarCookie(response) }
}
