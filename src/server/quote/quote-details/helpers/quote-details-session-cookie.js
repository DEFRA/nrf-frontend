import { config } from '../../../../config/config.js'

export const QUOTE_DETAILS_SESSION_COOKIE = 'quote_details_session'

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
 * The path is set per-reference at write time (see setQuoteDetailsSessionCookie)
 * so the browser only sends the cookie back on that quote's own viewing route,
 * not on journey pages or other quotes' links.
 */
export const registerQuoteDetailsSessionCookie = (server) => {
  const cookie = config.get('quoteDetailsSession.cookie')

  server.state(QUOTE_DETAILS_SESSION_COOKIE, {
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
export const setQuoteDetailsSessionCookie = ({ h, reference }) =>
  h.state(
    QUOTE_DETAILS_SESSION_COOKIE,
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
export const hasQuoteDetailsSessionCookie = ({ request, reference }) =>
  request.state?.[QUOTE_DETAILS_SESSION_COOKIE]?.reference === reference
