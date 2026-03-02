import { quoteController } from '../controller-get.js'
import { mapValidationErrorsForDisplay } from '../../common/helpers/form-validation.js'
import {
  saveQuoteDataToCache,
  saveValidationFlashToCache
} from '../session-cache.js'
import { statusCodes } from '../../common/constants/status-codes.js'
import getViewModel from './get-view-model.js'
import formValidation from './form-validation.js'
import getNextPage from './get-next-page.js'

const routeId = 'upload-boundary'
export const routePath = '/quote/upload-boundary'

export default [
  {
    method: 'GET',
    path: routePath,
    ...quoteController({ routeId, getViewModel })
  },
  {
    method: 'POST',
    path: routePath,
    options: {
      payload: {
        output: 'stream',
        parse: true,
        multipart: true,
        maxBytes: 10 * 1024 * 1024 // 10MB
      },
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
    handler(request, h) {
      const { payload } = request
      saveQuoteDataToCache(request, payload)
      const nextPage = getNextPage(request.payload)
      return h.redirect(nextPage).code(statusCodes.redirectAfterPost)
    }
  }
]
