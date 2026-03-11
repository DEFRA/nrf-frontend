import { statusCodes } from '../../common/constants/status-codes.js'
import formValidation from './form-validation.js'
import { routePath as routePathStart } from '../start/routes.js'
import { clearQuoteDataFromCache } from '../session-cache.js'

export const deleteSubmitController = {
  options: {
    validate: {
      payload: formValidation()
    }
  },
  async handler(request, h) {
    clearQuoteDataFromCache(request)
    return h.redirect(routePathStart).code(statusCodes.redirectAfterPost)
  }
}
