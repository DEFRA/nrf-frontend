export function buildNavigation(request) {
  const isAuthenticated = request?.auth?.isAuthenticated || false

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

  // Add sign in/out link
  if (isAuthenticated) {
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
