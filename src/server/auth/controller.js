/**
 * Authentication controller
 */
export const loginController = {
  handler(request, h) {
    return h.view('auth/login', {
      pageTitle: 'Sign in',
      heading: 'Sign in to continue'
    })
  }
}
