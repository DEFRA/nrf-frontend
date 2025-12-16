import { config } from '../../config/config.js'

/**
 * User profile controller
 */
export const profileController = {
  handler(request, h) {
    // If authentication is disabled, show placeholder
    if (!config.get('defraId.enabled')) {
      return h.view('profile/index', {
        pageTitle: 'My Profile',
        user: {
          email: 'test@example.com',
          firstName: 'Test',
          lastName: 'User',
          crn: 'N/A'
        },
        authEnabled: false
      })
    }

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
        firstName: profile.firstName,
        lastName: profile.lastName,
        name: profile.name,
        crn: profile.crn || profile.contactId,
        organisationId: profile.organisationId,
        currentRelationshipId: profile.currentRelationshipId
      },
      authEnabled: true
    })
  },
  options: {
    // Conditionally require authentication based on config
    auth: config.get('defraId.enabled') ? 'defra-session' : false
  }
}
