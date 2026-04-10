import { checkBoundaryGeometry } from '../../common/services/boundary.js'
import { statusCodes } from '../../common/constants/status-codes.js'
import { createLogger } from '../../common/helpers/logging/logger.js'
import { routePath as noEdpPath } from '../no-edp/routes.js'
import { routePath as developmentTypesPath } from '../development-types/routes.js'
import { saveQuoteDataToCache } from '../helpers/quote-session-cache/index.js'
import { routePath as drawBoundaryPath } from './routes.js'

const logger = createLogger()

/**
 * Handle a boundary check request from the draw map page.
 * Forwards the drawn GeoJSON geometry to the backend and returns
 * the result as JSON for the client-side map to render.
 */
export async function checkBoundaryHandler(request, h) {
  const { geometry } = request.payload

  const result = await checkBoundaryGeometry(geometry)

  if (result.error) {
    logger.error(`draw-boundary check failed - error: ${result.error}`)
    request.yar.set('boundaryError', result.error)
    const response = { error: result.error }
    if (result.geojson) {
      response.geojson = result.geojson
    }
    const statusCode = result.statusCode ?? statusCodes.badRequest
    return h.response(response).code(statusCode)
  }

  request.yar.set('boundaryGeojson', result.geojson)
  request.yar.clear('boundaryError')

  return h.response(result.geojson)
}

export function saveBoundaryHandler(request, h) {
  const boundaryGeojson = request.yar.get('boundaryGeojson')

  if (!boundaryGeojson) {
    return h.redirect(drawBoundaryPath)
  }

  const intersectsEdp = (boundaryGeojson?.intersectingEdps?.length ?? 0) > 0

  saveQuoteDataToCache(request, { boundaryGeojson }, { boundaryChanged: true })
  request.yar.clear('boundaryGeojson')
  request.yar.clear('boundaryError')

  if (intersectsEdp) {
    return h.redirect(developmentTypesPath)
  }

  return h.redirect(noEdpPath)
}
