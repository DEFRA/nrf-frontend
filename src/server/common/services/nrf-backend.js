import Wreck from '@hapi/wreck'
import { config } from '../../../config/config.js'
import { createLogger } from '../helpers/logging/logger.js'
import { addTracingHeader } from './helpers/tracing-header.js'

const logger = createLogger()

export const getRequestFromBackend = async ({ endpointPath }) => {
  try {
    const url = `${config.get('backend').apiUrl}${endpointPath}`
    const response = await Wreck.get(url, {
      json: true,
      headers: addTracingHeader()
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
      headers: addTracingHeader()
    })
    return response
  } catch (error) {
    logger.error(error)
    throw error
  }
}
