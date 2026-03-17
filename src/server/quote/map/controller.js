import { createLogger } from '../../common/helpers/logging/logger.js'
import { saveQuoteDataToCache } from '../helpers/get-quote-session/index.js'
import { routePath as uploadBoundaryPath } from '../upload-boundary/routes.js'
import { routePath as noEdpPath } from '../no-edp/routes.js'
import getViewModel from './get-view-model.js'

const logger = createLogger()

export function handler(request, h) {
  const boundaryGeojson = request.yar.get('boundaryGeojson')

  if (!boundaryGeojson) {
    logger.info('map - no boundary data in session')
    return h.redirect(uploadBoundaryPath)
  }

  const viewModel = getViewModel(boundaryGeojson)

  return h.view('quote/map/index', {
    ...viewModel
  })
}

export function postHandler(request, h) {
  const boundaryGeojson = request.yar.get('boundaryGeojson')

  if (!boundaryGeojson) {
    return h.redirect(uploadBoundaryPath)
  }

  const intersectsEdp = boundaryGeojson?.intersects_edp ?? false

  saveQuoteDataToCache(request, { boundaryGeojson })
  request.yar.clear('boundaryGeojson')

  if (intersectsEdp) {
    logger.info('map - boundary intersects EDP, saved to quote data')
    return h.redirect('/quote/development-types')
  }

  logger.info('map - boundary does not intersect EDP, saved to quote data')
  return h.redirect(noEdpPath)
}
