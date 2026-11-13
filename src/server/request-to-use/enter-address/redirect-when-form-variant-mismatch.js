import { statusCodes } from '../../common/constants/status-codes.js'
import { getEnterAddressVariant } from '../helpers/get-enter-address-variant/index.js'
import { requestToUseSession } from '../helpers/request-to-use-session/index.js'
import { routePath } from './route-path.js'

/**
 * Rejects a POST whose hidden variant field no longer matches the variant the
 * server would render now - a tampered payload, or a form rendered before the
 * user's answer or Defra ID relationship changed. The redirect re-renders the
 * form with the current variant and nothing is saved.
 * @param {import('@hapi/hapi').Request} request
 * @param {import('@hapi/hapi').ResponseToolkit} h
 * @returns {import('@hapi/hapi').Lifecycle.ReturnValue} continue, or a redirect back to the form
 */
export function redirectWhenFormVariantMismatch(request, h) {
  const { organisation } = request.auth.credentials?.profile ?? {}
  const session = requestToUseSession.get(request)
  const variant = getEnterAddressVariant({
    defraIdUserType: session?.defraId?.userType,
    userRelationshipType: organisation?.userRelationshipType
  })

  if (request.payload?.formVariant !== variant) {
    return h.redirect(routePath).code(statusCodes.redirectAfterPost).takeover()
  }

  return h.continue
}
