import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../../config/config.js', () => ({
  config: {
    get: vi.fn((key) => {
      if (key === 'map.impactAssessorBaseUrl') {
        return 'https://impact-assessor.example'
      }

      return null
    })
  }
}))

const mockLogger = vi.hoisted(() => ({
  debug: vi.fn(),
  error: vi.fn()
}))

vi.mock('../common/helpers/logging/logger.js', () => ({
  createLogger: () => mockLogger
}))

const { default: routes, routePath } = await import('./routes.js')
const handler = routes[0].handler

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
  })

  it('exports expected route configuration', () => {
    expect(routePath).toBe('/impact-assessor-map')
    expect(routes[0].method).toBe('GET')
    expect(routes[0].path).toBe('/impact-assessor-map/{path*}')
    expect(routes[0].options.auth).toBe(false)
  })

  it('proxies successful upstream response with headers', async () => {
    global.fetch = vi.fn().mockResolvedValue(
      createFetchResponse({
        body: 'tile-binary',
        contentType: 'application/x-protobuf',
        cacheControl: 'max-age=600'
      })
    )

    const request = createMockRequest({
      path: 'tiles/edp/7/1/2.mvt',
      query: { token: 'abc', v: '1' }
    })
    const h = createMockH()

    await handler(request, h)

    expect(global.fetch).toHaveBeenCalledWith(
      'https://impact-assessor.example/tiles/edp/7/1/2.mvt?token=abc&v=1',
      { redirect: 'follow' }
    )
    expect(h.response).toHaveBeenCalledWith(expect.any(Buffer))
    expect(h._response.type).toHaveBeenCalledWith('application/x-protobuf')
    expect(h._response.header).toHaveBeenCalledWith(
      'cache-control',
      'max-age=600'
    )
    expect(mockLogger.debug).toHaveBeenCalledWith(
      'Impact assessor proxy request: tiles/edp/7/1/2.mvt'
    )
  })

  it('uses defaults when upstream headers are absent', async () => {
    global.fetch = vi.fn().mockResolvedValue(
      createFetchResponse({
        body: 'default-headers',
        contentType: null,
        cacheControl: null
      })
    )

    const h = createMockH()
    await handler(createMockRequest(), h)

    expect(global.fetch).toHaveBeenCalledWith(
      'https://impact-assessor.example',
      {
        redirect: 'follow'
      }
    )
    expect(h._response.type).toHaveBeenCalledWith('')
    expect(h._response.header).toHaveBeenCalledWith('cache-control', 'no-cache')
    expect(mockLogger.debug).toHaveBeenCalledWith(
      'Impact assessor proxy request: /'
    )
  })

  it('passes through non-OK upstream status and body', async () => {
    global.fetch = vi.fn().mockResolvedValue(
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
    global.fetch = vi.fn().mockRejectedValue(networkError)

    const h = createMockH()
    await handler(createMockRequest({ path: 'tiles/fail.mvt' }), h)

    expect(h.response).toHaveBeenCalledWith(
      'Impact assessor tile request failed'
    )
    expect(h._response.code).toHaveBeenCalledWith(502)
    expect(mockLogger.error).toHaveBeenCalledWith(
      'Impact assessor proxy error for tiles/fail.mvt: boom (ENOTFOUND)'
    )
  })
})
