import { checkBoundaryGeometry } from '../../common/services/boundary.js'
import { statusCodes } from '../../common/constants/status-codes.js'
import { createLogger } from '../../common/helpers/logging/logger.js'
import { routePath as noEdpPath } from '../no-edp/routes.js'
import { routePath as developmentTypesPath } from '../development-types/routes.js'
import { saveQuoteDataToCache } from '../helpers/quote-session-cache/index.js'

const logger = createLogger()

export async function checkBoundaryHandler(request, h) {
  const { geometry } = request.payload

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

  if (!result.geojson || typeof result.geojson !== 'object') {
    logger.error(
      { geojson: result.geojson, sentGeometry: geometry },
      'draw-boundary: check boundary response is not an object and will fail POST /quotes validation'
    )
  }

  return h.response(result.geojson)
}

export function saveBoundaryHandler(request, h) {
  const {
    boundaryGeojson: {
      intersectingEdps,
      boundaryGeometryWgs84,
      boundaryMetadata,
      boundaryGeometryOriginal
    }
  } = request.payload

  const intersectsEdp = intersectingEdps.length > 0

  const boundaryGeojsonToCache = {
    boundaryGeometryWgs84,
    boundaryMetadata,
    boundaryGeometryOriginal,
    intersectingEdps
  }

  saveQuoteDataToCache(request, { boundaryGeojson: boundaryGeojsonToCache })

  logger.info('draw-boundary boundary saved to quote cache')

  if (intersectsEdp) {
    return h.redirect(developmentTypesPath)
  }

  return h.redirect(noEdpPath)
}
