import { BOUNDARY_ERRORS } from '@defra/nrf-library'
import {
  getUploadStatus,
  UPLOAD_STATUS
} from '../../common/services/uploader.js'
import { checkBoundary } from '../../common/services/boundary.js'
import { getPageTitle } from '../../common/helpers/page-title.js'
import { getBoundaryErrorMessage } from '../../common/constants/boundary-error-messages.js'
import { mapValidationErrorsForDisplay } from '../../common/helpers/form-validation.js'
import { saveValidationFlashToCache } from '../helpers/form-validation-session/index.js'
import { createLogger } from '../../common/helpers/logging/logger.js'
import { statusCodes } from '../../common/constants/status-codes.js'
import { routePath as uploadBoundaryPath } from '../upload-boundary/routes.js'
import { routePath as filePreviewPath } from '../file-preview/routes.js'

const logger = createLogger()
const REFRESH_INTERVAL_SECONDS = 5
const pageTitle = 'Checking file'

// Every UPLOAD-group failure (size/zip/filename/CRS/uploader/infrastructure)
// and every SERVICE-group failure (impact-assessor unreachable/bad response,
// generic check failure) sends the user back to the upload page to retry —
// there is no geometry to preview in either case. Most GEOMETRY failures
// keep the user on the preview page, since the invalid geometry itself is
// useful to show alongside the error — except INVALID_GEOMETRY,
// UNSUPPORTED_GEOMETRY_TYPE, NO_POLYGON_FOUND and COORDINATES_OUT_OF_RANGE,
// which are rejected by impact-assessor before any geometry is parsed (or,
// for COORDINATES_OUT_OF_RANGE, before it's safe to reproject for a
// preview), so there's no usable geometry to hand back and nothing to
// preview either.
const UPLOAD_REJECTION_CODES = new Set([
  ...Object.values(BOUNDARY_ERRORS.UPLOAD),
  ...Object.values(BOUNDARY_ERRORS.SERVICE),
  BOUNDARY_ERRORS.GEOMETRY.INVALID_GEOMETRY,
  BOUNDARY_ERRORS.GEOMETRY.UNSUPPORTED_GEOMETRY_TYPE,
  BOUNDARY_ERRORS.GEOMETRY.NO_POLYGON_FOUND,
  BOUNDARY_ERRORS.GEOMETRY.COORDINATES_OUT_OF_RANGE
])

/**
 * @param {object} params
 * @param {string} params.failureReason
 * @param {object} params.request
 * @param {object} params.h
 */
function redirectToUploadWithError({ failureReason, request, h }) {
  const validationErrors = mapValidationErrorsForDisplay([
    { path: ['file'], message: getBoundaryErrorMessage(failureReason) }
  ])
  saveValidationFlashToCache(request, { validationErrors })
  request.yar.set('uploadRejectionReason', failureReason)
  request.yar.clear('pendingUploadId')
  request.yar.clear('pendingUploadUrl')
  return h.redirect(uploadBoundaryPath).code(statusCodes.redirectAfterPost)
}

async function processBoundaryCheck(uploadId, request, h) {
  logger.info(`check-boundary - uploadId: ${uploadId}`)

  const result = await checkBoundary(uploadId)

  if (result.failureReason) {
    logger.error(
      `check-boundary failed - uploadId: ${uploadId}, failureReason: ${result.failureReason}`
    )

    if (UPLOAD_REJECTION_CODES.has(result.failureReason)) {
      return redirectToUploadWithError({
        failureReason: result.failureReason,
        request,
        h
      })
    }

    if (result.geojson) {
      request.yar.set('boundaryGeojson', result.geojson)
    }
    request.yar.set('boundaryFailureReason', result.failureReason)
    request.yar.clear('pendingUploadId')
    request.yar.clear('pendingUploadUrl')
    return h.redirect(filePreviewPath)
  }

  request.yar.set('boundaryGeojson', result.geojson)
  request.yar.clear('pendingUploadId')
  request.yar.clear('pendingUploadUrl')
  request.yar.clear('boundaryFailureReason')

  return h.redirect(filePreviewPath)
}

export async function handler(request, h) {
  const uploadId = request.yar.get('pendingUploadId')
  logger.info(`upload-received - pendingUploadId: ${uploadId}`)
  if (!uploadId) {
    return h.redirect(uploadBoundaryPath)
  }

  const response = await getUploadStatus(uploadId)
  const uploadStatus = response.uploadStatus
  logger.info(
    `upload-received - uploadId: ${uploadId}, uploadStatus: ${uploadStatus}`
  )

  if (uploadStatus === UPLOAD_STATUS.READY) {
    return processBoundaryCheck(uploadId, request, h)
  }

  const isProcessing =
    uploadStatus === UPLOAD_STATUS.PENDING ||
    uploadStatus === UPLOAD_STATUS.INITIATED

  if (!isProcessing) {
    // Terminal, non-ready status (error/failed/unknown) — send the user
    // back to upload-boundary to retry, since there is nothing to show on
    // this page. redirectToUploadWithError clears the pending upload so a
    // retry mints a fresh CDP Uploader session instead of reusing this
    // dead one.
    return redirectToUploadWithError({
      failureReason: BOUNDARY_ERRORS.UPLOAD.UPLOAD_STATUS_CHECK_FAILED,
      request,
      h
    })
  }

  const heading = 'Checking your file…'
  const viewModel = {
    pageTitle: getPageTitle(pageTitle),
    pageHeading: heading,
    refreshInterval: REFRESH_INTERVAL_SECONDS
  }

  return h.view('quote/checking-file/index', viewModel)
}

export async function checkBoundaryHandler(request, h) {
  const { id } = request.params
  return processBoundaryCheck(id, request, h)
}
