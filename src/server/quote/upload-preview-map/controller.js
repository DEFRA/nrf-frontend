import { createLogger } from '../../common/helpers/logging/logger.js'
import {
  saveQuoteDataToCache,
  getQuoteDataFromCache
} from '../helpers/quote-session-cache/index.js'
import { routePath as uploadBoundaryPath } from '../upload-boundary/routes.js'
import { routePath as noEdpPath } from '../no-edp/routes.js'
import getViewModel from './get-view-model.js'

const logger = createLogger()

export function handler(request, h) {
  const boundaryGeojson = request.yar.get('boundaryGeojson')
  const boundaryError = request.yar.get('boundaryError')
  const quoteCache = getQuoteDataFromCache(request)

  // Session may be missing if it expired or the user navigated here directly
  if (!boundaryGeojson && !quoteCache.boundaryGeojson && !boundaryError) {
    logger.info('map - no boundary data in session')
    return h.redirect(uploadBoundaryPath)
  }

  const boundaryFilename = boundaryGeojson?.boundaryFilename ?? null
  const viewModel = getViewModel(
    boundaryGeojson || quoteCache.boundaryGeojson,
    boundaryError,
    boundaryFilename
  )

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

  const intersectsEdp = boundaryGeojson?.intersectingEdps?.length ?? false
  // Lift the filename out of the geojson blob so it lives at the top of the
  // quote cache alongside other submit fields, and posts to the backend as a
  // top-level column rather than a buried property.
  const boundaryFilename = boundaryGeojson?.boundaryFilename ?? null

  saveQuoteDataToCache(request, { boundaryGeojson, boundaryFilename })
  request.yar.clear('boundaryGeojson')
  request.yar.clear('boundaryError')

  if (intersectsEdp) {
    return h.redirect('/quote/development-types')
  }

  logger.info('map - boundary does not intersect EDP, saved to quote data')
  return h.redirect(noEdpPath)
}
