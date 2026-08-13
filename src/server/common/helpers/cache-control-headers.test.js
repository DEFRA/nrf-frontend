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

  it('should leave a response that opts into public caching untouched', () => {
    const headers = { 'cache-control': 'public, max-age=3600' }
    const header = vi.fn()
    const request = { response: { headers, header } }
    const result = applyCacheControlHeaders(request, h)
    expect(header).not.toHaveBeenCalled()
    expect(headers['cache-control']).toBe('public, max-age=3600')
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
