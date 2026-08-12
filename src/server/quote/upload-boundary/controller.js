import {
  initiateUpload,
  getUploadStatus,
  UPLOAD_STATUS
} from '../../common/services/uploader.js'
import getViewModel from './get-view-model.js'
import {
  getValidationFlashFromCache,
  clearValidationFlashFromCache
} from '../helpers/form-validation-session/index.js'
import { routePath as checkingFilePath } from '../checking-file/routes.js'
const routeId = 'upload-boundary'

async function getUploadSession(request) {
  const existingUploadId = request.yar.get('pendingUploadId')
  const existingUploadUrl = request.yar.get('pendingUploadUrl')

  // Reuse an in-flight upload session rather than minting a new one on every
  // GET (browsers can fire this route more than once per navigation, e.g.
  // link preload/prefetch on hover), which would otherwise orphan whichever
  // session the user's form doesn't end up posting to.
  //
  // Only safe to reuse while still "initiated" (no file received yet) —
  // otherwise fall through and mint a fresh session, since CDP Uploader
  // rejects a second file for a "pending"/"ready" session, and an "error"
  // status (getUploadStatus itself failed) leaves the session's true state
  // unknown.
  if (existingUploadId && existingUploadUrl) {
    const { uploadStatus } = await getUploadStatus(existingUploadId)
    if (uploadStatus === UPLOAD_STATUS.INITIATED) {
      return { uploadId: existingUploadId, uploadUrl: existingUploadUrl }
    }
  }

  return initiateUpload({ redirect: checkingFilePath })
}

export async function handler(request, h) {
  const viewModel = getViewModel()

  // Clear any stale boundary data from a previous upload attempt
  request.yar.clear('boundaryGeojson')
  request.yar.clear('boundaryFailureReason')

  // Get validation errors from flash if any
  const flash = getValidationFlashFromCache(request)
  if (flash) {
    clearValidationFlashFromCache(request)
  }

  // One-shot: set by upload-received when the previous upload was rejected
  const uploadRejectionReason = request.yar.get('uploadRejectionReason')
  if (uploadRejectionReason) {
    request.yar.clear('uploadRejectionReason')
  }

  const uploadSession = await getUploadSession(request)

  if (uploadSession.error) {
    return h.view(`quote/${routeId}/index`, {
      ...viewModel,
      uploadError: uploadSession.error
    })
  }

  request.yar.set('pendingUploadId', uploadSession.uploadId)
  request.yar.set('pendingUploadUrl', uploadSession.uploadUrl)

  return h.view(`quote/${routeId}/index`, {
    ...viewModel,
    uploadUrl: uploadSession.uploadUrl,
    ...(flash?.validationErrors && {
      validationErrors: flash.validationErrors
    }),
    ...(uploadRejectionReason && {
      uploadStatus: 'fail',
      failureReason: uploadRejectionReason
    })
  })
}
