import { defraIdSignInHandlers } from './defra-id-sign-in-handlers.js'
import { setupMswServer } from './setup-msw-server.js'
import { setupTestServer } from './setup-test-server.js'
import { completeDefraSignIn } from './complete-defra-sign-in.js'

/**
 * Sets up a test server with mocked Defra ID endpoints, for pages behind requireAuth.
 * @param {Object} [options]
 * @param {() => object} [options.getClaims] - Returns the claims the mocked token endpoint issues
 * @returns {{ getServer: () => import('@hapi/hapi').Server, signIn: (options?: { cookie?: string, signInUrl?: string }) => ReturnType<typeof completeDefraSignIn> }}
 */
export function setupSignedInTestServer({ getClaims } = {}) {
  setupMswServer(...defraIdSignInHandlers({ getClaims }))
  const getServer = setupTestServer()

  const signIn = (options) =>
    completeDefraSignIn({ server: getServer(), ...options })

  return { getServer, signIn }
}
