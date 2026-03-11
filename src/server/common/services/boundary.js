import Wreck from '@hapi/wreck'
import { config } from '../../../config/config.js'
import { createLogger } from '../helpers/logging/logger.js'

const logger = createLogger()

/**
 * Send a boundary check request to the backend
 * @param {string} uploadId - The upload ID to check
 * @returns {Promise<{geojson?: object, error?: string}>}
 */
export async function checkBoundary(uploadId) {
  const backendUrl = config.get('backend.apiUrl')
  const url = `${backendUrl}/boundary/check/${uploadId}`

  logger.info(`Checking boundary - url: ${url}, uploadId: ${uploadId}`)

  try {
    const { res, payload } = await Wreck.post(url, { json: true })

    if (res.statusCode >= 400) {
      const error =
        payload?.error ?? `Boundary check failed (${res.statusCode})`
      logger.error(
        `Boundary check error - uploadId: ${uploadId}, statusCode: ${res.statusCode}, error: ${error}`
      )
      return { error }
    }

    return { geojson: payload }
  } catch (error) {
    const statusCode = error?.output?.statusCode
    const responsePayload = error?.data?.payload
    logger.error(
      `Error checking boundary - url: ${url}, uploadId: ${uploadId}, statusCode: ${statusCode}, responsePayload: ${JSON.stringify(responsePayload)}, message: ${error?.message}`
    )
    return { error: 'Unable to check boundary' }
  }
}
