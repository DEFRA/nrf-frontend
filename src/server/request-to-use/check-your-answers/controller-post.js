import { referenceParam } from '@defra/nrf-library'
import { statusCodes } from '../../common/constants/status-codes.js'
import { createCommitmentCertificateInBackend } from '../../common/services/nrf-backend.js'
import { routePath as startPath } from '../../manage/start-page/route-path.js'
import {
  SILENT_SIGN_IN_PATH,
  consumeVerifiedSubmitReauth,
  startSubmitReauth
} from '../../auth/submit-reauth.js'
import { requestToUseSession } from '../helpers/request-to-use-session/index.js'
import { routePath } from './route-path.js'

const confirmationPath = '/request-to-use/confirmation'

export const checkYourAnswersPostController = {
  async handler(request, h) {
    const reference = requestToUseSession.get(request)?.nrlReference

    if (referenceParam.validate(reference).error !== undefined) {
      return h.redirect(startPath).code(statusCodes.redirectAfterPost)
    }

    // The user may have signed out of Defra ID elsewhere, so confirm with
    // Defra ID before submitting. The sign-in returns here, to submit again.
    if (!consumeVerifiedSubmitReauth(request)) {
      startSubmitReauth(request)
      request.yar.set('redirectTo', routePath)
      return h.redirect(SILENT_SIGN_IN_PATH).code(statusCodes.redirectAfterPost)
    }

    await createCommitmentCertificateInBackend({ reference })
    return h.redirect(confirmationPath).code(statusCodes.redirectAfterPost)
  }
}
