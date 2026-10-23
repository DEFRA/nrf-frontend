import { AUTH_SIGN_IN_PATH, AUTH_SIGN_OUT_PATH } from '../auth/auth-urls.js'
import { getDefraAccountUrl } from '../auth/get-defra-account-url.js'
import { getUserFromBackend } from '../common/services/nrf-backend.js'
import { getOrganisationHeadingData } from '../common/helpers/get-organisation-heading-data.js'

/**
 * User profile controller
 */
export const profileController = {
  async handler(request, h) {
    // Get authenticated user from session
    const auth = request.auth

    if (!auth || !auth.credentials || !auth.credentials.profile) {
      return h.redirect(AUTH_SIGN_IN_PATH)
    }

    const { profile } = auth.credentials

    // Fetch the full user record (incl. linked organisations) from nrf-backend.
    // Falls back to the session profile if the lookup fails (e.g. user not yet
    // synced); the service logs the failure before rethrowing.
    let backendUser = null
    try {
      backendUser = await getUserFromBackend({ defraId: profile.id })
    } catch {
      backendUser = null
    }

    return h.view('profile/index', {
      pageTitle: 'My Profile',
      user: {
        firstName: backendUser?.firstName ?? profile.firstName,
        lastName: backendUser?.lastName ?? profile.lastName,
        email: backendUser?.email ?? profile.email
      },
      organisations: backendUser?.organisations ?? [],
      defraAccountUrl: getDefraAccountUrl(),
      signOutPath: AUTH_SIGN_OUT_PATH,
      ...getOrganisationHeadingData(request)
    })
  }
}
