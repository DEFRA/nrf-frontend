import { statusCodes } from '../../common/constants/status-codes.js'
import { createCommitmentCertificateInBackend } from '../../common/services/nrf-backend.js'
import { requestToUseSession } from '../helpers/request-to-use-session/index.js'

const confirmationPath = '/request-to-use/confirmation'

export const checkYourAnswersPostController = {
  async handler(request, h) {
    const { nrlReference: reference, levy } = requestToUseSession.get(request)

    await createCommitmentCertificateInBackend({ reference, levy })
    return h.redirect(confirmationPath).code(statusCodes.redirectAfterPost)
  }
}
