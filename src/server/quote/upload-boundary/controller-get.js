import {
  getQuoteDataFromCache,
  getValidationFlashFromCache,
  clearValidationFlashFromCache
} from '../session-cache.js'
import { initiateUpload } from '../../common/services/cdp-uploader.js'
import getViewModel from './get-view-model.js'

const routeId = 'upload-boundary'

export async function handler(request, h) {
  const host = request.info.host
  const protocol = request.server.info.protocol
  const redirectUrl = `${protocol}://${host}/upload-received`
  const { uploadUrl, uploadId } = await initiateUpload(redirectUrl)

  // Store uploadId in session so upload-received page can access it
  request.yar.set('pendingUploadId', uploadId)

  const baseViewModel = getViewModel()
  const formValidationErrors = getValidationFlashFromCache(request)
  let formSubmitData
  let validationErrors
  if (formValidationErrors) {
    formSubmitData = formValidationErrors.formSubmitData
    validationErrors = formValidationErrors.validationErrors
    clearValidationFlashFromCache(request)
  } else {
    formSubmitData = getQuoteDataFromCache(request)
  }
  const viewModel = {
    ...baseViewModel,
    formSubmitData,
    validationErrors,
    uploadUrl
  }
  return h
    .view(`quote/${routeId}/index`, viewModel)
    .header('Cache-Control', 'no-store, must-revalidate')
}
