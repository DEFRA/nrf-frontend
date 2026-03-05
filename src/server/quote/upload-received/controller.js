import { getUploadStatus } from '../../common/services/cdp-uploader.js'
import { getPageTitle } from '../../common/helpers/page-title.js'

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
    pageTitle: getPageTitle('File upload status'),
    pageHeading: 'File upload status',
    uploadId,
    status: uploadStatus,
    isProcessing,
    isReady,
    refreshInterval: isProcessing ? REFRESH_INTERVAL_SECONDS : null,
    errorMessage: response.error
  }

  return h
    .view('quote/upload-received/index', viewModel)
    .header('Cache-Control', 'no-store, must-revalidate')
}

export function checkBoundaryHandler(request, h) {
  const { id } = request.params

  // TODO: implement boundary spatial check
  // return h.redirect('/quote/next')
  return h.response(`Check boundary: ${id}`).type('text/plain')
}
