import { statusCodes } from '../constants/status-codes.js'
import { createLogger } from '../helpers/logging/logger.js'
import { postRequestToBackend } from './nrf-backend.js'

const logger = createLogger()

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
    const maxSizeMb = payload?.maxFileSizeMb
    const sizeDetail = maxSizeMb
      ? ` The maximum file size allowed is ${maxSizeMb}MB.`
      : ''
    return `The uploaded boundary file is too large.${sizeDetail}`
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

/**
 * Send a GeoJSON boundary geometry to the backend for checking against EDPs.
 * Used by the draw map page where the user draws a polygon directly rather
 * than uploading a file.
 * @param {object} geometry - GeoJSON geometry, Feature, or FeatureCollection
 * @returns {Promise<{geojson?: object, error?: string}>}
 */
export async function checkBoundaryGeometry(geometry) {
  const endpointPath = '/boundary/check'

  logger.info('Checking boundary geometry')

  try {
    const { res, payload } = await postRequestToBackend({
      endpointPath,
      payload: { geometry }
    })

    if (res.statusCode >= statusCodes.badRequest) {
      const rawError =
        payload?.error ?? `Boundary check failed (${res.statusCode})`
      logger.error(
        `Boundary geometry check error - statusCode: ${res.statusCode}, error: ${rawError}`
      )
      const error = getResponseError(rawError, res.statusCode, payload)
      return { error, geojson: payload }
    }

    return { geojson: payload }
  } catch (error) {
    const statusCode = error?.output?.statusCode
    const responsePayload = error?.data?.payload
    logger.error(
      `Error checking boundary geometry - statusCode: ${statusCode}, responsePayload: ${JSON.stringify(responsePayload)}, message: ${error?.message}`
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
