import { redirectToFormWithValidationErrors } from '../../common/helpers/redirect-to-form-with-validation-errors.js'
import { statusCodes } from '../../common/constants/status-codes.js'

/**
 * POST route config for the have-nrl-reference question: validates the payload
 * (PRG on failure) and redirects to the next page. Unlike quotePostController
 * it saves no answers to the quote data; only the validation flash is written
 * to the session on failure.
 * @param {object} params
 * @param {() => import('joi').ObjectSchema} params.formValidation - returns the payload schema
 * @param {(payload: object) => string} params.getNextPage - returns the redirect path
 * @returns {{ options: object, handler: import('@hapi/hapi').Lifecycle.Method }} route config
 */
export const haveNrlReferencePostController = ({
  formValidation,
  getNextPage
}) => ({
  options: {
    validate: {
      payload: formValidation(),
      failAction: redirectToFormWithValidationErrors
    }
  },
  handler(request, h) {
    return h
      .redirect(getNextPage(request.payload))
      .code(statusCodes.redirectAfterPost)
  }
})
