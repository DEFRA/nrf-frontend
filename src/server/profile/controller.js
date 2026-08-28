import { config } from '../../config/config.js'
import { DEFRA_ID_ACCOUNT_PATH } from '../auth/auth-urls.js'
import { getUserFromBackend } from '../common/services/nrf-backend.js'

/**
 * User profile controller
 */
export const profileController = {
  async handler(request, h) {
    // Get authenticated user from session
    const auth = request.auth

    if (!auth || !auth.credentials || !auth.credentials.profile) {
      return h.redirect('/login')
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

    const defraAccountUrl = new URL(
      DEFRA_ID_ACCOUNT_PATH,
      config.get('defraId.baseUrl')
    ).toString()

    return h.view('profile/index', {
      pageTitle: 'My Profile',
      user: {
        firstName: backendUser?.firstName ?? profile.firstName,
        lastName: backendUser?.lastName ?? profile.lastName,
        email: backendUser?.email ?? profile.email
      },
      organisations: backendUser?.organisations ?? [],
      defraAccountUrl
    })
  }
}
