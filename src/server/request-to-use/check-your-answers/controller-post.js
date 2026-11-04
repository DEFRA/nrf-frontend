import { referenceParam } from '@defra/nrf-library'
import { statusCodes } from '../../common/constants/status-codes.js'
import { createCommitmentCertificateInBackend } from '../../common/services/nrf-backend.js'
import { routePath as startPath } from '../../manage/start-page/route-path.js'
import { requestToUseSession } from '../helpers/request-to-use-session/index.js'

const confirmationPath = '/request-to-use/confirmation'

export const checkYourAnswersPostController = {
  async handler(request, h) {
    const reference = requestToUseSession.get(request)?.nrlReference

    if (referenceParam.validate(reference).error !== undefined) {
      return h.redirect(startPath).code(statusCodes.redirectAfterPost)
    }

    await createCommitmentCertificateInBackend({ reference })
    return h.redirect(confirmationPath).code(statusCodes.redirectAfterPost)
  }
}
