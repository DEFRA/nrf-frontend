import { createLogger } from '../../common/helpers/logging/logger.js'
import {
  saveQuoteDataToCache,
  getQuoteDataFromCache
} from '../helpers/quote-session-cache/index.js'
import { routePath as uploadBoundaryPath } from '../upload-boundary/routes.js'
import { routePath as noEdpPath } from '../no-edp/routes.js'
import { routePath as emailPath } from '../email/routes.js'
import { routePath as excludedAreaPath } from '../excluded-area/routes.js'
import { statusCodes } from '../../common/constants/status-codes.js'
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

  const resolvedGeojson = boundaryGeojson || quoteCache.boundaryGeojson
  const intersectsEdp = resolvedGeojson?.intersectingEdps?.length > 0
  const intersectsExcludedArea =
    resolvedGeojson?.intersectingExcludedAreas?.length > 0

  // A valid boundary that won't reach the email step has nothing to preview
  // here, so send the user straight to the relevant outcome page. An excluded
  // area makes the boundary ineligible for the EDP and takes precedence over
  // the no-EDP route. Errors still render on this page so the user can see
  // what went wrong.
  if (!boundaryFailureReason && intersectsExcludedArea) {
    logger.info(
      { intersectsExcludedArea },
      'map - boundary intersects an excluded area, redirecting to excluded-area'
    )
    return h.redirect(excludedAreaPath)
  }

  if (!boundaryFailureReason && !intersectsEdp) {
    logger.info(
      { intersectsEdp },
      'map - boundary does not intersect EDP, redirecting to no-edp'
    )
    return h.redirect(noEdpPath)
  }

  const boundaryFilename = boundaryGeojson?.boundaryFilename ?? null
  const viewModel = getViewModel({
    boundaryGeojson: resolvedGeojson,
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
    return h.redirect(uploadBoundaryPath).code(statusCodes.redirectAfterPost)
  }

  // Lift the filename out of the geojson blob so it lives at the top of the
  // quote cache alongside other submit fields, and posts to the backend as a
  // top-level column rather than a buried property.
  const boundaryFilename = boundaryGeojson?.boundaryFilename ?? null

  if (boundaryGeojson) {
    saveQuoteDataToCache(request, { boundaryGeojson, boundaryFilename })
    request.yar.clear('boundaryGeojson')
    request.yar.clear('boundaryFailureReason')
  }

  // The GET handler redirects non-intersecting boundaries away before the
  // form renders, but guard the POST too in case of a stale or direct submit.
  const resolvedGeojson = boundaryGeojson || quoteCache.boundaryGeojson
  const intersectsEdp = resolvedGeojson?.intersectingEdps?.length > 0
  const intersectsExcludedArea =
    resolvedGeojson?.intersectingExcludedAreas?.length > 0
  if (intersectsExcludedArea) {
    return h.redirect(excludedAreaPath).code(statusCodes.redirectAfterPost)
  }
  if (!intersectsEdp) {
    return h.redirect(noEdpPath).code(statusCodes.redirectAfterPost)
  }

  return h.redirect(emailPath).code(statusCodes.redirectAfterPost)
}
