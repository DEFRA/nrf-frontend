import { BOUNDARY_ERRORS, KNOWN_BOUNDARY_ERROR_CODES } from '@defra/nrf-library'
import { statusCodes } from '../constants/status-codes.js'
import { createLogger } from '../helpers/logging/logger.js'
import { postRequestToBackend } from './nrf-backend.js'

const logger = createLogger()

function resolveFailureReason(code) {
  return KNOWN_BOUNDARY_ERROR_CODES.has(code)
    ? code
    : BOUNDARY_ERRORS.SERVICE.CHECK_FAILED
}

/**
 * Send a boundary check request to the backend
 * @param {string} uploadId - The upload ID to check
 * @returns {Promise<{geojson?: object, failureReason?: string}>}
 */
export async function checkBoundary(uploadId) {
  const endpointPath = `/boundary/check/${uploadId}`

  logger.info(`Checking boundary - uploadId: ${uploadId}`)

  try {
    const { res, payload } = await postRequestToBackend({ endpointPath })

    if (res.statusCode >= statusCodes.badRequest) {
      const code = payload?.error
      logger.error(
        { uploadId, statusCode: res.statusCode, code },
        'Boundary check error'
      )
      return {
        failureReason: resolveFailureReason(code),
        geojson: payload
      }
    }

    return { geojson: payload }
  } catch (error) {
    const statusCode = error?.output?.statusCode
    const responsePayload = error?.data?.payload
    logger.error(
      error,
      `Error checking boundary - uploadId: ${uploadId}, statusCode: ${statusCode}, responsePayload: ${JSON.stringify(responsePayload)}, message: ${error?.message}`
    )
    const code = responsePayload?.error
    if (code) {
      return {
        failureReason: resolveFailureReason(code),
        geojson: responsePayload
      }
    }
    return {
      failureReason: BOUNDARY_ERRORS.SERVICE.CHECK_FAILED
    }
  }
}

/**
 * Send a GeoJSON boundary geometry to the backend for checking against EDPs.
 * Used by the draw map page where the user draws a polygon directly rather
 * than uploading a file.
 * @param {object} geometry - GeoJSON Polygon Geometry
 * @returns {Promise<{geojson?: object, failureReason?: string, statusCode?: number}>}
 */
export async function checkBoundaryGeometry(geometry) {
  try {
    const { res, payload } = await postRequestToBackend({
      endpointPath: '/boundary/check',
      payload: { geometry }
    })

    if (res.statusCode >= statusCodes.badRequest) {
      const code = payload?.error
      logger.error(
        { statusCode: res.statusCode, code },
        'Boundary geometry check error'
      )
      return {
        failureReason: resolveFailureReason(code),
        geojson: payload,
        statusCode: res.statusCode
      }
    }

    return { geojson: payload }
  } catch (error) {
    const statusCode = error?.output?.statusCode
    const responsePayload = error?.data?.payload
    logger.error(
      error,
      `Error checking boundary geometry - statusCode: ${statusCode}, responsePayload: ${JSON.stringify(responsePayload)}, message: ${error?.message}`
    )
    const code = responsePayload?.error
    if (code) {
      return {
        failureReason: resolveFailureReason(code),
        geojson: responsePayload,
        statusCode
      }
    }
    return {
      failureReason: BOUNDARY_ERRORS.SERVICE.CHECK_FAILED,
      statusCode
    }
  }
}
