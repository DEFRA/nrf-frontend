import Wreck from '@hapi/wreck'
import { config } from '../../../config/config.js'
import { createLogger } from '../helpers/logging/logger.js'
import { withTraceId } from '@defra/hapi-tracing'

const logger = createLogger()

export const getRequestFromBackend = async ({
  endpointPath,
  headers: extraHeaders
}) => {
  try {
    const url = `${config.get('backend').apiUrl}${endpointPath}`
    const headers = {
      ...withTraceId(config.get('tracing.header')),
      ...extraHeaders
    }
    const response = await Wreck.get(url, {
      json: true,
      headers
    })
    return response
  } catch (error) {
    logger.error(error, 'GET request to backend failed')
    throw error
  }
}

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

export const postRequestToBackend = async ({ endpointPath, payload }) => {
  try {
    const url = `${config.get('backend').apiUrl}${endpointPath}`
    const response = await Wreck.post(url, {
      payload,
      json: true,
      headers: withTraceId(config.get('tracing.header'))
    })
    return response
  } catch (error) {
    logger.error(error, 'POST request to backend failed')
    throw error
  }
}
