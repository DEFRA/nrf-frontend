import { getOidcConfig } from './get-oidc-config.js'
import { config } from '../../config/config.js'
import { RETURN_PATH } from './auth-urls.js'
import { buildFrontendUrl } from '../common/helpers/build-frontend-url.js'
import { createLogger } from '../common/helpers/logging/logger.js'

const logger = createLogger()

/**
 * Refreshes access and refresh tokens using OAuth 2.0 refresh token grant
 * @param {string} refreshToken - The refresh token to exchange
 * @returns {Promise<Object>} New tokens: { access_token, refresh_token, ... }
 */
export async function refreshTokens(refreshToken) {
  const { token_endpoint: url } = await getOidcConfig(logger)

  const params = new URLSearchParams()
  params.set('client_id', config.get('defraId.clientId'))
  params.set('client_secret', config.get('defraId.clientSecret'))
  params.set('grant_type', 'refresh_token')
  params.set('scope', `openid offline_access ${config.get('defraId.clientId')}`)
  params.set('refresh_token', refreshToken)
  params.set('redirect_uri', buildFrontendUrl(RETURN_PATH))

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: params.toString()
  })

  if (!res.ok) {
    throw new Error(`Token endpoint returned ${res.status} ${res.statusText}`)
  }

  return res.json()
}
