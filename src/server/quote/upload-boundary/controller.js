import { initiateUpload } from '../../common/services/uploader.js'
import { config } from '../../../config/config.js'
import getViewModel from './get-view-model.js'
import {
  getValidationFlashFromCache,
  clearValidationFlashFromCache
} from '../session-cache.js'

const routeId = 'upload-boundary'

export async function handler(request, h) {
  const viewModel = getViewModel()

  // Get validation errors from flash if any
  const flash = getValidationFlashFromCache(request)
  if (flash) {
    clearValidationFlashFromCache(request)
  }

  const uploadSession = await initiateUpload({
    redirect: '/quote/upload-received',
    s3Bucket: config.get('cdpUploader.bucket'),
    metadata: {}
  })

  if (uploadSession.error) {
    return h.view(`quote/${routeId}/index`, {
      ...viewModel,
      uploadError: uploadSession.error
    })
  }

  request.yar.set('pendingUploadId', uploadSession.uploadId)

  return h.view(`quote/${routeId}/index`, {
    ...viewModel,
    uploadUrl: uploadSession.uploadUrl,
    ...(flash?.validationErrors && {
      validationErrors: flash.validationErrors
    })
  })
}
