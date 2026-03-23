import { getUploadStatus } from '../../common/services/uploader.js'
import { checkBoundary } from '../../common/services/boundary.js'
import { getPageTitle } from '../../common/helpers/page-title.js'
import { createLogger } from '../../common/helpers/logging/logger.js'

const logger = createLogger()
const REFRESH_INTERVAL_SECONDS = 5
const STATUS_PENDING = 'pending'
const STATUS_READY = 'ready'

async function processBoundaryCheck(uploadId, request, h) {
  logger.info(`check-boundary - uploadId: ${uploadId}`)

  const result = await checkBoundary(uploadId)

  if (result.error) {
    logger.error(
      `check-boundary failed - uploadId: ${uploadId}, error: ${result.error}`
    )
    if (result.geojson) {
      request.yar.set('boundaryGeojson', result.geojson)
    }
    request.yar.set('boundaryError', result.error)
    request.yar.clear('pendingUploadId')
    return h.redirect('/quote/upload-preview-map')
  }

  request.yar.set('boundaryGeojson', result.geojson)
  request.yar.clear('pendingUploadId')
  request.yar.clear('boundaryError')

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
