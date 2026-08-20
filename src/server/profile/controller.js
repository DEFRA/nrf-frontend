import { config } from '../../config/config.js'
import { DEFRA_ID_ACCOUNT_PATH } from '../auth/auth-urls.js'

/**
 * User profile controller
 */
export const profileController = {
  handler(request, h) {
    // Get authenticated user from session
    const auth = request.auth

    if (!auth || !auth.credentials || !auth.credentials.profile) {
      return h.redirect('/login')
    }

    const { profile } = auth.credentials

    const defraAccountUrl = new URL(
      DEFRA_ID_ACCOUNT_PATH,
      config.get('defraId.baseUrl')
    ).toString()

    return h.view('profile/index', {
      pageTitle: 'My Profile',
      user: {
        firstName: profile.firstName,
        lastName: profile.lastName,
        email: profile.email,
        name: profile.name,
        crn: profile.crn || profile.contactId,
        organisation: profile.organisation
      },
      fullProfile: profile,
      defraAccountUrl
    })
  }
}
