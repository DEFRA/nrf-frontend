/**
 * User profile controller
 */
export const profileController = {
  handler(request, h) {
    // For now, show placeholder until auth is implemented
    return h.view('profile/index', {
      pageTitle: 'My Profile',
      user: {
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User'
      }
    })
  }
}
