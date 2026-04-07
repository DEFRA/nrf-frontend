import { statusCodes } from '../constants/status-codes.js'
import { createLogger } from '../helpers/logging/logger.js'
import { postRequestToBackend } from './nrf-backend.js'

const logger = createLogger()

const fileSizeError =
  'The uploaded file is too large. The maximum file size allowed is 2MB.'

/**
 * Map raw backend/upstream error messages to user-friendly text.
 * @param {string} error - The original error message
 * @param {number} statusCode - The HTTP status code
 * @returns {string}
 */
function toUserFriendlyError(error, statusCode) {
  if (statusCode === 413 || /413|payload too large/i.test(error)) {
    return fileSizeError
  }
  return error
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
      const error = toUserFriendlyError(rawError, res.statusCode)
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
        error: toUserFriendlyError(backendError, statusCode),
        geojson: responsePayload
      }
    }
    return { error: 'Unable to check boundary' }
  }
}
