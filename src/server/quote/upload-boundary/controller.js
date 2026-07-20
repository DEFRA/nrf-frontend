import { initiateUpload } from '../../common/services/uploader.js'
import { config } from '../../../config/config.js'
import getViewModel from './get-view-model.js'
import {
  getValidationFlashFromCache,
  clearValidationFlashFromCache
} from '../helpers/form-validation-session/index.js'
const routeId = 'upload-boundary'

async function getUploadSession(request) {
  const existingUploadId = request.yar.get('pendingUploadId')
  const existingUploadUrl = request.yar.get('pendingUploadUrl')

  // Reuse an in-flight upload session rather than minting a new one on every
  // GET. Browsers can fire this route more than once per navigation (e.g.
  // link preload/prefetch on hover), and CDP Uploader's redirect back to
  // /quote/upload-received carries no identifying info — so if each GET
  // created its own session, whichever one wrote pendingUploadId to session
  // last would "win", orphaning the session the user's form actually posts
  // to and leaving it permanently stuck (CDP Uploader's own status endpoint
  // errors on an upload that's initiated but never received a file).
  if (existingUploadId && existingUploadUrl) {
    return { uploadId: existingUploadId, uploadUrl: existingUploadUrl }
  }

  return initiateUpload({
    redirect: '/quote/upload-received',
    s3Bucket: config.get('cdpUploader.bucket'),
    s3Path: config.get('cdpUploader.s3Path'),
    metadata: {}
  })
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
    })
  })
}
