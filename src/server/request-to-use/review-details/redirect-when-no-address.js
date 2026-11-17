import { statusCodes } from '../../common/constants/status-codes.js'
import { getAddressForCurrentAccount } from '../helpers/request-to-use-session/index.js'
import { routePath as enterAddressPath } from '../enter-address/route-path.js'

/**
 * Sends a visitor without saved address answers back to the enter address
 * page: the address is what this page reviews, and it is cleared when the user
 * switches Defra ID organisation. Nothing is rendered or saved.
 * @param {import('@hapi/hapi').Request} request
 * @param {import('@hapi/hapi').ResponseToolkit} h
 * @returns {import('@hapi/hapi').Lifecycle.ReturnValue} continue, or a redirect to the enter address page
 */
export function redirectWhenNoAddress(request, h) {
  const hasAddress = Boolean(getAddressForCurrentAccount(request)?.addressLine1)

  if (hasAddress) {
    return h.continue
  }

  return h.redirect(enterAddressPath).code(statusCodes.found).takeover()
}
