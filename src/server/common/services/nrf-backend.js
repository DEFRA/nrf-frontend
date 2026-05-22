import Wreck from '@hapi/wreck'
import { config } from '../../../config/config.js'
import { createLogger } from '../helpers/logging/logger.js'
import { withTraceId } from '@defra/hapi-tracing'

const logger = createLogger()

/**
 * Build headers for backend calls: trace header, any extra headers, and the
 * service-to-service x-api-key when configured.
 * @param {object} [extraHeaders]
 * @returns {object}
 */
export const backendHeaders = (extraHeaders) => {
  const headers = withTraceId(config.get('tracing.header'), extraHeaders)
  const apiKey = config.get('backend.apiKey')
  if (apiKey) {
    headers['x-api-key'] = apiKey
  }
  return headers
}

export const getRequestFromBackend = async ({ endpointPath }) => {
  try {
    const url = `${config.get('backend').apiUrl}${endpointPath}`
    const response = await Wreck.get(url, {
      json: true,
      headers: backendHeaders()
    })
    return response
  } catch (error) {
    logger.error(error)
    throw error
  }
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
    logger.error(error)
    throw error
  }
}
