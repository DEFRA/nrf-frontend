import { describe, it, expect, vi } from 'vitest'
import { redirectToSignIn } from './redirect-to-sign-in.js'
import { routePath as startPath } from '../manage/start-page/routes.js'

const DEFRA_SESSION = 'defra-session'
const PROFILE_PATH = '/profile'
const CONTINUE = Symbol.for('hapi.continue')

describe('redirectToSignIn', () => {
  it.each([
    [
      'when the request is not a GET',
      {
        method: 'post',
        path: PROFILE_PATH,
        route: { settings: { auth: DEFRA_SESSION } },
        auth: {}
      }
    ],
    [
      'when the route does not require authentication',
      {
        method: 'get',
        path: PROFILE_PATH,
        route: { settings: { auth: false } },
        auth: {}
      }
    ],
    [
      'when the route uses try mode',
      {
        method: 'get',
        path: PROFILE_PATH,
        route: { settings: { auth: DEFRA_SESSION } },
        auth: { mode: 'try' }
      }
    ],
    [
      'when the request is already authenticated',
      {
        method: 'get',
        path: PROFILE_PATH,
        route: { settings: { auth: DEFRA_SESSION } },
        auth: { mode: 'required', credentials: { sessionId: 'session-1' } }
      }
    ],
    [
      'when the route is one of the service auth endpoints',
      {
        method: 'get',
        path: '/auth/sign-out',
        route: { settings: { auth: DEFRA_SESSION } },
        auth: {}
      }
    ]
  ])('%s', (_title, request) => {
    const h = { continue: CONTINUE }

    expect(redirectToSignIn(request, h)).toBe(CONTINUE)
  })

  it('stores the requested path and redirects to sign-in when signed out', () => {
    const yar = { set: vi.fn() }
    const request = {
      method: 'get',
      path: PROFILE_PATH,
      route: { settings: { auth: DEFRA_SESSION } },
      auth: {},
      yar
    }
    const h = {
      redirect: (url) => ({
        location: url,
        takeover() {
          return this
        }
      })
    }

    const result = redirectToSignIn(request, h)

    expect(yar.set).toHaveBeenCalledWith('redirectTo', PROFILE_PATH)
    expect(result.location).toBe('/login')
  })

  it('falls back to the home page when the requested path is not a safe redirect', () => {
    const yar = { set: vi.fn() }
    const request = {
      method: 'get',
      path: 'https://evil.example.com/phish',
      route: { settings: { auth: DEFRA_SESSION } },
      auth: {},
      yar
    }

    redirectToSignIn(request, {
      redirect: (url) => ({
        location: url,
        takeover() {
          return this
        }
      })
    })

    expect(yar.set).toHaveBeenCalledWith('redirectTo', startPath)
  })
})
