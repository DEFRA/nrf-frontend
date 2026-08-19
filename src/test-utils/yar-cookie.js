import { config } from '../config/config.js'

/**
 * Extracts the encrypted session cookie value from a response, so it can be
 * carried into subsequent server.inject requests. Returns an empty string when
 * the response sets no session cookie.
 * @param {import('@hapi/hapi').Response} response - Hapi injected response
 */
export function getYarCookie(response) {
  const yarCookieName = config.get('session.cache.name')

  return (
    response.headers['set-cookie']
      ?.find((cookieHeader) => cookieHeader.startsWith(`${yarCookieName}=`))
      ?.split(';')[0] ?? ''
  )
}
