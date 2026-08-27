import {
  describe,
  it,
  beforeAll,
  afterAll,
  afterEach,
  expect,
  vi
} from 'vitest'
import { http, HttpResponse } from 'msw'
import Jwt from '@hapi/jwt'

import { config } from '../../config/config.js'
import { setupMswServer } from '../../test-utils/setup-msw-server.js'
import { mockUser } from '../../test-utils/fixtures/mock-user.js'

const PROFILE_PATH = '/profile'
const SIGN_IN_PATH = '/login'
const SIGNING_SECRET = 'test-signing-secret-not-for-production'

const defraIdBaseUrl = config.get('defraId.baseUrl')
const wellKnownUrl = new URL(
  config.get('defraId.wellKnownPath'),
  defraIdBaseUrl
).toString()
const tokenUrl = `${defraIdBaseUrl}/token`
const backendUrl = config.get('backend').apiUrl

// Claims the mocked token endpoint issues; overridden per test, reset in afterEach
let tokenClaims = { ...mockUser }
const backendRequests = []

// The user record the mocked GET /users/:defraId returns; overridden per test, reset in afterEach
const defaultBackendUser = {
  defraId: mockUser.sub,
  email: mockUser.email,
  firstName: mockUser.firstName,
  lastName: mockUser.lastName,
  organisations: []
}
let backendUser = { ...defaultBackendUser }

setupMswServer(
  http.get(wellKnownUrl, () =>
    HttpResponse.json({
      issuer: defraIdBaseUrl,
      authorization_endpoint: `${defraIdBaseUrl}/authorize`,
      token_endpoint: tokenUrl
    })
  ),
  http.post(tokenUrl, () => {
    const exp = Math.floor(Date.now() / 1000) + 3600
    const token = Jwt.token.generate(
      { ...tokenClaims, exp },
      { key: SIGNING_SECRET }
    )
    return HttpResponse.json({
      access_token: token,
      refresh_token: 'test-refresh-token',
      id_token: token,
      expires_in: 3600
    })
  }),
  // The full user record (incl. linked organisations) the profile page fetches
  http.get(`${backendUrl}/users/:defraId`, () =>
    HttpResponse.json(backendUser)
  ),
  // Records the user sync PATCH so it can be asserted on
  http.patch(`${backendUrl}/users`, async ({ request }) => {
    backendRequests.push(await request.json())
    return new HttpResponse(null, { status: 204 })
  })
)

let server
let statusCodes
let startPath
let completeDefraSignIn
let getYarCookie

describe('Profile page', () => {
  beforeAll(async () => {
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
  })

  afterEach(() => {
    tokenClaims = { ...mockUser }
    backendRequests.length = 0
    backendUser = { ...defaultBackendUser, organisations: [] }
  })

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

    // The backend user has no linked organisations, so the empty state must be shown
    expect(profile.result).toContain('You are not linked to any organisations.')
  })

  it('sends a user to the home page when they sign in without requesting a protected page first', async () => {
    const { response: callback } = await completeDefraSignIn({ server })

    expect(callback.headers.location).toBe(startPath)
  })

  it('saves the signed-in user to nrf-backend when they reach an authenticated page', async () => {
    const challenge = await server.inject({ method: 'GET', url: PROFILE_PATH })

    const { cookie } = await completeDefraSignIn({
      server,
      cookie: getYarCookie(challenge)
    })

    const profile = await server.inject({
      method: 'GET',
      url: PROFILE_PATH,
      headers: { cookie }
    })

    expect(profile.statusCode).toBe(statusCodes.ok)

    // The sync is fire-and-forget, so wait for the PATCH to land on nrf-backend
    await vi.waitFor(() => {
      expect(backendRequests.length).toBeGreaterThan(0)
    })

    const [patch] = backendRequests
    expect(patch).toEqual({
      defraId: mockUser.sub,
      email: mockUser.email,
      firstName: mockUser.firstName,
      lastName: mockUser.lastName
    })
  })
})
