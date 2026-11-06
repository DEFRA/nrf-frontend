import { http, HttpResponse } from 'msw'
import Jwt from '@hapi/jwt'

import { config } from '../config/config.js'
import { mockUser } from './fixtures/mock-user.js'

const SIGNING_SECRET = 'test-signing-secret-not-for-production'

/**
 * MSW handlers that let a test server complete a Defra ID sign-in: the OIDC
 * well-known document and the token endpoint.
 * @param {Object} [options]
 * @param {() => object} [options.getClaims] - Returns the claims the token endpoint issues, read on each request so tests can override them
 * @returns {import('msw').RequestHandler[]}
 */
export function defraIdSignInHandlers({ getClaims = () => mockUser } = {}) {
  const defraIdBaseUrl = config.get('defraId.baseUrl')
  const wellKnownUrl = new URL(
    config.get('defraId.wellKnownPath'),
    defraIdBaseUrl
  ).toString()
  const tokenUrl = `${defraIdBaseUrl}/token`

  return [
    http.get(wellKnownUrl, () =>
      HttpResponse.json({
        issuer: defraIdBaseUrl,
        authorization_endpoint: `${defraIdBaseUrl}/authorize`,
        token_endpoint: tokenUrl
      })
    ),
    http.post(tokenUrl, () => {
      const exp = Math.floor(Date.now() / 1000) + 3600
      const token = Jwt.token.generate(
        { ...getClaims(), exp },
        { key: SIGNING_SECRET }
      )
      return HttpResponse.json({
        access_token: token,
        refresh_token: 'test-refresh-token',
        id_token: token,
        expires_in: 3600
      })
    })
  ]
}
