import { vi } from 'vitest'
import { analyticsCookieMetrics } from './analytics-cookie-metrics.js'
import { metricsCounter } from '../common/helpers/metrics.js'

vi.mock('../common/helpers/metrics.js')

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
      _store: { [SESSION_KEY]: yarValue },
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
      expect(metricsCounter).not.toHaveBeenCalled()
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
      expect(metricsCounter).not.toHaveBeenCalled()
      expect(request.yar.set).not.toHaveBeenCalled()
    })
  })

  describe('first request — no session key set', () => {
    it('sets session to "shown" and fires BannerShown metric', async () => {
      const request = makeRequest({ yarValue: null, analytics: null })
      await handler(request, h)
      expect(request.yar.set).toHaveBeenCalledWith(SESSION_KEY, 'shown')
      expect(metricsCounter).toHaveBeenCalledWith('analyticsCookieBannerShown')
    })

    it('does not fire accepted/rejected metrics', async () => {
      const request = makeRequest({ yarValue: null, analytics: null })
      await handler(request, h)
      expect(metricsCounter).not.toHaveBeenCalledWith(
        'analyticsCookiesAccepted'
      )
      expect(metricsCounter).not.toHaveBeenCalledWith(
        'analyticsCookiesRejected'
      )
    })
  })

  describe('session is "shown", user has since accepted', () => {
    it('sets session to "accepted" and fires Accepted metric', async () => {
      const request = makeRequest({ yarValue: 'shown', analytics: true })
      await handler(request, h)
      expect(request.yar.set).toHaveBeenCalledWith(SESSION_KEY, 'accepted')
      expect(metricsCounter).toHaveBeenCalledWith('analyticsCookiesAccepted')
    })
  })

  describe('session is "shown", user has since rejected', () => {
    it('sets session to "rejected" and fires Rejected metric', async () => {
      const request = makeRequest({ yarValue: 'shown', analytics: false })
      await handler(request, h)
      expect(request.yar.set).toHaveBeenCalledWith(SESSION_KEY, 'rejected')
      expect(metricsCounter).toHaveBeenCalledWith('analyticsCookiesRejected')
    })
  })

  describe('session is "shown", no cookie_preferences yet', () => {
    it('does nothing', async () => {
      const request = makeRequest({ yarValue: 'shown', analytics: null })
      await handler(request, h)
      expect(request.yar.set).not.toHaveBeenCalled()
      expect(metricsCounter).not.toHaveBeenCalled()
    })
  })

  describe('session is "accepted", cookie_preferences still present', () => {
    it('does nothing', async () => {
      const request = makeRequest({ yarValue: 'accepted', analytics: true })
      await handler(request, h)
      expect(request.yar.set).not.toHaveBeenCalled()
      expect(metricsCounter).not.toHaveBeenCalled()
    })
  })

  describe('session is "rejected", cookie_preferences still present', () => {
    it('does nothing', async () => {
      const request = makeRequest({ yarValue: 'rejected', analytics: false })
      await handler(request, h)
      expect(request.yar.set).not.toHaveBeenCalled()
      expect(metricsCounter).not.toHaveBeenCalled()
    })
  })

  describe('cookie_preferences deleted after accepting', () => {
    it('resets session to "shown" and fires BannerShown metric', async () => {
      const request = makeRequest({ yarValue: 'accepted', analytics: null })
      await handler(request, h)
      expect(request.yar.set).toHaveBeenCalledWith(SESSION_KEY, 'shown')
      expect(metricsCounter).toHaveBeenCalledWith('analyticsCookieBannerShown')
    })
  })

  describe('cookie_preferences deleted after rejecting', () => {
    it('resets session to "shown" and fires BannerShown metric', async () => {
      const request = makeRequest({ yarValue: 'rejected', analytics: null })
      await handler(request, h)
      expect(request.yar.set).toHaveBeenCalledWith(SESSION_KEY, 'shown')
      expect(metricsCounter).toHaveBeenCalledWith('analyticsCookieBannerShown')
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
