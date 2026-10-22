import { BOUNDARY_ERRORS } from '@defra/nrf-library'
import {
  getUploadStatus,
  UPLOAD_STATUS
} from '../../common/services/uploader.js'
import { checkBoundary } from '../../common/services/boundary.js'
import { getPageTitle } from '../../common/helpers/page-title.js'
import { getBoundaryErrorMessage } from '../../common/constants/boundary-error-messages.js'
import { mapValidationErrorsForDisplay } from '../../common/helpers/form-validation.js'
import { saveValidationFlashToCache } from '../../common/helpers/form-validation-session/index.js'
import { createLogger } from '../../common/helpers/logging/logger.js'
import { statusCodes } from '../../common/constants/status-codes.js'
import { routePath as uploadBoundaryPath } from '../upload-boundary/route-path.js'
import { routePath as filePreviewPath } from '../file-preview/route-path.js'
import { appendChangeParam } from '../helpers/change-mode/index.js'

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
 * @param {string} params.uploadBoundaryPath
 */
function redirectToUploadWithError({
  failureReason,
  request,
  h,
  uploadBoundaryPath
}) {
  const validationErrors = mapValidationErrorsForDisplay([
    { path: ['file'], message: getBoundaryErrorMessage(failureReason) }
  ])
  saveValidationFlashToCache(request, { validationErrors })
  request.yar.set('uploadRejectionReason', failureReason)
  request.yar.clear('pendingUploadId')
  request.yar.clear('pendingUploadUrl')
  return h
    .redirect(appendChangeParam(uploadBoundaryPath, request.query))
    .code(statusCodes.redirectAfterPost)
}

/**
 * @param {string} uploadId
 * @param {object} request
 * @param {object} h
 * @param {object} targets - where the check outcome sends the user
 * @param {string} targets.uploadBoundaryPath
 * @param {string} targets.filePreviewPath
 */
async function processBoundaryCheck(uploadId, request, h, targets) {
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
        h,
        uploadBoundaryPath: targets.uploadBoundaryPath
      })
    }

    if (result.geojson) {
      request.yar.set('boundaryGeojson', result.geojson)
    }
    request.yar.set('boundaryFailureReason', result.failureReason)
    request.yar.clear('pendingUploadId')
    request.yar.clear('pendingUploadUrl')
    return h
      .redirect(appendChangeParam(targets.filePreviewPath, request.query))
      .code(statusCodes.redirectAfterPost)
  }

  request.yar.set('boundaryGeojson', result.geojson)
  request.yar.clear('pendingUploadId')
  request.yar.clear('pendingUploadUrl')
  request.yar.clear('boundaryFailureReason')

  return h
    .redirect(appendChangeParam(targets.filePreviewPath, request.query))
    .code(statusCodes.redirectAfterPost)
}

/**
 * Builds the checking file page handler. The outcome paths are parameters
 * because the request to use change alias keeps its retry and preview hops
 * inside that journey.
 * @param {object} [params]
 * @param {string} [params.uploadBoundaryPath] - where a rejected upload retries
 * @param {string} [params.filePreviewPath] - where a checked boundary continues
 * @returns {import('@hapi/hapi').Lifecycle.Method} the checking file handler
 */
export const createCheckingFileHandler = ({
  uploadBoundaryPath: retryUploadBoundaryPath = uploadBoundaryPath,
  filePreviewPath: previewPath = filePreviewPath
} = {}) =>
  async function handler(request, h) {
    const targets = {
      uploadBoundaryPath: retryUploadBoundaryPath,
      filePreviewPath: previewPath
    }
    const uploadId = request.yar.get('pendingUploadId')
    logger.info(`upload-received - pendingUploadId: ${uploadId}`)
    if (!uploadId) {
      return h.redirect(
        appendChangeParam(retryUploadBoundaryPath, request.query)
      )
    }

    const response = await getUploadStatus(uploadId)
    const uploadStatus = response.uploadStatus
    logger.info(
      `upload-received - uploadId: ${uploadId}, uploadStatus: ${uploadStatus}`
    )

    if (uploadStatus === UPLOAD_STATUS.READY) {
      return processBoundaryCheck(uploadId, request, h, targets)
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
        h,
        uploadBoundaryPath: retryUploadBoundaryPath
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

export const handler = createCheckingFileHandler()

export async function checkBoundaryHandler(request, h) {
  const { id } = request.params
  return processBoundaryCheck(id, request, h, {
    uploadBoundaryPath,
    filePreviewPath
  })
}
