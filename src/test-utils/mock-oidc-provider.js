import http from 'node:http'
import Jwt from '@hapi/jwt'

import { mockUser } from './fixtures/mock-user.js'

const WELL_KNOWN_PATH = '/.well-known/openid-configuration'
const TOKEN_PATH = '/token'
const SIGNING_SECRET = 'test-signing-secret-not-for-production'

/**
 * Starts an in-process stand-in for the DEFRA Identity OIDC provider, sufficient
 * to register the auth plugin and complete a full sign-in round trip in tests.
 * Serves an OpenID Connect discovery document and issues JWT access/id tokens
 * for any authorization code presented to its token endpoint.
 */
export async function startMockOidcProvider() {
  const server = http.createServer((req, res) => {
    if (req.method === 'GET' && req.url === WELL_KNOWN_PATH) {
      const base = `http://${req.headers.host}`
      res.writeHead(200, { 'content-type': 'application/json' })
      res.end(
        JSON.stringify({
          issuer: base,
          authorization_endpoint: `${base}/authorize`,
          token_endpoint: `${base}${TOKEN_PATH}`
        })
      )
      return
    }

    if (req.method === 'POST' && req.url === TOKEN_PATH) {
      const exp = Math.floor(Date.now() / 1000) + 3600
      const token = Jwt.token.generate(
        { ...mockUser, exp },
        { key: SIGNING_SECRET }
      )
      req.resume()
      req.on('end', () => {
        res.writeHead(200, { 'content-type': 'application/json' })
        res.end(
          JSON.stringify({
            access_token: token,
            refresh_token: 'test-refresh-token',
            id_token: token,
            expires_in: 3600
          })
        )
      })
      return
    }

    res.writeHead(404, { 'content-type': 'application/json' })
    res.end(JSON.stringify({ error: 'not_found' }))
  })

  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
  const { port } = server.address()

  return {
    baseUrl: `http://127.0.0.1:${port}`,
    wellKnownUrl: `http://127.0.0.1:${port}${WELL_KNOWN_PATH}`,
    stop: () => new Promise((resolve) => server.close(resolve))
  }
}
