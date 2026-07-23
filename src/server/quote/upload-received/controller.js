import { BOUNDARY_ERRORS } from '@defra/nrf-library'
import { getUploadStatus } from '../../common/services/uploader.js'
import { checkBoundary } from '../../common/services/boundary.js'
import { getPageTitle } from '../../common/helpers/page-title.js'
import { getBoundaryErrorMessage } from '../../common/constants/boundary-error-messages.js'
import { mapValidationErrorsForDisplay } from '../../common/helpers/form-validation.js'
import { saveValidationFlashToCache } from '../helpers/form-validation-session/index.js'
import { createLogger } from '../../common/helpers/logging/logger.js'
import { statusCodes } from '../../common/constants/status-codes.js'

const logger = createLogger()
const REFRESH_INTERVAL_SECONDS = 5
const STATUS_PENDING = 'pending'
const STATUS_READY = 'ready'

// Every UPLOAD-group failure (size/zip/filename/CRS/uploader/infrastructure)
// sends the user back to the upload page to retry — there is no geometry to
// preview. GEOMETRY and SERVICE failures keep the user on the preview page.
const UPLOAD_REJECTION_CODES = new Set(Object.values(BOUNDARY_ERRORS.UPLOAD))

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
  request.yar.clear('pendingUploadId')
  request.yar.clear('pendingUploadUrl')
  return h
    .redirect('/quote/upload-boundary')
    .code(statusCodes.redirectAfterPost)
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
    return h.redirect('/quote/upload-preview-map')
  }

  request.yar.set('boundaryGeojson', result.geojson)
  request.yar.clear('pendingUploadId')
  request.yar.clear('pendingUploadUrl')
  request.yar.clear('boundaryFailureReason')

  return h.redirect('/quote/upload-preview-map')
}

export async function handler(request, h) {
  const uploadId = request.yar.get('pendingUploadId')
  logger.info(`upload-received - pendingUploadId: ${uploadId}`)
  if (!uploadId) {
    return h.redirect('/quote/upload-boundary')
  }

  const response = await getUploadStatus(uploadId)
  const uploadStatus = response.uploadStatus
  logger.info(
    `upload-received - uploadId: ${uploadId}, uploadStatus: ${uploadStatus}`
  )

  if (uploadStatus === STATUS_READY) {
    return processBoundaryCheck(uploadId, request, h)
  }

  const isProcessing =
    uploadStatus === STATUS_PENDING || uploadStatus === 'initiated'

  if (!isProcessing) {
    // Terminal, non-ready status (error/failed/unknown) — clear the pending
    // upload so a retry via upload-boundary mints a fresh CDP Uploader
    // session instead of reusing this dead one.
    request.yar.clear('pendingUploadId')
    request.yar.clear('pendingUploadUrl')
  }

  const heading = 'Boundary file upload status'
  const viewModel = {
    pageTitle: getPageTitle(heading),
    pageHeading: heading,
    status: uploadStatus,
    isProcessing,
    refreshInterval: isProcessing ? REFRESH_INTERVAL_SECONDS : null,
    errorMessage: response.error
  }

  return h.view('quote/upload-received/index', viewModel)
}

export async function checkBoundaryHandler(request, h) {
  const { id } = request.params
  return processBoundaryCheck(id, request, h)
}
