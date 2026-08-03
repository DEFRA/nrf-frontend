import { checkBoundaryGeometry } from '../../common/services/boundary.js'
import { getBoundaryErrorMessage } from '../../common/constants/boundary-error-messages.js'
import { statusCodes } from '../../common/constants/status-codes.js'
import { createLogger } from '../../common/helpers/logging/logger.js'
import { routePath as noEdpPath } from '../no-edp/routes.js'
import { routePath as emailPath } from '../email/routes.js'
import { routePath as excludedAreaPath } from '../excluded-area/routes.js'
import { saveQuoteDataToCache } from '../helpers/quote-session-cache/index.js'

const logger = createLogger()

export async function checkBoundaryHandler(request, h) {
  const { geometry } = request.payload

  const result = await checkBoundaryGeometry(geometry)

  if (result.failureReason) {
    logger.error(
      { failureReason: result.failureReason },
      'draw-boundary check failed'
    )
    const response = { error: getBoundaryErrorMessage(result.failureReason) }
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
      intersectingExcludedAreas,
      boundaryGeometryWgs84,
      boundaryMetadata,
      boundaryGeometryOriginal
    }
  } = request.payload

  const intersectsEdp = intersectingEdps.length > 0
  const intersectsExcludedArea = intersectingExcludedAreas.length > 0

  const boundaryGeojsonToCache = {
    boundaryGeometryWgs84,
    boundaryMetadata,
    boundaryGeometryOriginal,
    intersectingEdps,
    intersectingExcludedAreas
  }

  // Explicitly clear boundaryFilename — drawn boundaries never have one, but
  // saveQuoteDataToCache only merges keys it's given, so a filename left
  // over from a previously abandoned upload would otherwise stick around.
  saveQuoteDataToCache(request, {
    boundaryGeojson: boundaryGeojsonToCache,
    boundaryFilename: null
  })

  logger.info('draw-boundary boundary saved to quote cache')

  // Excluded-area takes precedence: when the boundary overlaps an EDP
  // exclusion zone it is ineligible for the EDP, so the user must use the
  // Habitat Regulations instead. The impact assessor skips the EDP query in
  // this case, so intersectingEdps will be empty — but check this first to
  // keep the redirect decisive regardless.
  if (intersectsExcludedArea) {
    return h.redirect(excludedAreaPath)
  }

  if (intersectsEdp) {
    return h.redirect(emailPath)
  }

  return h.redirect(noEdpPath)
}
