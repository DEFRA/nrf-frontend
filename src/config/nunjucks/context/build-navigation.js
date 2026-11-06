import { AUTH_SIGN_OUT_PATH } from '../../../server/auth/auth-urls.js'
import { routePath as enterAddressPath } from '../../../server/request-to-use/enter-address/route-path.js'
import { routePath as checkYourAnswersPath } from '../../../server/request-to-use/check-your-answers/route-path.js'

// The confirmation page is not built yet, so its path is not imported
const confirmationPath = '/request-to-use/confirmation'

// Request to use pages from the enter address page onwards, where the user is signed in
const signOutPaths = new Set([
  enterAddressPath,
  checkYourAnswersPath,
  confirmationPath
])

/**
 * @param {import('@hapi/hapi').Request} [request]
 * @returns {{ text: string, href: string }[]} service navigation items; a sign out link when signed in, on the enter address page and the pages after it
 */
export function buildNavigation(request) {
  const isAuthenticated = request?.auth?.credentials?.isAuthenticated || false

  return isAuthenticated && signOutPaths.has(request.path)
    ? [{ text: 'Sign out', href: AUTH_SIGN_OUT_PATH }]
    : []
}
