// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockSwaggerUIBundle = vi.fn()
mockSwaggerUIBundle.presets = { apis: 'apis-preset' }
const MockStandalonePreset = 'standalone-preset'

let mockXhrStatus
let mockXhrResponseText

function MockXMLHttpRequest() {
  this.open = vi.fn()
  this.send = vi.fn(() => {
    this.status = mockXhrStatus
    this.responseText = mockXhrResponseText
  })
}

beforeEach(() => {
  mockSwaggerUIBundle.mockClear()
  mockXhrStatus = 200
  mockXhrResponseText = JSON.stringify({ csrfToken: 'test-token' })
  globalThis.SwaggerUIBundle = mockSwaggerUIBundle
  globalThis.SwaggerUIStandalonePreset = MockStandalonePreset
  globalThis.XMLHttpRequest = MockXMLHttpRequest
})

async function loadInterceptor() {
  // Each import needs to re-trigger window.onload assignment
  vi.resetModules()
  await import('./swagger-initializer.js')
  window.onload()

  return mockSwaggerUIBundle.mock.calls[0][0].requestInterceptor
}

describe('swagger-initializer', () => {
  it('should initialise SwaggerUIBundle on window.onload', async () => {
    const interceptor = await loadInterceptor()

    expect(mockSwaggerUIBundle).toHaveBeenCalledWith(
      expect.objectContaining({
        url: '/swagger.json',
        dom_id: '#swagger-ui',
        presets: ['apis-preset', MockStandalonePreset],
        layout: 'StandaloneLayout'
      })
    )
    expect(interceptor).toBeTypeOf('function')
  })

  describe('requestInterceptor', () => {
    it('should not modify GET requests', async () => {
      const interceptor = await loadInterceptor()
      const req = { method: 'GET', headers: {} }

      const result = interceptor(req)

      expect(result).toEqual({ method: 'GET', headers: {} })
    })

    it('should not modify HEAD requests', async () => {
      const interceptor = await loadInterceptor()
      const req = { method: 'HEAD', headers: {} }

      const result = interceptor(req)

      expect(result).toEqual({ method: 'HEAD', headers: {} })
    })

    it('should add x-csrf-token header for JSON POST requests', async () => {
      const interceptor = await loadInterceptor()
      const req = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      }

      const result = interceptor(req)

      expect(result.headers['x-csrf-token']).toBe('test-token')
    })

    it('should append csrfToken to body for form-urlencoded POST requests', async () => {
      const interceptor = await loadInterceptor()
      const req = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: 'field=value'
      }

      const result = interceptor(req)

      expect(result.body).toBe('field=value&csrfToken=test-token')
    })

    it('should set csrfToken as body when form-urlencoded body is empty', async () => {
      const interceptor = await loadInterceptor()
      const req = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: ''
      }

      const result = interceptor(req)

      expect(result.body).toBe('csrfToken=test-token')
    })

    it('should add token for PUT requests', async () => {
      const interceptor = await loadInterceptor()
      const req = {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' }
      }

      const result = interceptor(req)

      expect(result.headers['x-csrf-token']).toBe('test-token')
    })

    it('should add token for DELETE requests', async () => {
      const interceptor = await loadInterceptor()
      const req = {
        method: 'DELETE',
        headers: {}
      }

      const result = interceptor(req)

      expect(result.headers['x-csrf-token']).toBe('test-token')
    })

    it('should not add token when csrf-token fetch fails', async () => {
      mockXhrStatus = 500
      const interceptor = await loadInterceptor()
      const req = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      }

      const result = interceptor(req)

      expect(result.headers['x-csrf-token']).toBeUndefined()
    })

    it('should encode the csrf token in form-urlencoded bodies', async () => {
      mockXhrResponseText = JSON.stringify({
        csrfToken: 'token with spaces&special=chars'
      })
      const interceptor = await loadInterceptor()
      const req = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: 'field=value'
      }

      const result = interceptor(req)

      expect(result.body).toBe(
        'field=value&csrfToken=token%20with%20spaces%26special%3Dchars'
      )
    })
  })
})
