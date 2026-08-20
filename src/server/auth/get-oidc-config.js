import { config } from '../../config/config.js'

let cachedConfig

/**
 * Fetches the OpenID Connect discovery document from the well-known endpoint,
 * memoising it in memory. The discovery document is static for a provider, so it
 * is fetched once per process (refreshed on each deploy) rather than on every
 * sign-in. A failed fetch is not cached, so a later call retries.
 * @returns {Promise<Object>} OIDC configuration including authorization_endpoint, token_endpoint, jwks_uri, end_session_endpoint
 */
export async function getOidcConfig(logger) {
  if (cachedConfig) {
    return cachedConfig
  }

  const baseUrl = config.get('defraId.baseUrl')
  const wellKnownPath = config.get('defraId.wellKnownPath')

  if (!baseUrl || !wellKnownPath) {
    throw new Error(
      'DEFRA_ID_BASE_URL and DEFRA_ID_WELL_KNOWN_PATH must be configured. Please set these environment variables.'
    )
  }

  const wellKnownUrl = new URL(wellKnownPath, baseUrl).toString()

  try {
    const res = await fetch(wellKnownUrl)
    cachedConfig = await res.json()
    return cachedConfig
  } catch (err) {
    logger.error(err, `Error fetching OIDC discovery document ${wellKnownUrl}`)
    throw err
  }
}

/**
 * Clears the memoised discovery document. Intended for tests that need each case
 * to fetch afresh.
 */
export function resetOidcConfigCache() {
  cachedConfig = undefined
}
