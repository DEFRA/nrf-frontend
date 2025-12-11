/**
 * User profile controller
 */
export const profileController = {
  handler(request, h) {
    // Check if user is authenticated
    if (!request.auth.isAuthenticated || !request.auth.credentials) {
      return h.redirect('/login')
    }

    const credentials = request.auth.credentials

    return h.view('profile/index', {
      pageTitle: 'My Profile',
      user: {
        id: credentials.id,
        email: credentials.email,
        firstName: credentials.claims?.firstName,
        lastName: credentials.claims?.lastName,
        contactId: credentials.contactId,
        enrolmentStatus: credentials.enrolmentStatus,
        relationships: credentials.relationships,
        roles: credentials.roles
      }
    })
  }
  // Note: auth strategy 'idm' will be enabled when DEFRA Identity plugin is activated
}
