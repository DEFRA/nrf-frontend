import { config } from '../../config/config.js'

/**
 * Fetches OpenID Connect configuration from the well-known endpoint
 * @returns {Promise<Object>} OIDC configuration including authorization_endpoint, token_endpoint, jwks_uri, end_session_endpoint
 */
export async function getOidcConfig(logger) {
  const wellKnownUrl = config.get('defraId.wellKnownUrl')

  if (!wellKnownUrl) {
    throw new Error(
      'DEFRA_ID_WELL_KNOWN_URL not configured. Please set this environment variable.'
    )
  }
  try {
    const res = await fetch(wellKnownUrl)
    return await res.json()
  } catch (err) {
    logger.error(err, `Error fetching defraId.wellKnownUrl ${wellKnownUrl}`)
    throw err
  }
}
