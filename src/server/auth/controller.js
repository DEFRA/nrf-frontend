/**
 * Authentication controller
 */

export const loginController = {
  handler(request, h) {
    // If already authenticated, redirect to home
    if (request.auth.isAuthenticated) {
      return h.redirect('/')
    }

    // Render login page with sign-in link
    return h.view('auth/login', {
      pageTitle: 'Sign in',
      loginUrl: '/login/out'
    })
  }
}

export const logoutController = {
  handler(request, h) {
    // Clear the session
    if (request.yar) {
      request.yar.reset()
    }

    // If using cookie auth from plugin
    if (request.cookieAuth) {
      request.cookieAuth.clear()
    }

    return h.redirect('/').unstate('session')
  }
}

export const loginReturnController = {
  handler(request, h) {
    // This is handled by the identity plugin automatically
    // But you can add custom logic here if needed
    const credentials = request.auth.credentials

    // Log successful authentication
    request.logger.info(
      {
        userId: credentials?.id,
        email: credentials?.email
      },
      'User authenticated successfully'
    )

    // Redirect to home or intended page
    const redirectTo = request.yar?.get('redirectTo') || '/'
    request.yar?.clear('redirectTo')

    return h.redirect(redirectTo)
  },
  options: {
    auth: 'idm'
  }
}
