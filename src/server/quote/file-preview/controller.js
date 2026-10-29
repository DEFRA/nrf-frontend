import { createLogger } from '../../common/helpers/logging/logger.js'
import {
  saveQuoteDataToCache,
  getQuoteDataFromCache
} from '../helpers/quote-session-cache/index.js'
import { routePath as uploadBoundaryPath } from '../upload-boundary/route-path.js'
import { routePath as notInEdpPath } from '../not-in-edp/route-path.js'
import { routePath as emailPath } from '../email/route-path.js'
import { routePath as checkYourAnswersPath } from '../check-your-answers/route-path.js'
import { routePath as excludedAreaPath } from '../excluded-area/route-path.js'
import { statusCodes } from '../../common/constants/status-codes.js'
import {
  appendChangeParam,
  isChangeMode
} from '../helpers/change-mode/index.js'
import getViewModel from './get-view-model.js'

const logger = createLogger()

function readBoundarySession(request) {
  const boundaryGeojson = request.yar.get('boundaryGeojson')
  const boundaryFailureReason = request.yar.get('boundaryFailureReason')
  const quoteCache = getQuoteDataFromCache(request)
  return { boundaryGeojson, boundaryFailureReason, quoteCache }
}

function promoteBoundaryToCache(request, cacheData) {
  saveQuoteDataToCache(request, cacheData)
  request.yar.clear('boundaryGeojson')
  request.yar.clear('boundaryFailureReason')
}

function redirectToExcludedArea(
  boundaryGeojson,
  request,
  h,
  dropoutExcludedAreaPath
) {
  if (boundaryGeojson) {
    promoteBoundaryToCache(request, { boundaryGeojson })
  }
  return h.redirect(appendChangeParam(dropoutExcludedAreaPath, request.query))
}

/**
 * Builds the file preview page's POST handler, which promotes the checked
 * boundary to the quote cache and routes ineligible boundaries to their
 * outcome page. The paths are parameters for the same reason as the GET's.
 * @param {object} params
 * @param {string} params.retryUploadBoundaryPath - where a user without a
 *   boundary in session is sent to upload one
 * @param {string} params.successPath - where an accepted boundary continues
 *   to when not editing from check-your-answers
 * @param {string} params.excludedAreaPath - where a boundary in an EDP
 *   exclusion zone drops out to
 * @param {string} params.notInEdpPath - where a boundary outside every EDP
 *   drops out to
 * @returns {import('@hapi/hapi').Lifecycle.Method} the save handler
 */
function createPostHandler({
  retryUploadBoundaryPath,
  successPath,
  excludedAreaPath: dropoutExcludedAreaPath,
  notInEdpPath: dropoutNotInEdpPath
}) {
  return function saveUploadedBoundary(request, h) {
    const boundaryGeojson = request.yar.get('boundaryGeojson')
    const quoteCache = getQuoteDataFromCache(request)

    // if the user has previously saved from this screen and come back to it, the boundaryGeojson session key will have been cleared by this handler; so also check for the main quote session cache
    if (!boundaryGeojson && !quoteCache.boundaryGeojson) {
      return h
        .redirect(appendChangeParam(retryUploadBoundaryPath, request.query))
        .code(statusCodes.redirectAfterPost)
    }

    // Lift the filename out of the geojson blob so it lives at the top of the
    // quote cache alongside other submit fields, and posts to the backend as a
    // top-level column rather than a buried property.
    const boundaryFilename = boundaryGeojson?.boundaryFilename ?? null

    if (boundaryGeojson) {
      promoteBoundaryToCache(request, { boundaryGeojson, boundaryFilename })
    }

    // The GET handler redirects non-intersecting boundaries away before the
    // form renders, but guard the POST too in case of a stale or direct submit.
    const resolvedGeojson = boundaryGeojson || quoteCache.boundaryGeojson
    const intersectsEdp = resolvedGeojson?.intersectingEdps?.length > 0
    const intersectsExcludedArea =
      resolvedGeojson?.intersectingExcludedAreas?.length > 0
    if (intersectsExcludedArea) {
      return h
        .redirect(appendChangeParam(dropoutExcludedAreaPath, request.query))
        .code(statusCodes.redirectAfterPost)
    }
    if (!intersectsEdp) {
      return h
        .redirect(appendChangeParam(dropoutNotInEdpPath, request.query))
        .code(statusCodes.redirectAfterPost)
    }

    // When editing from check-your-answers the email is already captured, so
    // return there instead of asking for it again. The eligibility dead ends
    // above still take precedence: a boundary outside the EDP (or in an
    // exclusion zone) can't be quoted either way. The form posts back to the
    // current URL, so the change=true query param arrives on the POST too.
    return h
      .redirect(
        isChangeMode(request.query) ? checkYourAnswersPath : successPath
      )
      .code(statusCodes.redirectAfterPost)
  }
}

/**
 * Builds the file preview page's GET and POST handlers. The paths are
 * parameters because the request to use change alias keeps its retry hop
 * inside that journey and returns to the review and amend page instead of
 * asking for the email again.
 * @param {object} [params]
 * @param {string} [params.uploadBoundaryPath] - where a user without a
 *   boundary in session is sent to upload one
 * @param {string} [params.successPath=emailPath] - where an accepted boundary
 *   continues to when not editing from check-your-answers
 * @param {string} [params.excludedAreaPath=excludedAreaPath] - where a boundary
 *   in an EDP exclusion zone drops out to
 * @param {string} [params.notInEdpPath=notInEdpPath] - where a boundary outside
 *   every EDP drops out to
 * @param {Function} [params.getViewModel] - the page's view model
 * @returns {{handler: import('@hapi/hapi').Lifecycle.Method, postHandler: import('@hapi/hapi').Lifecycle.Method}} the GET and POST handlers
 */
export const createFilePreviewHandlers = ({
  uploadBoundaryPath: retryUploadBoundaryPath = uploadBoundaryPath,
  successPath = emailPath,
  excludedAreaPath: dropoutExcludedAreaPath = excludedAreaPath,
  notInEdpPath: dropoutNotInEdpPath = notInEdpPath,
  getViewModel: buildViewModel = getViewModel
} = {}) => ({
  handler(request, h) {
    const { boundaryGeojson, boundaryFailureReason, quoteCache } =
      readBoundarySession(request)

    // Session may be missing if it expired or the user navigated here directly
    if (
      !boundaryGeojson &&
      !quoteCache.boundaryGeojson &&
      !boundaryFailureReason
    ) {
      logger.info({ path: request.path }, 'map - no boundary data in session')
      return h.redirect(
        appendChangeParam(retryUploadBoundaryPath, request.query)
      )
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
      return redirectToExcludedArea(
        boundaryGeojson,
        request,
        h,
        dropoutExcludedAreaPath
      )
    }

    if (!boundaryFailureReason && !intersectsEdp) {
      logger.info(
        { intersectsEdp },
        'map - boundary does not intersect EDP, redirecting to no-edp'
      )
      return h.redirect(appendChangeParam(notInEdpPath, request.query))
    }

    const boundaryFilename = boundaryGeojson?.boundaryFilename ?? null
    return h.view('quote/file-preview/index', {
      ...buildViewModel({
        boundaryGeojson: resolvedGeojson,
        boundaryFailureReason,
        boundaryFilename,
        query: request.query
      })
    })
  },

  postHandler: createPostHandler({
    retryUploadBoundaryPath,
    successPath,
    excludedAreaPath: dropoutExcludedAreaPath,
    notInEdpPath: dropoutNotInEdpPath
  })
})

export const { handler, postHandler } = createFilePreviewHandlers()
