import { getUploadStatus } from '../common/services/cdp-uploader.js'
import { getPageTitle } from '../common/helpers/page-title.js'

const REFRESH_INTERVAL_SECONDS = 5
const STATUS_PENDING = 'pending'
const STATUS_COMPLETE = 'complete'

export async function handler(request, h) {
  const uploadId = request.yar.get('pendingUploadId')
  if (!uploadId) {
    return h.redirect('/quote/upload-boundary')
  }

  const response = await getUploadStatus(uploadId)
  const uploadStatus = response.uploadStatus

  if (uploadStatus === STATUS_COMPLETE) {
    // Upload complete - redirect to next page in the flow
    return h.redirect('/quote/next')
  }

  const isProcessing =
    uploadStatus === STATUS_PENDING || uploadStatus === 'initiated'
  const viewModel = {
    pageTitle: getPageTitle('File upload status'),
    pageHeading: 'File upload status',
    uploadId,
    status: uploadStatus,
    isProcessing,
    refreshInterval: isProcessing ? REFRESH_INTERVAL_SECONDS : null,
    errorMessage: response.error
  }

  return h
    .view('upload-received/index', viewModel)
    .header('Cache-Control', 'no-store, must-revalidate')
}
