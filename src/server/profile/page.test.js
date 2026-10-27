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
import { within } from '@testing-library/dom'

import { config } from '../../config/config.js'
import { defraIdSignInHandlers } from '../../test-utils/defra-id-sign-in-handlers.js'
import { setupMswServer } from '../../test-utils/setup-msw-server.js'
import { mockUser } from '../../test-utils/fixtures/mock-user.js'
import { loadPage } from '../../test-utils/load-page.js'
import {
  firstOrgName,
  multiOrgEmployeeClaims
} from '../../test-utils/fixtures/defra-id-org-claims.js'

const PROFILE_PATH = '/profile'
const SIGN_IN_PATH = '/auth/sign-in'

const backendUrl = config.get('backend').apiUrl

// Claims the mocked token endpoint issues; overridden per test, reset in afterEach
let tokenClaims = { ...mockUser }
const backendRequests = []

// The user record the mocked GET /users returns; overridden per test, reset in afterEach
const defaultBackendUser = {
  defraId: mockUser.sub,
  email: mockUser.email,
  firstName: mockUser.firstName,
  lastName: mockUser.lastName,
  organisations: []
}
let backendUser = { ...defaultBackendUser }

setupMswServer(
  ...defraIdSignInHandlers({
    getClaims: () => tokenClaims,
    onUserSync: (body) => backendRequests.push(body)
  }),
  // The full user record (incl. linked organisations) the profile page fetches
  http.get(`${backendUrl}/users`, () => HttpResponse.json(backendUser))
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

  describe('organisation heading', () => {
    const changeLinkName = 'Change organisation'

    const loadSignedInProfile = async () => {
      const { cookie } = await completeDefraSignIn({ server })
      const document = await loadPage({
        requestUrl: PROFILE_PATH,
        server,
        cookie
      })
      return document.body
    }

    it('shows the organisation name and a link back to this page for a user who can switch organisation', async () => {
      tokenClaims = { ...mockUser, ...multiOrgEmployeeClaims }

      const body = await loadSignedInProfile()

      expect(
        within(body).getByTestId('app-organisation-heading')
      ).toHaveTextContent(firstOrgName)
      expect(
        within(body).getByRole('link', { name: changeLinkName })
      ).toHaveAttribute(
        'href',
        '/auth/change-organisation?redirectTo=%2Fprofile'
      )
    })

    it('shows the user name without a change link when the user has no other organisation to switch to', async () => {
      const body = await loadSignedInProfile()

      expect(
        within(body).getByTestId('app-organisation-heading')
      ).toHaveTextContent(`${mockUser.name}`)
      expect(
        within(body).queryByRole('link', { name: changeLinkName })
      ).not.toBeInTheDocument()
    })
  })

  describe('changing organisation', () => {
    const changeOrganisationSignIn = '/auth/sign-in?change-organisation=true'

    it('asks Defra ID to show the organisation picker again', async () => {
      const change = await server.inject({
        method: 'GET',
        url: '/auth/change-organisation?redirectTo=%2Fprofile'
      })

      expect(change.statusCode).toBe(statusCodes.found)
      expect(change.headers.location).toBe(changeOrganisationSignIn)

      const signIn = await server.inject({
        method: 'GET',
        url: change.headers.location,
        headers: { cookie: getYarCookie(change) }
      })

      expect(
        new URL(signIn.headers.location).searchParams.get('forceReselection')
      ).toBe('true')
    })

    it.each([
      ['the page the user clicked the link on', '%2Fprofile', '/profile'],
      [
        'another page, including its query string',
        '%2Fquote%2Fsummary%3Ftab%3Da',
        '/quote/summary?tab=a'
      ]
    ])(
      'returns the user to %s after they pick an organisation',
      async (_, redirectTo, expected) => {
        const change = await server.inject({
          method: 'GET',
          url: `/auth/change-organisation?redirectTo=${redirectTo}`
        })

        const { response: callback } = await completeDefraSignIn({
          server,
          cookie: getYarCookie(change),
          signInUrl: changeOrganisationSignIn
        })

        expect(callback.headers.location).toBe(expected)
      }
    )

    it.each([
      ['an absolute URL', 'https%3A%2F%2Fevil.example.com'],
      ['a protocol-relative URL', '%2F%2Fevil.example.com'],
      ['a missing return page', undefined]
    ])(
      'sends the user to the start page instead of %s',
      async (_, redirectTo) => {
        const change = await server.inject({
          method: 'GET',
          url: redirectTo
            ? `/auth/change-organisation?redirectTo=${redirectTo}`
            : '/auth/change-organisation'
        })

        const { response: callback } = await completeDefraSignIn({
          server,
          cookie: getYarCookie(change),
          signInUrl: changeOrganisationSignIn
        })

        expect(callback.headers.location).toBe(startPath)
      }
    )
  })
})
