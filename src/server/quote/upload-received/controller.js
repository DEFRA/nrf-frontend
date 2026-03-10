import { getUploadStatus } from '../../common/services/cdp-uploader.js'
import { getPageTitle } from '../../common/helpers/page-title.js'
import { postRequestToBackend } from '../../common/services/nrf-backend.js'
import { statusCodes } from '../../common/constants/status-codes.js'

const REFRESH_INTERVAL_SECONDS = 5
const STATUS_PENDING = 'pending'
const STATUS_READY = 'ready'

export async function handler(request, h) {
  const uploadId = request.yar.get('pendingUploadId')
  if (!uploadId) {
    return h.redirect('/quote/upload-boundary')
  }

  const response = await getUploadStatus(uploadId)
  const uploadStatus = response.uploadStatus

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

export async function checkBoundaryHandler(request, h) {
  const { id } = request.params

  const response = await postRequestToBackend({
    endpointPath: `/quote/check-boundary/${id}`
  })

  request.yar.set('boundaryCheckJob', response.payload)

  return h
    .redirect('/quote/boundary-result')
    .code(statusCodes.redirectAfterPost)
}
