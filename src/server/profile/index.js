export const profile = {
  plugin: {
    name: 'profile',
    register(server) {
      // Check if auth was actually successfully registered (not just enabled in config)
      const authEnabled = server.app.authEnabled || false

      server.route([
        {
          method: 'GET',
          path: '/profile',
          handler(request, h) {
            // If authentication is disabled, show placeholder
            if (!authEnabled) {
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
            // Only require authentication if auth plugin successfully registered
            auth: authEnabled ? 'defra-session' : false
          }
        }
      ])
    }
  }
}
