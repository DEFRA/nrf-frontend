/**
 * Build navigation items based on authentication state
 * @param {Request} request - Hapi request object
 * @returns {Array} Navigation items
 */
export function buildNavigation(request) {
  const isAuthenticated = request?.auth?.isAuthenticated || false
  const credentials = request?.auth?.credentials || null

  const navigation = [
    {
      text: 'Home',
      href: '/',
      current: request?.path === '/'
    },
    {
      text: 'About',
      href: '/about',
      current: request?.path === '/about'
    }
  ]

  // Add authentication-specific navigation
  if (isAuthenticated && credentials) {
    navigation.push({
      text: 'My Profile',
      href: '/profile',
      current: request?.path === '/profile'
    })

    navigation.push({
      text: 'Sign out',
      href: '/logout',
      current: false
    })
  } else {
    navigation.push({
      text: 'Sign in',
      href: '/login',
      current: request?.path === '/login'
    })
  }

  return navigation
}
