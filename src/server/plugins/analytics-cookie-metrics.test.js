import { vi } from 'vitest'
import { analyticsCookieMetrics } from './analytics-cookie-metrics.js'

const SESSION_KEY = 'analyticsCookiePreference'

function makeServer() {
  return { ext: vi.fn() }
}

function makeH() {
  return { continue: Symbol('continue') }
}

function makeRequest({ yarValue = null, analytics = null, path = '/' } = {}) {
  return {
    path,
    yar: {
      get: vi.fn().mockReturnValue(yarValue),
      set: vi.fn()
    },
    state: {
      ...(analytics !== null && {
        cookie_preferences: JSON.stringify({
          essential: true,
          analytics,
          version: 1,
          createdAt: new Date().toISOString()
        })
      })
    }
  }
}

describe('analyticsCookieMetrics plugin', () => {
  let handler
  let h

  beforeEach(() => {
    const server = makeServer()
    h = makeH()
    analyticsCookieMetrics.register(server)
    handler = server.ext.mock.calls.find((c) => c[0] === 'onPreHandler')[1]
  })

  describe('plugin registration', () => {
    it('has correct plugin name', () => {
      expect(analyticsCookieMetrics.name).toBe('analytics-cookie-metrics')
    })

    it('registers an onPreHandler extension', () => {
      const server = makeServer()
      analyticsCookieMetrics.register(server)
      expect(server.ext).toHaveBeenCalledWith(
        'onPreHandler',
        expect.any(Function)
      )
    })
  })

  describe('excluded — no yar session', () => {
    it('does nothing when request.yar is not available', async () => {
      const request = { path: '/', state: {} }
      const result = await handler(request, h)
      expect(result).toBe(h.continue)
    })
  })

  describe('excluded paths', () => {
    it.each([
      '/health',
      '/version',
      '/favicon.ico',
      '/public/javascripts/app.js'
    ])('does nothing for %s', async (path) => {
      const request = makeRequest({ path })
      const result = await handler(request, h)
      expect(result).toBe(h.continue)
      expect(request.yar.set).not.toHaveBeenCalled()
    })
  })

  describe('first request — no session key set', () => {
    it('sets session to "shown"', async () => {
      const request = makeRequest({ yarValue: null, analytics: null })
      await handler(request, h)
      expect(request.yar.set).toHaveBeenCalledWith(SESSION_KEY, 'shown')
    })
  })

  describe('session is "shown", user has since accepted', () => {
    it('sets session to "accepted"', async () => {
      const request = makeRequest({ yarValue: 'shown', analytics: true })
      await handler(request, h)
      expect(request.yar.set).toHaveBeenCalledWith(SESSION_KEY, 'accepted')
    })
  })

  describe('session is "shown", user has since rejected', () => {
    it('sets session to "rejected"', async () => {
      const request = makeRequest({ yarValue: 'shown', analytics: false })
      await handler(request, h)
      expect(request.yar.set).toHaveBeenCalledWith(SESSION_KEY, 'rejected')
    })
  })

  describe('session is "shown", no cookie_preferences yet', () => {
    it('does nothing', async () => {
      const request = makeRequest({ yarValue: 'shown', analytics: null })
      await handler(request, h)
      expect(request.yar.set).not.toHaveBeenCalled()
    })
  })

  describe('session is "accepted", cookie_preferences still present', () => {
    it('does nothing', async () => {
      const request = makeRequest({ yarValue: 'accepted', analytics: true })
      await handler(request, h)
      expect(request.yar.set).not.toHaveBeenCalled()
    })
  })

  describe('session is "rejected", cookie_preferences still present', () => {
    it('does nothing', async () => {
      const request = makeRequest({ yarValue: 'rejected', analytics: false })
      await handler(request, h)
      expect(request.yar.set).not.toHaveBeenCalled()
    })
  })

  describe('cookie_preferences deleted after accepting', () => {
    it('resets session to "shown"', async () => {
      const request = makeRequest({ yarValue: 'accepted', analytics: null })
      await handler(request, h)
      expect(request.yar.set).toHaveBeenCalledWith(SESSION_KEY, 'shown')
    })
  })

  describe('cookie_preferences deleted after rejecting', () => {
    it('resets session to "shown"', async () => {
      const request = makeRequest({ yarValue: 'rejected', analytics: null })
      await handler(request, h)
      expect(request.yar.set).toHaveBeenCalledWith(SESSION_KEY, 'shown')
    })
  })

  describe('return value', () => {
    it('always returns h.continue', async () => {
      const request = makeRequest()
      const result = await handler(request, h)
      expect(result).toBe(h.continue)
    })
  })
})
