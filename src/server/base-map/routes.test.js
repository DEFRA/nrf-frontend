import { describe, it, expect, vi, beforeEach } from 'vitest'
import { http, HttpResponse } from 'msw'
import { setupMswServer } from '../../test-utils/setup-msw-server.js'

vi.mock('../../config/config.js', () => ({
  config: {
    get: vi.fn((key) => {
      if (key === 'map.osApiKey') return 'test-api-key'
      return null
    })
  }
}))

const mockLogger = vi.hoisted(() => ({
  error: vi.fn(),
  info: vi.fn(),
  warn: vi.fn()
}))

vi.mock('../common/helpers/logging/logger.js', () => ({
  createLogger: () => mockLogger
}))

const server = setupMswServer()

const { default: routes } = await import('./routes.js')

const handler = routes[0].handler

function createMockRequest({ path = '', query = {} } = {}) {
  return {
    params: { path },
    query,
    headers: {},
    server: { info: { protocol: 'http' } },
    info: { host: 'localhost:3000' }
  }
}

function createMockH() {
  const response = {
    type: vi.fn().mockReturnThis(),
    header: vi.fn().mockReturnThis(),
    code: vi.fn().mockReturnThis()
  }
  return {
    response: vi.fn().mockReturnValue(response),
    _response: response
  }
}

