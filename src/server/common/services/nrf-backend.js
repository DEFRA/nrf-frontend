import Wreck from '@hapi/wreck'
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
 * @param {{ reference: string, bearerToken?: string, redeem?: boolean }} options
 */
export const getQuoteFromBackend = async ({
  reference,
  bearerToken,
  redeem = true
}) => {
  const headers = bearerToken
    ? { Authorization: `Bearer ${bearerToken}` }
    : undefined
  const query = redeem ? '' : '?redeem=false'
  return getRequestFromBackend({
    endpointPath: `/quotes/${reference}${query}`,
    headers
  })
}

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
