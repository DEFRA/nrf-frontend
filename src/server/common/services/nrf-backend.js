import Wreck from '@hapi/wreck'
import Boom from '@hapi/boom'
import { buildServiceHeaders, getRequestFromService } from '@defra/nrf-library'
import { config } from '../../../config/config.js'
import { createLogger } from '../helpers/logging/logger.js'

const logger = createLogger()

/**
 * Build headers for backend calls: trace header, any extra headers, and the
 * service-to-service x-api-key when configured.
 * @param {object} [extraHeaders]
 * @returns {object}
 */
export const backendHeaders = (extraHeaders) =>
  buildServiceHeaders({
    traceHeaderName: config.get('tracing.header'),
    serviceKey: config.get('backend.apiKey'),
    extraHeaders
  })

export const getRequestFromBackend = async ({
  endpointPath,
  headers: extraHeaders
}) =>
  getRequestFromService({
    url: `${config.get('backend').apiUrl}${endpointPath}`,
    headers: backendHeaders(extraHeaders),
    logger,
    errorMessage: 'GET request to backend failed'
  })

/**
 * Reads a quote. This does not check or spend a magic link token.
 * @param {{ reference: string }} options
 */
export const getQuoteFromBackend = async ({ reference }) =>
  getRequestFromBackend({ endpointPath: `/quotes/${reference}` })

/**
 * Fetches a user's full details (including their linked organisations) from the backend.
 * @param {{ defraId: string }} params - Defra ID sub claim identifying the user
 * @returns {Promise<object>} The stored user profile and their linked organisations
 */
export const getUserFromBackend = async ({ defraId }) => {
  const response = await getRequestFromBackend({
    endpointPath: '/users',
    headers: { 'x-defra-id': defraId }
  })
  return response.payload
}

/**
 * Asks the backend to email a magic link for the quote with this NRL reference
 * and email address. The backend sends nothing unless both match.
 * @param {{ nrlReference: string, email: string }} params
 * @returns {Promise<boolean>} whether a quote matched, so a link was sent
 */
export const requestEmailQuoteLinkFromBackend = async ({
  nrlReference,
  email
}) => {
  const { payload } = await postRequestToBackend({
    endpointPath: '/quotes/email-quote-link',
    payload: { reference: nrlReference, email }
  })
  return payload.matched
}

/**
 * Spends a single-use magic link token. The token goes in the body so it is not
 * recorded in access logs.
 * @param {{ reference: string, token: string }} params
 * @returns {Promise<string>} the access status: valid, invalid, expired or not_found
 */
export const redeemEmailQuoteLinkToken = async ({ reference, token }) => {
  const { payload } = await postRequestToBackend({
    endpointPath: `/quotes/${reference}/redeem-token`,
    payload: { token }
  })
  return payload.accessStatus
}

/**
 * Exchanges a spent magic link token for a new magic link, emailed to the
 * quote owner. Holding the old token is what allows the address to be returned.
 * @param {{ reference: string, token: string }} params
 * @returns {Promise<{ matched: boolean, email?: string }>} matched is false when
 * the token is not a spent token for this quote
 */
export const requestNewEmailQuoteLinkFromBackend = async ({
  reference,
  token
}) => {
  const { payload } = await postRequestToBackend({
    endpointPath: `/quotes/${reference}/resend-link`,
    payload: { token }
  })
  return payload
}

export const postRequestToBackend = async ({ endpointPath, payload }) => {
  try {
    const url = `${config.get('backend').apiUrl}${endpointPath}`
    const response = await Wreck.post(url, {
      payload,
      json: true,
      headers: backendHeaders()
    })
    return response
  } catch (error) {
    logger.error(error, 'POST request to backend failed')
    throw error
  }
}

export const patchRequestToBackend = async ({ endpointPath, payload }) => {
  try {
    const url = `${config.get('backend').apiUrl}${endpointPath}`
    const response = await Wreck.patch(url, {
      payload,
      json: true,
      headers: backendHeaders()
    })
    return response
  } catch (error) {
    logger.error(error, 'PATCH request to backend failed')
    throw error
  }
}

/**
 * Deletes a quote. Whatever went wrong upstream — the quote was already
 * deleted elsewhere (404) or the backend is down (5xx) — the user sees the
 * 500 error page, so every failure is wrapped as an internal error rather
 * than rethrown (a rethrown Wreck 404 would render the 404 page).
 * @param {{ endpointPath: string }} params
 * @returns {Promise<object>} the Wreck response ({ res, payload })
 */
export const deleteRequestToBackend = async ({ endpointPath }) => {
  try {
    const url = `${config.get('backend').apiUrl}${endpointPath}`
    const response = await Wreck.delete(url, {
      json: true,
      headers: backendHeaders()
    })
    return response
  } catch (error) {
    logger.error(error, 'DELETE request to backend failed')
    throw Boom.internal('Delete quote request to backend failed', error)
  }
}
