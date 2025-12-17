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

  const params = new URLSearchParams()
  params.set('client_id', config.get('defraId.clientId'))
  params.set('client_secret', config.get('defraId.clientSecret'))
  params.set('grant_type', 'refresh_token')
  params.set('scope', `openid offline_access ${config.get('defraId.clientId')}`)
  params.set('refresh_token', refreshToken)
  params.set('redirect_uri', config.get('defraId.redirectUrl'))

  const query = params.toString()

  const { payload } = await Wreck.post(url, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    payload: query,
    json: true
  })

  return payload
}
