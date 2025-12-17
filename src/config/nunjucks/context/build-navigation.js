export function buildNavigation(request) {
  const isAuthenticated = request?.auth?.credentials?.isAuthenticated || false

  const baseNav = [
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

  // Add profile and sign in/out links based on auth state
  if (isAuthenticated) {
    baseNav.push({
      text: 'Profile',
      href: '/profile',
      current: request?.path === '/profile'
    })
    baseNav.push({
      text: 'Sign out',
      href: '/auth/sign-out',
      current: false
    })
  } else {
    baseNav.push({
      text: 'Sign in',
      href: '/login',
      current: request?.path === '/login'
    })
  }

  return baseNav
}
