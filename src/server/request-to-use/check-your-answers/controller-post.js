import { referenceParam } from '@defra/nrf-library'
import { statusCodes } from '../../common/constants/status-codes.js'
import { createCommitmentCertificateInBackend } from '../../common/services/nrf-backend.js'
import { routePath as startPath } from '../../manage/start-page/route-path.js'
import { requestToUseSession } from '../helpers/request-to-use-session/index.js'

const confirmationPath = '/request-to-use/confirmation'

export const checkYourAnswersPostController = {
  async handler(request, h) {
    const { nrlReference: reference, levy } =
      requestToUseSession.get(request) ?? {}

    if (referenceParam.validate(reference).error !== undefined || !levy) {
      return h.redirect(startPath).code(statusCodes.redirectAfterPost)
    }

    await createCommitmentCertificateInBackend({ reference, levy })
    return h.redirect(confirmationPath).code(statusCodes.redirectAfterPost)
  }
}
