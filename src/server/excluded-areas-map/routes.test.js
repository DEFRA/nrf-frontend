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

const excludedAreasTileServerBaseUrl = 'https://excluded-areas.example.com'

vi.mock('../../config/config.js', () => ({
  config: {
    get: vi.fn((key) => {
      if (key === 'map.excludedAreasTileServerBaseUrl') {
        return excludedAreasTileServerBaseUrl
      }
      return null
    })
  }
}))

const mswServer = setupMswServer()

const { default: routes, routePath } = await import('./routes.js')

const handler = routes[0].handler

function createMockRequest({ path = '' } = {}) {
  return {
    params: { path }
  }
}

function createMockH() {
  const response = {
    type: vi.fn().mockReturnThis(),
    code: vi.fn().mockReturnThis()
  }

  return {
    response: vi.fn().mockReturnValue(response),
    _response: response
  }
}

describe('excluded-areas-map routes', () => {
  it('exports expected route configuration', () => {
    expect(routePath).toBe('/excluded-areas-map')
    expect(routes[0].method).toBe('GET')
    expect(routes[0].path).toBe('/excluded-areas-map/{path*}')
    expect(routes[0].options.auth).toBe(false)
  })

  it('proxies a tile request to the configured upstream base URL', async () => {
    mswServer.use(
      http.get(
        `${excludedAreasTileServerBaseUrl}/impact-assessor-map/tiles/edp_boundaries/8/128/84.mvt`,
        () => new HttpResponse(Buffer.from('tile-binary'))
      )
    )

    const h = createMockH()
    await handler(
      createMockRequest({ path: 'tiles/edp_boundaries/8/128/84.mvt' }),
      h
    )

    expect(h.response).toHaveBeenCalledWith(expect.any(Buffer))
    expect(h._response.type).toHaveBeenCalledWith(
      'application/vnd.mapbox-vector-tile'
    )
  })

  it('passes through non-OK upstream status and body', async () => {
    mswServer.use(
      http.get(
        `${excludedAreasTileServerBaseUrl}/impact-assessor-map/missing/path`,
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
      http.get(
        `${excludedAreasTileServerBaseUrl}/impact-assessor-map/tiles/fail.mvt`,
        () => HttpResponse.error()
      )
    )

    const h = createMockH()
    await handler(createMockRequest({ path: 'tiles/fail.mvt' }), h)

    expect(h.response).toHaveBeenCalledWith(
      'Excluded areas tile request failed'
    )
    expect(h._response.code).toHaveBeenCalledWith(502)
    expect(mockLogger.error).toHaveBeenCalledWith(
      expect.any(Error),
      'Excluded areas proxy error for tiles/fail.mvt'
    )
  })
})
