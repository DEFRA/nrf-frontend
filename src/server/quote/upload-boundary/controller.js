import { initiateUpload } from '../../common/services/cdp-uploader.js'
import { config } from '../../../config/config.js'
import getViewModel from './get-view-model.js'
import {
  getValidationFlashFromCache,
  clearValidationFlashFromCache
} from '../session-cache.js'

const routeId = 'upload-boundary'

export async function handler(request, h) {
  const baseViewModel = getViewModel()

  // Get validation errors from flash if any
  const flash = getValidationFlashFromCache(request)
  if (flash) {
    clearValidationFlashFromCache(request)
  }

  // Build redirect URL from request (works in both dev and prod)
  const protocol = request.headers['x-forwarded-proto'] ?? 'http'
  const host = request.info.host
  const redirectUrl = `${protocol}://${host}/quote/upload-received`

  const uploadSession = await initiateUpload({
    redirect: redirectUrl,
    s3Bucket: config.get('cdpUploader.bucket'),
    metadata: {}
  })

  if (uploadSession.error) {
    return h
      .view(`quote/${routeId}/index`, {
        ...baseViewModel,
        uploadError: uploadSession.error
      })
      .header('Cache-Control', 'no-store, must-revalidate')
  }

  request.yar.set('pendingUploadId', uploadSession.uploadId)

  return h
    .view(`quote/${routeId}/index`, {
      ...baseViewModel,
      uploadUrl: uploadSession.uploadUrl,
      ...(flash?.validationErrors && {
        validationErrors: flash.validationErrors
      })
    })
    .header('Cache-Control', 'no-store, must-revalidate')
}
