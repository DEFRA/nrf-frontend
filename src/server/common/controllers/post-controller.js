import { redirectToFormWithValidationErrors } from '../helpers/redirect-to-form-with-validation-errors.js'
import { statusCodes } from '../constants/status-codes.js'

/**
 * @param {{ nextPage: string }} params
 * @returns {string} the next page unchanged
 */
const useNextPage = ({ nextPage }) => nextPage

/**
 * @param {import('@hapi/hapi').Request} _request
 * @param {object} payload - the validated payload
 * @returns {object} the payload, unsaved
 */
const useSubmittedPayload = (_request, payload) => payload

/**
 * Builds a POST route config for a question page: validates the payload (PRG
 * on failure), saves it to the session, and redirects to the next page.
 * @param {object} params
 * @param {() => import('joi').ObjectSchema} params.formValidation - returns the payload schema
 * @param {(sessionData: object | null) => string} params.getNextPage - receives the session data returned by saveToSession
 * @param {(request: import('@hapi/hapi').Request, payload: object) => object | null} [params.saveToSession] - saves the payload and returns the merged session data (default: saves nothing and returns the payload)
 * @param {(params: { nextPage: string, request: import('@hapi/hapi').Request }) => string} [params.resolveRedirect] - adjusts the redirect target (default: the next page)
 * @param {object} [params.payloadOptions] - passed through to the route's options.payload
 * @returns {{ options: object, handler: import('@hapi/hapi').Lifecycle.Method }} route config
 */
export const createPostController = ({
  formValidation,
  getNextPage,
  saveToSession = useSubmittedPayload,
  resolveRedirect = useNextPage,
  payloadOptions
}) => ({
  options: {
    ...(payloadOptions && { payload: payloadOptions }),
    validate: {
      payload: formValidation(),
      failAction: redirectToFormWithValidationErrors
    }
  },
  handler(request, h) {
    const sessionData = saveToSession(request, request.payload)
    const nextPage = getNextPage(sessionData)
    return h
      .redirect(resolveRedirect({ nextPage, request }))
      .code(statusCodes.redirectAfterPost)
  }
})
