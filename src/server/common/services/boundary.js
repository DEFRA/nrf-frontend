import { statusCodes } from '../constants/status-codes.js'
import { createLogger } from '../helpers/logging/logger.js'
import { postRequestToBackend } from './nrf-backend.js'

const logger = createLogger()

const defaultMaxBoundaryFileSizeMb = 2

/**
 * Map a backend error response to a user-friendly error message.
 * Checks known error patterns and returns an appropriate message,
 * falling back to the raw backend error if no pattern matches.
 * @param {string} rawError - The raw error message from the backend
 * @param {number} statusCode - The HTTP status code
 * @param {object} payload - The full response payload
 * @returns {string}
 */
function getResponseError(rawError, statusCode, payload) {
  if (
    statusCode === statusCodes.payloadTooLarge ||
    /413|payload too large/i.test(rawError)
  ) {
    const maxSizeMb = payload?.maxFileSizeMb ?? defaultMaxBoundaryFileSizeMb
    return `The uploaded boundary file is too large. The maximum file size allowed is ${maxSizeMb}MB.`
  }

  return rawError
}

/**
 * Send a boundary check request to the backend
 * @param {string} uploadId - The upload ID to check
 * @returns {Promise<{geojson?: object, error?: string}>}
 */
export async function checkBoundary(uploadId) {
  const endpointPath = `/boundary/check/${uploadId}`

  logger.info(`Checking boundary - uploadId: ${uploadId}`)

  try {
    const { res, payload } = await postRequestToBackend({ endpointPath })

    if (res.statusCode >= statusCodes.badRequest) {
      const rawError =
        payload?.error ?? `Boundary check failed (${res.statusCode})`
      logger.error(
        `Boundary check error - uploadId: ${uploadId}, statusCode: ${res.statusCode}, error: ${rawError}`
      )
      const error = getResponseError(rawError, res.statusCode, payload)
      return { error, geojson: payload }
    }

    return { geojson: payload }
  } catch (error) {
    const statusCode = error?.output?.statusCode
    const responsePayload = error?.data?.payload
    logger.error(
      `Error checking boundary - uploadId: ${uploadId}, statusCode: ${statusCode}, responsePayload: ${JSON.stringify(responsePayload)}, message: ${error?.message}`
    )
    const backendError = responsePayload?.error
    if (backendError) {
      return {
        error: getResponseError(backendError, statusCode, responsePayload),
        geojson: responsePayload
      }
    }
    return { error: 'Unable to check boundary' }
  }
}
