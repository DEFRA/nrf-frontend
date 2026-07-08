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

  logger.info(
    {
      geojsonType: result.geojson?.type,
      geojsonKeys: Object.keys(result.geojson ?? {})
    },
    'draw-boundary check response received'
  )

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

  logger.info(
    {
      boundaryGeojsonKeys: Object.keys(boundaryGeojsonToCache),
      hasGeometryOriginal: boundaryGeometryOriginal !== undefined,
      geometryOriginalType: typeof boundaryGeometryOriginal,
      intersectingEdpCount: intersectingEdps.length
    },
    'draw-boundary writing boundaryGeojson to quote cache'
  )

  saveQuoteDataToCache(request, { boundaryGeojson: boundaryGeojsonToCache })

  logger.info('draw-boundary boundary saved to quote cache')

  if (intersectsEdp) {
    return h.redirect(developmentTypesPath)
  }

  return h.redirect(noEdpPath)
}
