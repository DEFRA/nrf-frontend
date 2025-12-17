import { config } from '../../config/config.js'

/**
 * User profile controller
 */
export const profileController = {
  handler(request, h) {
    // Get authenticated user from session
    const { credentials } = request.auth

    if (!credentials || !credentials.profile) {
      return h.redirect('/login')
    }

    const { profile } = credentials

    return h.view('profile/index', {
      pageTitle: 'My Profile',
      user: {
        email: profile.email,
        name: profile.name,
        crn: profile.crn || profile.contactId,
        organisationId: profile.organisationId,
        currentRelationshipId: profile.currentRelationshipId
      },
      fullProfile: profile,
      authEnabled: true
    })
  },
  options: {
    // Conditionally require authentication based on config
    auth: config.get('defraId.enabled') ? 'defra-session' : false
  }
}
