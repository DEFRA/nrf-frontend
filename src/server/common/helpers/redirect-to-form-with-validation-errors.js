import { mapValidationErrorsForDisplay } from './form-validation.js'
import { saveValidationFlashToCache } from './form-validation-session/index.js'
import { statusCodes } from '../constants/status-codes.js'

/**
 * PRG failAction for form POSTs. Saves errors and submitted values to the
 * session flash, then redirects back to the form. The original query string
 * is preserved so change mode survives a validation failure.
 * @param {import('@hapi/hapi').Request} request - Hapi request
 * @param {import('@hapi/hapi').ResponseToolkit} h - response toolkit
 * @param {import('joi').ValidationError} err - validation error
 * @returns {import('@hapi/hapi').Lifecycle.ReturnValue} redirect takeover
 */
export const redirectToFormWithValidationErrors = (request, h, err) => {
  const { payload } = request
  const validationErrors = mapValidationErrorsForDisplay(err.details)
  saveValidationFlashToCache(request, {
    validationErrors,
    formSubmitData: payload
  })
  return h
    .redirect(`${request.path}${request.url.search}`)
    .code(statusCodes.redirectAfterPost)
    .takeover()
}
