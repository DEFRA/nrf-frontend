import Wreck from '@hapi/wreck'
import { getOidcConfig } from './get-oidc-config.js'
import { config } from '../../config/config.js'

/**
 * Refreshes access and refresh tokens using OAuth 2.0 refresh token grant
 * @param {string} refreshToken - The refresh token to exchange
 * @returns {Promise<Object>} New tokens: { access_token, refresh_token, ... }
 */
export async function refreshTokens(refreshToken) {
  const { token_endpoint: url } = await getOidcConfig()

  const query = [
    `client_id=${config.get('defraId.clientId')}`,
    `client_secret=${config.get('defraId.clientSecret')}`,
    'grant_type=refresh_token',
    `scope=openid offline_access ${config.get('defraId.clientId')}`,
    `refresh_token=${refreshToken}`,
    `redirect_uri=${config.get('defraId.redirectUrl')}`
  ].join('&')

  const { payload } = await Wreck.post(`${url}?${query}`, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    json: true
  })

  return payload
}
