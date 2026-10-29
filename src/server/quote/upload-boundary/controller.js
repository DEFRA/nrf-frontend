import {
  initiateUpload,
  getUploadStatus,
  UPLOAD_STATUS
} from '../../common/services/uploader.js'
import getViewModel from './get-view-model.js'
import {
  getValidationFlashFromCache,
  clearValidationFlashFromCache
} from '../../common/helpers/form-validation-session/index.js'
import { routePath as checkingFilePath } from '../checking-file/route-path.js'
import { appendChangeParam } from '../helpers/change-mode/index.js'

const routeId = 'upload-boundary'

/**
 * @param {object} params
 * @param {object} params.request
 * @param {string} params.redirectPath - the checking file page the CDP
 *   uploader redirects back to
 */
async function getUploadSession({ request, redirectPath }) {
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

  // The redirect target is baked into the CDP uploader session, so change
  // mode must be included here to survive the external uploader hop.
  return initiateUpload({
    redirect: appendChangeParam(redirectPath, request.query)
  })
}

/**
 * Builds the upload page handler. The checking file path is a parameter
 * because the request to use change alias bakes its own return URL into the
 * CDP uploader session so the user comes back inside that journey.
 * @param {object} [params]
 * @param {string} [params.checkingFilePath] - the return URL baked into the
 *   uploader session
 * @param {Function} [params.getViewModel] - the page's view model
 * @returns {import('@hapi/hapi').Lifecycle.Method} the upload page handler
 */
export const createUploadBoundaryHandler = ({
  checkingFilePath: redirectPath = checkingFilePath,
  getViewModel: buildViewModel = getViewModel
} = {}) =>
  async function uploadBoundaryHandler(request, h) {
    const viewModel = buildViewModel({}, request.query)

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

    const uploadSession = await getUploadSession({ request, redirectPath })

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

export const handler = createUploadBoundaryHandler()
