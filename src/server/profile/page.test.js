import { describe, it, beforeAll, afterAll, expect } from 'vitest'
import { mockUser } from '../../test-utils/fixtures/mock-user.js'

const PROFILE_PATH = '/profile'
const SIGN_IN_PATH = '/login'

let oidc
let server
let statusCodes
let startPath
let completeDefraSignIn
let getYarCookie

describe('Profile page', () => {
  beforeAll(async () => {
    const { startMockOidcProvider } =
      await import('../../test-utils/mock-oidc-provider.js')
    oidc = await startMockOidcProvider()

    // Must be set before the config module is loaded, which reads env on import
    process.env.DEFRA_ID_BASE_URL = oidc.baseUrl
    process.env.DEFRA_ID_WELL_KNOWN_PATH = oidc.wellKnownPath

    statusCodes = (await import('../common/constants/status-codes.js'))
      .statusCodes
    startPath = (await import('../manage/start-page/routes.js')).routePath

    const { createServer } = await import('../server.js')
    server = await createServer()
    await server.initialize()

    ;({ completeDefraSignIn } =
      await import('../../test-utils/complete-defra-sign-in.js'))
    ;({ getYarCookie } = await import('../../test-utils/yar-cookie.js'))
  })

  afterAll(async () => {
    await server?.stop()
    await oidc?.stop()
    delete process.env.DEFRA_ID_BASE_URL
    delete process.env.DEFRA_ID_WELL_KNOWN_PATH
  })

  afterEach(() => oidc?.setTokenClaims({}))

  it('returns a signed-out visitor to the page they originally requested after signing in', async () => {
    const challenge = await server.inject({ method: 'GET', url: PROFILE_PATH })

    expect(challenge.statusCode).toBe(statusCodes.found)
    expect(challenge.headers.location).toBe(SIGN_IN_PATH)

    const { response: callback, cookie } = await completeDefraSignIn({
      server,
      cookie: getYarCookie(challenge)
    })

    expect(callback.headers.location).toBe(PROFILE_PATH)

    const profile = await server.inject({
      method: 'GET',
      url: PROFILE_PATH,
      headers: { cookie }
    })

    expect(profile.statusCode).toBe(statusCodes.ok)
    expect(profile.result).toContain('My Profile')
    expect(profile.result).toContain(
      `${mockUser.firstName} ${mockUser.lastName}`
    )

    // The mock token has no relationships array, so the organisation name must not be shown
    expect(profile.result).not.toContain('Organisation name')
  })

  it('sends a user to the home page when they sign in without requesting a protected page first', async () => {
    const { response: callback } = await completeDefraSignIn({ server })

    expect(callback.headers.location).toBe(startPath)
  })

  it('renders the organisation name when the token has an org relationship', async () => {
    // Employee relationship, colon-separated as
    // relationshipId:organisationId:organisationName:orgLoa:relationshipType:relationshipLoa
    oidc.setTokenClaims({
      currentRelationshipId: '81d48d6c-6e94-f011-b4cc-000d3ac28f39',
      relationships: [
        '81d48d6c-6e94-f011-b4cc-000d3ac28f39:27d48d6c-6e94-f011-b4cc-000d3ac28f39:CDP Child Org 1:0:Employee:0'
      ],
      enrolmentCount: 1,
      roles: ['role1']
    })

    const { cookie } = await completeDefraSignIn({ server })

    const profile = await server.inject({
      method: 'GET',
      url: PROFILE_PATH,
      headers: { cookie }
    })

    expect(profile.statusCode).toBe(statusCodes.ok)
    expect(profile.result).toContain('Organisation name')
    expect(profile.result).toContain('CDP Child Org 1')
  })
})
