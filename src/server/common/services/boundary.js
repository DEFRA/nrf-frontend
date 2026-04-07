import { statusCodes } from '../constants/status-codes.js'
import { createLogger } from '../helpers/logging/logger.js'
import { postRequestToBackend } from './nrf-backend.js'

const logger = createLogger()

const boundaryFileTooLargeError =
  'The uploaded boundary file is too large. The maximum file size allowed is 2MB.'

/**
 * Check if the error indicates the boundary file exceeded the size limit.
 * @param {string} error - The error message from the backend
 * @param {number} statusCode - The HTTP status code
 * @returns {boolean}
 */
function isBoundaryFileTooLarge(error, statusCode) {
  return statusCode === 413 || /413|payload too large/i.test(error)
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
      const error = isBoundaryFileTooLarge(rawError, res.statusCode)
        ? boundaryFileTooLargeError
        : rawError
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
      const friendlyError = isBoundaryFileTooLarge(backendError, statusCode)
        ? boundaryFileTooLargeError
        : backendError
      return { error: friendlyError, geojson: responsePayload }
    }
    return { error: 'Unable to check boundary' }
  }
}
