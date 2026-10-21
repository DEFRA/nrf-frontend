import { getSafeRedirect } from './get-safe-redirect.js'
import {
  AUTH_SIGN_IN_PATH,
  CHANGE_ORGANISATION_QUERY_PARAM
} from './auth-urls.js'

export const changeOrganisationController = {
  handler(request, h) {
    request.yar.set('redirectTo', getSafeRedirect(request.query.redirectTo))
    return h.redirect(
      `${AUTH_SIGN_IN_PATH}?${CHANGE_ORGANISATION_QUERY_PARAM}=true`
    )
  },
  options: {
    auth: false
  }
}
