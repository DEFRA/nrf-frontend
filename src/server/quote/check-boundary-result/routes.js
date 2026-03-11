import { handler, postHandler } from './controller.js'
import { mapValidationErrorsForDisplay } from '../../common/helpers/form-validation.js'
import { saveValidationFlashToCache } from '../session-cache.js'
import { statusCodes } from '../../common/constants/status-codes.js'
import formValidation from './form-validation.js'

export const routePath = '/quote/check-boundary-result'

export default [
  {
    method: 'GET',
    path: routePath,
    handler
  },
  {
    method: 'POST',
    path: routePath,
    options: {
      validate: {
        payload: formValidation(),
        failAction: (request, h, err) => {
          const { payload } = request
          const validationErrors = mapValidationErrorsForDisplay(err.details)
          saveValidationFlashToCache(request, {
            validationErrors,
            formSubmitData: payload
          })
          return h
            .redirect(request.path)
            .code(statusCodes.redirectAfterPost)
            .takeover()
        }
      }
    },
    handler: postHandler
  }
]
