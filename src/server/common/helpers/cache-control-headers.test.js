import { setupTestServer } from '../../../test-utils/setup-test-server.js'
import { applyCacheControlHeaders } from './cache-control-headers.js'

const noStoreHeader = 'no-store, no-cache, must-revalidate, max-age=0'

describe('#applyCacheControlHeaders', () => {
  const h = { continue: Symbol('continue') }

  it('should set the no-store header on a normal response', () => {
    const headers = {}
    const request = {
      response: { headers, header: (name, value) => (headers[name] = value) }
    }
    const result = applyCacheControlHeaders(request, h)
    expect(headers['Cache-Control']).toBe(noStoreHeader)
    expect(result).toBe(h.continue)
  })

  it('should set the no-store header on a Boom error response', () => {
    const headers = {}
    const request = { response: { isBoom: true, output: { headers } } }
    const result = applyCacheControlHeaders(request, h)
    expect(headers['cache-control']).toBe(noStoreHeader)
    expect(result).toBe(h.continue)
  })

  it.each([
    'public, max-age=3600',
    'public, max-age=86400, immutable',
    // Licensed imagery restricted to the one browser, never a shared cache.
    'private, max-age=86400',
    'private, max-age=60'
  ])(
    'should leave a response opting into caching with %s untouched',
    (cacheControl) => {
      const headers = { 'cache-control': cacheControl }
      const header = vi.fn()
      const request = { response: { headers, header } }
      const result = applyCacheControlHeaders(request, h)
      expect(header).not.toHaveBeenCalled()
      expect(headers['cache-control']).toBe(cacheControl)
      expect(result).toBe(h.continue)
    }
  )

  it.each([
    // Hapi's default on a route with no cache config — not an opt-in.
    'no-cache',
    'no-store',
    'no-store, no-cache, must-revalidate, max-age=0',
    'max-age=3600',
    // Substrings of the directives must not be mistaken for the real thing.
    'no-cache, publicity=1',
    'privateer'
  ])('should lock down a response with %s', (cacheControl) => {
    const headers = { 'cache-control': cacheControl }
    const request = {
      response: { headers, header: (name, value) => (headers[name] = value) }
    }
    const result = applyCacheControlHeaders(request, h)
    expect(headers['Cache-Control']).toBe(noStoreHeader)
    expect(result).toBe(h.continue)
  })
})

describe('#cacheControlHeaders (integration)', () => {
  const getServer = setupTestServer()

  it('should set the no-store header on a rendered page response', async () => {
    const resp = await getServer().inject({ method: 'GET', url: '/' })
    expect(resp.headers['cache-control']).toBe(noStoreHeader)
  })

  it('should set the no-store header on a Boom error response', async () => {
    const resp = await getServer().inject({
      method: 'GET',
      url: '/this-route-does-not-exist'
    })
    expect(resp.headers['cache-control']).toBe(noStoreHeader)
  })
})
