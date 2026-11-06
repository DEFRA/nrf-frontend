import { describe, it, expect } from 'vitest'

import { setupSignedInTestServer } from '../../test-utils/setup-signed-in-test-server.js'
import { getYarCookie } from '../../test-utils/yar-cookie.js'

const startPath = '/manage/start-page'
const changeOrganisationSignIn = '/auth/sign-in?change-organisation=true'

describe('Changing organisation', () => {
  const { getServer, signIn } = setupSignedInTestServer()

  it('sends a user to the start page when they sign in without requesting a protected page first', async () => {
    const { response } = await signIn()

    expect(response.headers.location).toBe(startPath)
  })

  it('asks Defra ID to show the organisation picker again', async () => {
    const change = await getServer().inject({
      method: 'GET',
      url: '/auth/change-organisation?redirectTo=%2Fquote%2Fsummary'
    })

    expect(change.statusCode).toBe(302)
    expect(change.headers.location).toBe(changeOrganisationSignIn)

    const signInResponse = await getServer().inject({
      method: 'GET',
      url: change.headers.location,
      headers: { cookie: getYarCookie(change) }
    })

    expect(
      new URL(signInResponse.headers.location).searchParams.get(
        'forceReselection'
      )
    ).toBe('true')
  })

  it.each([
    ['a simple path', '%2Fquote%2Fsummary', '/quote/summary'],
    [
      'a path including its query string',
      '%2Fquote%2Fsummary%3Ftab%3Da',
      '/quote/summary?tab=a'
    ]
  ])(
    'returns the user to %s after they pick an organisation',
    async (_, redirectTo, expected) => {
      const change = await getServer().inject({
        method: 'GET',
        url: `/auth/change-organisation?redirectTo=${redirectTo}`
      })

      const { response } = await signIn({
        cookie: getYarCookie(change),
        signInUrl: changeOrganisationSignIn
      })

      expect(response.headers.location).toBe(expected)
    }
  )

  it.each([
    ['an absolute URL', 'https%3A%2F%2Fevil.example.com'],
    ['a protocol-relative URL', '%2F%2Fevil.example.com'],
    ['a missing return page', undefined]
  ])(
    'sends the user to the start page instead of %s',
    async (_, redirectTo) => {
      const change = await getServer().inject({
        method: 'GET',
        url: redirectTo
          ? `/auth/change-organisation?redirectTo=${redirectTo}`
          : '/auth/change-organisation'
      })

      const { response } = await signIn({
        cookie: getYarCookie(change),
        signInUrl: changeOrganisationSignIn
      })

      expect(response.headers.location).toBe(startPath)
    }
  )
})