describe('base-map proxy routes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('route config', () => {
    it('should define a GET route at /base-map/{path*}', () => {
      expect(routes[0].method).toBe('GET')
      expect(routes[0].path).toBe('/base-map/{path*}')
    })

    it('should not require auth', () => {
      expect(routes[0].options.auth).toBe(false)
    })
  })

  describe('JSON responses (style, TileJSON)', () => {
    it('should proxy style requests and rewrite OS URLs', async () => {
      const osStyleBody = {
        sources: {
          osVectorTiles: {
            url: 'https://api.os.uk/maps/vector/v1/vts?key=test-api-key&srs=3857'
          }
        },
        sprite:
          'https://api.os.uk/maps/vector/v1/vts/resources/sprites/sprite?key=test-api-key&srs=3857',
        glyphs:
          'https://api.os.uk/maps/vector/v1/vts/resources/fonts/{fontstack}/{range}.pbf?key=test-api-key&srs=3857'
      }

      server.use(
        http.get('https://api.os.uk/maps/vector/v1/vts/resources/styles', () =>
          HttpResponse.json(osStyleBody, {
            headers: {
              'content-type': 'application/json',
              'cache-control': 'max-age=3600'
            }
          })
        )
      )

      const request = createMockRequest({ path: 'resources/styles' })
      const h = createMockH()

      await handler(request, h)

      const responseBody = h.response.mock.calls[0][0]
      expect(responseBody).toContain('http://localhost:3000/base-map')
      expect(responseBody).not.toContain('api.os.uk')
      expect(responseBody).not.toContain('test-api-key')
      expect(h._response.type).toHaveBeenCalledWith('application/json')
      expect(h._response.header).toHaveBeenCalledWith(
        'cache-control',
        'max-age=3600'
      )
    })

    it('should proxy TileJSON at the root path', async () => {
      const tileJson = {
        tiles: [
          'https://api.os.uk/maps/vector/v1/vts/tile/{z}/{y}/{x}.pbf?key=test-api-key&srs=3857'
        ]
      }

      server.use(
        http.get('https://api.os.uk/maps/vector/v1/vts', () =>
          HttpResponse.json(tileJson, {
            headers: { 'content-type': 'application/json' }
          })
        )
      )

      const request = createMockRequest()
      const h = createMockH()

      await handler(request, h)

      const responseBody = h.response.mock.calls[0][0]
      expect(responseBody).toContain(
        'http://localhost:3000/base-map/tile/{z}/{y}/{x}.pbf'
      )
    })

    it('should use x-forwarded-proto when present', async () => {
      server.use(
        http.get('https://api.os.uk/maps/vector/v1/vts/resources/styles', () =>
          HttpResponse.json({
            url: 'https://api.os.uk/maps/vector/v1/vts?key=test-api-key&srs=3857'
          })
        )
      )

      const request = createMockRequest({ path: 'resources/styles' })
      request.headers['x-forwarded-proto'] = 'https'
      const h = createMockH()

      await handler(request, h)

      const responseBody = h.response.mock.calls[0][0]
      expect(responseBody).toContain('https://localhost:3000/base-map')
    })
  })

  describe('binary responses (tiles, sprites)', () => {
    it('should proxy .pbf tiles without decompression', async () => {
      const tileData = new Uint8Array([0x1a, 0x02, 0x03])

      server.use(
        http.get(
          'https://api.os.uk/maps/vector/v1/vts/tile/7/63/42.pbf',
          () =>
            new HttpResponse(tileData, {
              headers: {
                'content-type': 'application/octet-stream',
                'cache-control': 'max-age=86400',
                'content-encoding': 'gzip'
              }
            })
        )
      )

      const request = createMockRequest({ path: 'tile/7/63/42.pbf' })
      const h = createMockH()

      await handler(request, h)

      expect(h.response).toHaveBeenCalled()
      expect(h._response.type).toHaveBeenCalledWith('application/octet-stream')
      expect(h._response.header).toHaveBeenCalledWith(
        'content-encoding',
        'gzip'
      )
      expect(h._response.header).toHaveBeenCalledWith(
        'cache-control',
        'max-age=86400'
      )
    })

    it('should not set content-encoding if upstream does not send it', async () => {
      server.use(
        http.get(
          'https://api.os.uk/maps/vector/v1/vts/resources/sprites/sprite.png',
          () =>
            new HttpResponse(new Uint8Array([0x89, 0x50, 0x4e, 0x47]), {
              headers: {
                'content-type': 'image/png',
                'cache-control': 'no-cache'
              }
            })
        )
      )

      const request = createMockRequest({
        path: 'resources/sprites/sprite.png'
      })
      const h = createMockH()

      await handler(request, h)

      const headerCalls = h._response.header.mock.calls.map((c) => c[0])
      expect(headerCalls).not.toContain('content-encoding')
    })
  })

  describe('error handling', () => {
    it('should pass through upstream error status codes', async () => {
      server.use(
        http.get(
          'https://api.os.uk/maps/vector/v1/vts/tile/15/10706/16499.pbf',
          () => new HttpResponse('Forbidden', { status: 403 })
        )
      )

      const request = createMockRequest({
        path: 'tile/15/10706/16499.pbf'
      })
      const h = createMockH()

      await handler(request, h)

      expect(h.response).toHaveBeenCalledWith(Buffer.from('Forbidden'))
      expect(h._response.code).toHaveBeenCalledWith(403)
    })

    it('should return 502 for network errors', async () => {
      server.use(
        http.get('https://api.os.uk/maps/vector/v1/vts/resources/styles', () =>
          HttpResponse.error()
        )
      )

      const request = createMockRequest({ path: 'resources/styles' })
      const h = createMockH()

      await handler(request, h)

      expect(h.response).toHaveBeenCalledWith('Map tile request failed')
      expect(h._response.code).toHaveBeenCalledWith(502)
      expect(mockLogger.error).toHaveBeenCalled()
    })
  })

  describe('URL construction', () => {
    it('should append API key and srs=3857 to all requests', async () => {
      let capturedUrl
      server.use(
        http.get(
          'https://api.os.uk/maps/vector/v1/vts/resources/styles',
          ({ request: req }) => {
            capturedUrl = new URL(req.url)
            return HttpResponse.json({})
          }
        )
      )

      const request = createMockRequest({ path: 'resources/styles' })
      const h = createMockH()

      await handler(request, h)

      expect(capturedUrl.searchParams.get('key')).toBe('test-api-key')
      expect(capturedUrl.searchParams.get('srs')).toBe('3857')
    })

    it('should forward query parameters from the client', async () => {
      let capturedUrl
      server.use(
        http.get(
          'https://api.os.uk/maps/vector/v1/vts/resources/styles',
          ({ request: req }) => {
            capturedUrl = new URL(req.url)
            return HttpResponse.json({})
          }
        )
      )

      const request = createMockRequest({
        path: 'resources/styles',
        query: { f: 'json' }
      })
      const h = createMockH()

      await handler(request, h)

      expect(capturedUrl.searchParams.get('f')).toBe('json')
    })
  })
})
