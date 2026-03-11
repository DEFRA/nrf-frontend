import { getUploadStatus } from '../../common/services/uploader.js'
import { getPageTitle } from '../../common/helpers/page-title.js'
import { createLogger } from '../../common/helpers/logging/logger.js'

const logger = createLogger()
const REFRESH_INTERVAL_SECONDS = 5
const STATUS_PENDING = 'pending'
const STATUS_READY = 'ready'

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

  const isReady = uploadStatus === STATUS_READY
  const isProcessing =
    uploadStatus === STATUS_PENDING || uploadStatus === 'initiated'
  const viewModel = {
    pageTitle: getPageTitle('Boundary file upload status'),
    pageHeading: 'Boundary file upload status',
    uploadId,
    status: uploadStatus,
    isProcessing,
    isReady,
    refreshInterval: isProcessing ? REFRESH_INTERVAL_SECONDS : null,
    errorMessage: response.error
  }

  return h.view('quote/upload-received/index', viewModel)
}

export function checkBoundaryHandler(request, h) {
  const { id } = request.params

  // Faciendum: call nrf-backend to do boundary spatial check
  // then navigate to the boundary check result or map view page.
  // return h.redirect('/quote/next')
  return h
    .response(`Check boundary: ${id} (Not implemented yet)`)
    .type('text/plain')
}
