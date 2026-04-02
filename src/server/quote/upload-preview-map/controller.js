import { createLogger } from '../../common/helpers/logging/logger.js'
import { saveQuoteDataToCache } from '../helpers/quote-session-cache/index.js'
import { routePath as uploadBoundaryPath } from '../upload-boundary/routes.js'
import { routePath as noEdpPath } from '../no-edp/routes.js'
import getViewModel from './get-view-model.js'

const logger = createLogger()

export function handler(request, h) {
  const boundaryGeojson = request.yar.get('boundaryGeojson')
  const boundaryError = request.yar.get('boundaryError')

  // Session may be missing if it expired or the user navigated here directly
  if (!boundaryGeojson && !boundaryError) {
    logger.info('map - no boundary data in session')
    return h.redirect(uploadBoundaryPath)
  }

  const viewModel = getViewModel(boundaryGeojson, boundaryError)

  return h.view('quote/upload-preview-map/index', {
    ...viewModel
  })
}

export function postHandler(request, h) {
  const boundaryGeojson = request.yar.get('boundaryGeojson')

  // Session may be missing if it expired or the user navigated here directly
  if (!boundaryGeojson) {
    return h.redirect(uploadBoundaryPath)
  }

  const intersectsEdp = boundaryGeojson?.intersectingEdps.length ?? false

  saveQuoteDataToCache(request, {
    boundaryGeojson,
    // Clear all subsequent answers – a new boundary may intersect different EDPs
    // and have different nearby waste water treatment works
    developmentTypes: null,
    wasteWaterTreatmentWorksId: null,
    wasteWaterTreatmentWorksName: null
  })
  request.yar.clear('boundaryGeojson')
  request.yar.clear('boundaryError')
  // Clear cached WWTW options so they are re-fetched for the new boundary
  request.yar.clear('nearbyWasteWaterOptions')

  if (intersectsEdp) {
    return h.redirect('/quote/development-types')
  }

  logger.info('map - boundary does not intersect EDP, saved to quote data')
  return h.redirect(noEdpPath)
}
