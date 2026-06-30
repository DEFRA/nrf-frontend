import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockLogger = vi.hoisted(() => ({
  debug: vi.fn(),
  error: vi.fn()
}))

vi.mock('../common/helpers/logging/logger.js', () => ({
  createLogger: () => mockLogger
}))

vi.mock('../common/services/ia-map-tile-server.js', () => ({
  getMapTile: vi.fn()
}))

const tileCacheConfig = vi.hoisted(() => ({ enabled: true }))

vi.mock('../../config/config.js', () => ({
  config: {
    get: vi.fn((key) => {
      if (key === 'map.tileCacheEnabled') {
        return tileCacheConfig.enabled
      }
      if (key === 'map.tileCacheControlMaxAge') {
        return 86400
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

const { default: routes, routePath } = await import('./routes.js')
import { getMapTile } from '../common/services/ia-map-tile-server.js'
import { getCachedTile, setCachedTile } from '../common/services/tile-cache.js'

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

function createFetchResponse({
  ok = true,
  status = 200,
  body = 'payload',
  contentType = 'application/json',
  cacheControl = 'max-age=120'
} = {}) {
  return {
    ok,
    status,
    headers: {
      get: vi.fn((name) => {
        if (name === 'content-type') {
          return contentType
        }

        if (name === 'cache-control') {
          return cacheControl
        }

        return null
      })
    },
    arrayBuffer: vi.fn(async () => Buffer.from(body)),
    json: vi.fn(async () => ({ ok: true }))
  }
}

describe('impact-assessor-map routes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    tileCacheConfig.enabled = true
  })

  it('exports expected route configuration', () => {
    expect(routePath).toBe('/impact-assessor-map')
    expect(routes[0].method).toBe('GET')
    expect(routes[0].path).toBe('/impact-assessor-map/{path*}')
    expect(routes[0].options.auth).toBe(false)
  })

  it('proxies non-tile responses with upstream headers', async () => {
    vi.mocked(getMapTile).mockResolvedValue(
      createFetchResponse({
        body: 'tile-binary',
        contentType: 'application/x-protobuf',
        cacheControl: 'max-age=600'
      })
    )

    const request = createMockRequest({
      path: 'boundary-validation',
      query: { token: 'abc', v: '1' }
    })
    const h = createMockH()

    await handler(request, h)

    expect(getMapTile).toHaveBeenCalledWith('boundary-validation', request)
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

    expect(getMapTile).not.toHaveBeenCalled()
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
    vi.mocked(getMapTile).mockResolvedValue(
      createFetchResponse({ body: 'fresh-tile' })
    )

    const h = createMockH()
    await handler(createMockRequest({ path: 'tiles/edp/7/1/2.mvt' }), h)

    expect(getMapTile).toHaveBeenCalled()
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
    vi.mocked(getMapTile).mockResolvedValue(
      createFetchResponse({ body: 'fresh-tile' })
    )

    const h = createMockH()
    const request = createMockRequest({
      path: 'tiles/edp/7/1/2.mvt',
      query: { token: 'abc', variant: 'full' }
    })
    await handler(request, h)

    expect(getMapTile).toHaveBeenCalledWith('tiles/edp/7/1/2.mvt', request)
    expect(getCachedTile).toHaveBeenCalledWith('tiles/edp/7/1/2.mvt')
    expect(setCachedTile).toHaveBeenCalledWith(
      'tiles/edp/7/1/2.mvt',
      expect.any(Buffer)
    )
  })

  it('does not cache non-OK tile responses', async () => {
    vi.mocked(getCachedTile).mockResolvedValue(null)
    vi.mocked(getMapTile).mockResolvedValue(
      createFetchResponse({ ok: false, status: 404, body: 'missing' })
    )

    const h = createMockH()
    await handler(createMockRequest({ path: 'tiles/edp/7/1/2.mvt' }), h)

    expect(setCachedTile).not.toHaveBeenCalled()
    expect(h._response.code).toHaveBeenCalledWith(404)
  })

  it('bypasses the cache when tile caching is disabled', async () => {
    tileCacheConfig.enabled = false
    vi.mocked(getMapTile).mockResolvedValue(
      createFetchResponse({ contentType: 'application/x-protobuf' })
    )

    const h = createMockH()
    await handler(createMockRequest({ path: 'tiles/edp/7/1/2.mvt' }), h)

    expect(getCachedTile).not.toHaveBeenCalled()
    expect(setCachedTile).not.toHaveBeenCalled()
    expect(h._response.type).toHaveBeenCalledWith('application/x-protobuf')
  })

  it('uses defaults when upstream headers are absent', async () => {
    vi.mocked(getMapTile).mockResolvedValue(
      createFetchResponse({
        body: 'default-headers',
        contentType: null,
        cacheControl: null
      })
    )

    const h = createMockH()
    await handler(createMockRequest(), h)

    expect(getMapTile).toHaveBeenCalledWith('', expect.any(Object))
    expect(h._response.type).toHaveBeenCalledWith('')
    expect(h._response.header).toHaveBeenCalledWith('cache-control', 'no-cache')
  })

  it('passes through non-OK upstream status and body', async () => {
    vi.mocked(getMapTile).mockResolvedValue(
      createFetchResponse({
        ok: false,
        status: 404,
        body: 'missing'
      })
    )

    const h = createMockH()
    await handler(createMockRequest({ path: 'missing/path' }), h)

    expect(h.response).toHaveBeenCalledWith(expect.any(Buffer))
    expect(h._response.code).toHaveBeenCalledWith(404)
  })

  it('returns bad gateway and logs network errors', async () => {
    const networkError = Object.assign(new Error('boom'), { code: 'ENOTFOUND' })
    vi.mocked(getMapTile).mockRejectedValue(networkError)

    const h = createMockH()
    await handler(createMockRequest({ path: 'tiles/fail.mvt' }), h)

    expect(h.response).toHaveBeenCalledWith(
      'Impact assessor tile request failed'
    )
    expect(h._response.code).toHaveBeenCalledWith(502)
    expect(mockLogger.error).toHaveBeenCalledWith(
      networkError,
      'Impact assessor proxy error for tiles/fail.mvt'
    )
  })
})
