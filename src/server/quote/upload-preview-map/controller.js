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
  const boundaryFailureReason = request.yar.get('boundaryFailureReason')
  const quoteCache = getQuoteDataFromCache(request)

  // Session may be missing if it expired or the user navigated here directly
  if (
    !boundaryGeojson &&
    !quoteCache.boundaryGeojson &&
    !boundaryFailureReason
  ) {
    logger.info('map - no boundary data in session')
    return h.redirect(uploadBoundaryPath)
  }

  const boundaryFilename = boundaryGeojson?.boundaryFilename ?? null
  const viewModel = getViewModel({
    boundaryGeojson: boundaryGeojson || quoteCache.boundaryGeojson,
    boundaryFailureReason,
    boundaryFilename
  })

  return h.view('quote/upload-preview-map/index', {
    ...viewModel
  })
}

export function postHandler(request, h) {
  const boundaryGeojson = request.yar.get('boundaryGeojson')
  const quoteCache = getQuoteDataFromCache(request)

  // if the user has previously saved from this screen and come back to it, the boundaryGeojson session key will have been cleared by this handler; so also check for the main quote session cache
  if (!boundaryGeojson && !quoteCache.boundaryGeojson) {
    return h.redirect(uploadBoundaryPath)
  }

  const intersectsEdp =
    boundaryGeojson?.intersectingEdps?.length ??
    quoteCache.boundaryGeojson?.intersectingEdps?.length ??
    false
  // Lift the filename out of the geojson blob so it lives at the top of the
  // quote cache alongside other submit fields, and posts to the backend as a
  // top-level column rather than a buried property.
  const boundaryFilename = boundaryGeojson?.boundaryFilename ?? null

  if (boundaryGeojson) {
    saveQuoteDataToCache(request, { boundaryGeojson, boundaryFilename })
    request.yar.clear('boundaryGeojson')
    request.yar.clear('boundaryFailureReason')
  }

  if (intersectsEdp) {
    return h.redirect('/quote/email')
  }

  logger.info('map - boundary does not intersect EDP, saved to quote data')
  return h.redirect(noEdpPath)
}
