import { describe, expect, it, vi } from 'vitest'
import { http, HttpResponse } from 'msw'
import { setupMswServer } from '../../test-utils/setup-msw-server.js'

const mockLogger = vi.hoisted(() => ({
  debug: vi.fn(),
  info: vi.fn(),
  error: vi.fn()
}))

vi.mock('../common/helpers/logging/logger.js', () => ({
  createLogger: () => mockLogger
}))

const impactAssessorBaseUrl = 'http://localhost:8085'

vi.mock('../../config/config.js', () => ({
  config: {
    get: vi.fn((key) => {
      if (key === 'map.tileCacheControlMaxAge') {
        return 86400
      }
      if (key === 'map.impactAssessorBaseUrl') {
        return impactAssessorBaseUrl
      }
      if (key === 'tracing.header') {
        return 'x-cdp-request-id'
      }
      if (key === 'map.impactAssessorApiKey') {
        return ''
      }
      return null
    })
  }
}))

vi.mock('../common/services/tile-cache.js', () => ({
  getCachedTile: vi.fn(),
  setCachedTile: vi.fn(),
  isCacheableTilePath: vi.fn((path) => /\.mvt$/.test(path))
}))

const mswServer = setupMswServer()

const { default: routes, routePath } = await import('./routes.js')
const { getCachedTile, setCachedTile } =
  await import('../common/services/tile-cache.js')

const handler = routes[0].handler
const tileCacheControl = 'public, max-age=86400, immutable'

function createMockRequest({ path = '', query = {} } = {}) {
  return {
    params: { path },
    query
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

describe('impact-assessor-map routes', () => {
  it('exports expected route configuration', () => {
    expect(routePath).toBe('/impact-assessor-map')
    expect(routes[0].method).toBe('GET')
    expect(routes[0].path).toBe('/impact-assessor-map/{path*}')
    expect(routes[0].options.auth).toBe(false)
  })

  it('proxies non-tile responses with upstream headers', async () => {
    mswServer.use(
      http.get(`${impactAssessorBaseUrl}/boundary-validation`, () => {
        return new HttpResponse(Buffer.from('tile-binary'), {
          headers: {
            'content-type': 'application/x-protobuf',
            'cache-control': 'max-age=600'
          }
        })
      })
    )

    const request = createMockRequest({
      path: 'boundary-validation',
      query: { token: 'abc', v: '1' }
    })
    const h = createMockH()

    await handler(request, h)

    expect(getCachedTile).not.toHaveBeenCalled()
    expect(h.response).toHaveBeenCalledWith(expect.any(Buffer))
    expect(h._response.type).toHaveBeenCalledWith('application/x-protobuf')
    expect(h._response.header).toHaveBeenCalledWith(
      'cache-control',
      'max-age=600'
    )
  })

  it('serves a cached tile without calling upstream', async () => {
    const cached = Buffer.from('cached-tile')
    vi.mocked(getCachedTile).mockResolvedValue(cached)

    const h = createMockH()
    await handler(createMockRequest({ path: 'tiles/edp/7/1/2.mvt' }), h)

    expect(h.response).toHaveBeenCalledWith(cached)
    expect(h._response.type).toHaveBeenCalledWith(
      'application/vnd.mapbox-vector-tile'
    )
    expect(h._response.header).toHaveBeenCalledWith(
      'cache-control',
      tileCacheControl
    )
  })

  it('fetches, caches and labels a tile on cache miss', async () => {
    vi.mocked(getCachedTile).mockResolvedValue(null)
    mswServer.use(
      http.get(
        `${impactAssessorBaseUrl}/tiles/edp/7/1/2.mvt`,
        () => new HttpResponse(Buffer.from('fresh-tile'))
      )
    )

    const h = createMockH()
    await handler(createMockRequest({ path: 'tiles/edp/7/1/2.mvt' }), h)

    expect(setCachedTile).toHaveBeenCalledWith(
      'tiles/edp/7/1/2.mvt',
      expect.any(Buffer)
    )
    expect(h._response.type).toHaveBeenCalledWith(
      'application/vnd.mapbox-vector-tile'
    )
    expect(h._response.header).toHaveBeenCalledWith(
      'cache-control',
      tileCacheControl
    )
  })

  it('keys the cache on the tile path only, ignoring query params', async () => {
    vi.mocked(getCachedTile).mockResolvedValue(null)
    let capturedUrl
    mswServer.use(
      http.get(
        `${impactAssessorBaseUrl}/tiles/edp/7/1/2.mvt`,
        ({ request: req }) => {
          capturedUrl = new URL(req.url)
          return new HttpResponse(Buffer.from('fresh-tile'))
        }
      )
    )

    const h = createMockH()
    const request = createMockRequest({
      path: 'tiles/edp/7/1/2.mvt',
      query: { token: 'abc', variant: 'full' }
    })
    await handler(request, h)

    expect(capturedUrl.searchParams.get('token')).toBe('abc')
    expect(capturedUrl.searchParams.get('variant')).toBe('full')
    expect(getCachedTile).toHaveBeenCalledWith('tiles/edp/7/1/2.mvt')
    expect(setCachedTile).toHaveBeenCalledWith(
      'tiles/edp/7/1/2.mvt',
      expect.any(Buffer)
    )
  })

  it('does not cache non-OK tile responses', async () => {
    vi.mocked(getCachedTile).mockResolvedValue(null)
    mswServer.use(
      http.get(
        `${impactAssessorBaseUrl}/tiles/edp/7/1/2.mvt`,
        () => new HttpResponse('missing', { status: 404 })
      )
    )

    const h = createMockH()
    await handler(createMockRequest({ path: 'tiles/edp/7/1/2.mvt' }), h)

    expect(setCachedTile).not.toHaveBeenCalled()
    expect(h._response.code).toHaveBeenCalledWith(404)
  })

  it('uses defaults when upstream headers are absent', async () => {
    mswServer.use(
      http.get(
        impactAssessorBaseUrl,
        () => new HttpResponse(Buffer.from('default-headers'))
      )
    )

    const h = createMockH()
    await handler(createMockRequest(), h)

    expect(h._response.type).toHaveBeenCalledWith('')
    expect(h._response.header).toHaveBeenCalledWith('cache-control', 'no-cache')
  })

  it('passes through non-OK upstream status and body', async () => {
    mswServer.use(
      http.get(
        `${impactAssessorBaseUrl}/missing/path`,
        () => new HttpResponse('missing', { status: 404 })
      )
    )

    const h = createMockH()
    await handler(createMockRequest({ path: 'missing/path' }), h)

    expect(h.response).toHaveBeenCalledWith(expect.any(Buffer))
    expect(h._response.code).toHaveBeenCalledWith(404)
  })

  it('returns bad gateway and logs network errors', async () => {
    mswServer.use(
      http.get(`${impactAssessorBaseUrl}/tiles/fail.mvt`, () =>
        HttpResponse.error()
      )
    )

    const h = createMockH()
    await handler(createMockRequest({ path: 'tiles/fail.mvt' }), h)

    expect(h.response).toHaveBeenCalledWith(
      'Impact assessor tile request failed'
    )
    expect(h._response.code).toHaveBeenCalledWith(502)
    expect(mockLogger.error).toHaveBeenCalledWith(
      expect.any(Error),
      'Impact assessor proxy error for tiles/fail.mvt'
    )
  })
})
