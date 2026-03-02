import { initiateUpload } from '../../common/services/cdp-uploader.js'
import { config } from '../../../config/config.js'
import {
  getValidationFlashFromCache,
  clearValidationFlashFromCache
} from '../session-cache.js'
import getViewModel from './get-view-model.js'

const routeId = 'upload-boundary'

export async function handler(request, h) {
  const baseViewModel = getViewModel()

  // Get validation errors from flash if any
  const formValidationErrors = getValidationFlashFromCache(request)
  let validationErrors
  if (formValidationErrors) {
    validationErrors = formValidationErrors.validationErrors
    clearValidationFlashFromCache(request)
  }

  // Initiate upload session with CDP Uploader
  const redirectUrl = `${config.get('appBaseUrl')}/quote/upload-received`
  const uploadSession = await initiateUpload({
    redirect: redirectUrl,
    s3Bucket: config.get('cdpUploader.bucket'),
    metadata: {}
  })

  if (uploadSession.error) {
    return h
      .view(`quote/${routeId}/index`, {
        ...baseViewModel,
        validationErrors,
        uploadError: uploadSession.error
      })
      .header('Cache-Control', 'no-store, must-revalidate')
  }

  // Store uploadId in session for status polling
  request.yar.set('pendingUploadId', uploadSession.uploadId)

  const viewModel = {
    ...baseViewModel,
    validationErrors,
    uploadUrl: uploadSession.uploadUrl
  }

  return h
    .view(`quote/${routeId}/index`, viewModel)
    .header('Cache-Control', 'no-store, must-revalidate')
}
