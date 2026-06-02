import { config } from '../../../config/config.js'

export const QUOTE_DETAILS_SESSION_COOKIE = 'quote_details_session'

/**
 * Registers the quote details access session cookie (tech spec §4.2).
 *
 * Distinct from the in-journey quote session (Yar, see quote-session-cache):
 * this cookie governs viewing a quote via a magic link. Iron-encoded (signed +
 * encrypted), httpOnly, SameSite=Lax, scoped to /quote, 30-minute ttl. Its
 * presence proves a valid token was redeemed for a given quote reference, so a
 * refresh within the window doesn't consume a session.
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
  h.state(QUOTE_DETAILS_SESSION_COOKIE, { reference, issuedAt: Date.now() })

/**
 * Returns true when the request carries a valid session cookie for this quote.
 *
 * @param {object} params
 * @param {import('@hapi/hapi').Request} params.request
 * @param {string} params.reference
 */
export const hasQuoteDetailsSessionCookie = ({ request, reference }) =>
  request.state?.[QUOTE_DETAILS_SESSION_COOKIE]?.reference === reference
