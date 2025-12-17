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
  }
}
