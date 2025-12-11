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
