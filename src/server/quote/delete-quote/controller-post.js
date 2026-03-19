import { statusCodes } from '../../common/constants/status-codes.js'
import formValidation from './form-validation.js'
import { routePath as routePathDeleteConfirmation } from '../delete-quote-confirmation/routes.js'

import { clearQuoteDataFromCache } from '../helpers/get-quote-session/index.js'

export const deleteSubmitController = {
  options: {
    validate: {
      payload: formValidation()
    }
  },
  async handler(request, h) {
    clearQuoteDataFromCache(request)
    return h
      .redirect(routePathDeleteConfirmation)
      .code(statusCodes.redirectAfterPost)
  }
}
