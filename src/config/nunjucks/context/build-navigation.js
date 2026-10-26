import { AUTH_SIGN_OUT_PATH } from '../../../server/auth/auth-urls.js'

/**
 * @param {import('@hapi/hapi').Request} [request]
 * @returns {{ text: string, href: string }[]} service navigation items; a sign out link when signed in
 */
export function buildNavigation(request) {
  const isAuthenticated = request?.auth?.credentials?.isAuthenticated || false

  return isAuthenticated ? [{ text: 'Sign out', href: AUTH_SIGN_OUT_PATH }] : []
}
