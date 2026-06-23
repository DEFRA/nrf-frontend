import { setupTestServer } from '../../../test-utils/setup-test-server.js'

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
