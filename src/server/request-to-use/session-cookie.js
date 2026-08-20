import { config } from '../../config/config.js'

export const REQUEST_TO_USE_SESSION_COOKIE = 'request_to_use_session'

const cookiePath = (reference) => `/quote/${reference}`

/**
 * Registers the quote details access session cookie.
 *
 * Distinct from the in-journey quote session (Yar, see quote-session-cache):
 * this cookie governs viewing a quote via a magic link. Iron-encoded (signed +
 * encrypted), httpOnly, SameSite=Lax, 30-minute ttl. Its presence proves a
 * valid token was redeemed for a given quote reference, so a refresh within
 * the window doesn't consume a session.
 *
 * The path is set per-reference at write time (see setRequestToUseSessionCookie)
 * so the browser only sends the cookie back on that quote's own viewing route,
 * not on journey pages or other quotes' links.
 */
export const registerRequestToUseSessionCookie = (server) => {
  const cookie = config.get('quoteDetailsSession.cookie')

  server.state(REQUEST_TO_USE_SESSION_COOKIE, {
    ttl: cookie.ttl,
    isHttpOnly: true,
    isSecure: cookie.secure,
    isSameSite: 'Lax',
    path: '/quote',
    encoding: 'iron',
    password: cookie.password,
    clearInvalid: true
  })
}

/**
 * @param {object} params
 * @param {import('@hapi/hapi').ResponseToolkit} params.h
 * @param {string} params.reference
 */
export const setRequestToUseSessionCookie = ({ h, reference }) =>
  h.state(
    REQUEST_TO_USE_SESSION_COOKIE,
    { reference, issuedAt: Date.now() },
    { path: cookiePath(reference) }
  )

/**
 * Returns true when the request carries a valid session cookie for this quote.
 *
 * @param {object} params
 * @param {import('@hapi/hapi').Request} params.request
 * @param {string} params.reference
 */
export const hasRequestToUseSessionCookie = ({ request, reference }) =>
  request.state?.[REQUEST_TO_USE_SESSION_COOKIE]?.reference === reference
