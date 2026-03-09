import Wreck from '@hapi/wreck'
import { config } from '../../../config/config.js'
import { createLogger } from '../helpers/logging/logger.js'
import { getTraceId } from '@defra/hapi-tracing'

const getHeaders = () => {
  const tracingHeader = config.get('tracing.header')
  const headers = {}
  const traceId = getTraceId()
  if (traceId) {
    headers[tracingHeader] = traceId
  }
  return headers
}

export const postRequestToBackend = async ({ endpointPath, payload }) => {
  const logger = createLogger()
  try {
    const url = `${config.get('backend').apiUrl}${endpointPath}`
    const response = await Wreck.post(url, {
      payload,
      json: true,
      headers: getHeaders()
    })
    return response
  } catch (error) {
    logger.error(error)
    throw error
  }
}
