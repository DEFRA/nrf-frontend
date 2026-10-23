import { defraIdSignInHandlers } from './defra-id-sign-in-handlers.js'
import { mockUser } from './fixtures/mock-user.js'
import { setupMswServer } from './setup-msw-server.js'
import { setupTestServer } from './setup-test-server.js'
import { completeDefraSignIn } from './complete-defra-sign-in.js'

/**
 * Sets up a test server with mocked Defra ID endpoints, for pages behind requireAuth.
 * @returns {{ getServer: () => import('@hapi/hapi').Server, signIn: (options?: { claims?: object, cookie?: string, signInUrl?: string }) => ReturnType<typeof completeDefraSignIn> }}
 * signIn takes optional `claims` (e.g. organisation claims) merged over the default mock user for that sign-in only
 */
export function setupSignedInTestServer() {
  let tokenClaims = mockUser

  setupMswServer(...defraIdSignInHandlers({ getClaims: () => tokenClaims }))
  const getServer = setupTestServer()

  const signIn = ({ claims, ...options } = {}) => {
    tokenClaims = { ...mockUser, ...claims }
    return completeDefraSignIn({ server: getServer(), ...options })
  }

  return { getServer, signIn }
}
