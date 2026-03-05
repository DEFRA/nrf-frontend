import { initiateUpload } from '../../common/services/cdp-uploader.js'
import { config } from '../../../config/config.js'
import getViewModel from './get-view-model.js'

const routeId = 'upload-boundary'

export async function handler(request, h) {
  const viewModel = getViewModel()

  // Build redirect URL from request
  const protocol = request.headers['x-forwarded-proto'] ?? 'http'
  const host = request.info.host
  const redirectUrl = `${protocol}://${host}/quote/upload-received`

  const uploadSession = await initiateUpload({
    redirect: redirectUrl,
    s3Bucket: config.get('cdpUploader.bucket'),
    metadata: {}
  })

  if (uploadSession.error) {
    return h.view(`quote/${routeId}/index`, {
      ...viewModel,
      uploadError: uploadSession.error
    })
  }

  return h.view(`quote/${routeId}/index`, {
    ...viewModel,
    uploadUrl: uploadSession.uploadUrl
  })
}
