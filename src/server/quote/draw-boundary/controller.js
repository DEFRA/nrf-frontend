import { checkBoundaryGeometry } from '../../common/services/boundary.js'
import { statusCodes } from '../../common/constants/status-codes.js'
import { createLogger } from '../../common/helpers/logging/logger.js'

const logger = createLogger()

/**
 * Handle a boundary check request from the draw map page.
 * Forwards the drawn GeoJSON geometry to the backend and returns
 * the result as JSON for the client-side map to render.
 */
export async function checkBoundaryHandler(request, h) {
  const { geometry } = request.payload

  logger.info('draw-boundary check')

  const result = await checkBoundaryGeometry(geometry)

  if (result.error) {
    logger.error(`draw-boundary check failed - error: ${result.error}`)
    const response = { error: result.error }
    if (result.geojson) {
      response.geojson = result.geojson
    }
    const statusCode = result.statusCode ?? statusCodes.badRequest
    return h.response(response).code(statusCode)
  }

  return h.response(result.geojson)
}
