import { setupTestServer } from '../../../test-utils/setup-test-server.js'
import { applySecurityHeaders } from './security-headers.js'

const expectedHeaders = {
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=()',
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Cross-Origin-Embedder-Policy': 'require-corp',
  'Cross-Origin-Resource-Policy': 'same-origin',
  'Referrer-Policy': 'strict-origin-when-cross-origin'
}

describe('#applySecurityHeaders', () => {
  const h = { continue: Symbol('continue') }

  it('should set headers on a normal response', () => {
    const headers = {}
    const request = { response: { headers } }
    const result = applySecurityHeaders(request, h)
    expect(headers).toMatchObject(expectedHeaders)
    expect(result).toBe(h.continue)
  })

  it('should set headers on a Boom error response', () => {
    const headers = {}
    const request = { response: { isBoom: true, output: { headers } } }
    const result = applySecurityHeaders(request, h)
    expect(headers).toMatchObject(expectedHeaders)
    expect(result).toBe(h.continue)
  })
})

describe('#securityHeaders', () => {
  const getServer = setupTestServer()

  describe('successful response', () => {
    let resp

    beforeAll(async () => {
      resp = await getServer().inject({ method: 'GET', url: '/' })
    })

    it('should set Permissions-Policy', () => {
      expect(resp.headers['permissions-policy']).toBe(
        'camera=(), microphone=(), geolocation=(), payment=()'
      )
    })

    it('should set Cross-Origin-Opener-Policy', () => {
      expect(resp.headers['cross-origin-opener-policy']).toBe('same-origin')
    })

    it('should set Cross-Origin-Embedder-Policy', () => {
      expect(resp.headers['cross-origin-embedder-policy']).toBe('require-corp')
    })

    it('should set Cross-Origin-Resource-Policy', () => {
      expect(resp.headers['cross-origin-resource-policy']).toBe('same-origin')
    })

    it('should set Referrer-Policy', () => {
      expect(resp.headers['referrer-policy']).toBe(
        'strict-origin-when-cross-origin'
      )
    })
  })

  describe('error response', () => {
    let resp

    beforeAll(async () => {
      resp = await getServer().inject({
        method: 'GET',
        url: '/non-existent-route'
      })
    })

    it('should set Permissions-Policy', () => {
      expect(resp.headers['permissions-policy']).toBe(
        'camera=(), microphone=(), geolocation=(), payment=()'
      )
    })

    it('should set Cross-Origin-Opener-Policy', () => {
      expect(resp.headers['cross-origin-opener-policy']).toBe('same-origin')
    })

    it('should set Cross-Origin-Embedder-Policy', () => {
      expect(resp.headers['cross-origin-embedder-policy']).toBe('require-corp')
    })

    it('should set Cross-Origin-Resource-Policy', () => {
      expect(resp.headers['cross-origin-resource-policy']).toBe('same-origin')
    })

    it('should set Referrer-Policy', () => {
      expect(resp.headers['referrer-policy']).toBe(
        'strict-origin-when-cross-origin'
      )
    })
  })
})
