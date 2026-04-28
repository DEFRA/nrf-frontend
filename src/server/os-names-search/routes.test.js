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
  warn: vi.fn()
}))

vi.mock('../common/helpers/logging/logger.js', () => ({
  createLogger: () => mockLogger
}))

const server = setupMswServer()

const { default: routes } = await import('./routes.js')

const handler = routes[0].handler

function createMockRequest({ query = {} } = {}) {
  return { query }
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

describe('os-names-search proxy routes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('route config', () => {
    it('defines a GET route at /os-names-search', () => {
      expect(routes[0].method).toBe('GET')
      expect(routes[0].path).toBe('/os-names-search')
    })

    it('does not require authentication', () => {
      expect(routes[0].options.auth).toBe(false)
    })
  })

  describe('handler', () => {
    it('proxies query to OS Names API with API key and returns JSON', async () => {
      const osNamesResponse = {
        results: [{ GAZETTEER_ENTRY: { NAME1: 'London', TYPE: 'City' } }]
      }

      server.use(
        http.get('https://api.os.uk/search/names/v1/find', ({ request }) => {
          const url = new URL(request.url)
          if (
            url.searchParams.get('query') === 'London' &&
            url.searchParams.get('key') === 'test-api-key'
          ) {
            return HttpResponse.json(osNamesResponse)
          }
          return new HttpResponse(null, { status: 400 })
        })
      )

      const request = createMockRequest({ query: { query: 'London' } })
      const h = createMockH()

      await handler(request, h)

      expect(h.response).toHaveBeenCalledWith(osNamesResponse)
      expect(h._response.type).toHaveBeenCalledWith('application/json')
    })

    it('returns empty results without calling the API when query is blank', async () => {
      const request = createMockRequest({ query: { query: '   ' } })
      const h = createMockH()

      await handler(request, h)

      expect(h.response).toHaveBeenCalledWith({ results: [] })
      expect(h._response.code).toHaveBeenCalledWith(200)
    })

    it('returns empty results without calling the API when query param is missing', async () => {
      const request = createMockRequest({ query: {} })
      const h = createMockH()

      await handler(request, h)

      expect(h.response).toHaveBeenCalledWith({ results: [] })
      expect(h._response.code).toHaveBeenCalledWith(200)
    })

    it('trims whitespace from query before sending to OS Names API', async () => {
      const osNamesResponse = { results: [] }

      server.use(
        http.get('https://api.os.uk/search/names/v1/find', ({ request }) => {
          const url = new URL(request.url)
          if (url.searchParams.get('query') === 'London') {
            return HttpResponse.json(osNamesResponse)
          }
          return new HttpResponse(null, { status: 400 })
        })
      )

      const request = createMockRequest({ query: { query: '  London  ' } })
      const h = createMockH()

      await handler(request, h)

      expect(h.response).toHaveBeenCalledWith(osNamesResponse)
    })

    it('returns upstream status and logs warn when OS Names API returns non-ok', async () => {
      server.use(
        http.get('https://api.os.uk/search/names/v1/find', () => {
          return new HttpResponse(null, { status: 503 })
        })
      )

      const request = createMockRequest({ query: { query: 'London' } })
      const h = createMockH()

      await handler(request, h)

      expect(h._response.code).toHaveBeenCalledWith(503)
      expect(mockLogger.warn).toHaveBeenCalledWith(
        expect.objectContaining({ status: 503, duration: expect.any(Number) }),
        'OS Names proxy upstream error'
      )
    })

    it('returns 502 and logs error when fetch throws', async () => {
      server.use(
        http.get('https://api.os.uk/search/names/v1/find', () =>
          HttpResponse.error()
        )
      )

      const request = createMockRequest({ query: { query: 'London' } })
      const h = createMockH()

      await handler(request, h)

      expect(h.response).toHaveBeenCalledWith('OS Names search request failed')
      expect(h._response.code).toHaveBeenCalledWith(502)
      expect(mockLogger.error).toHaveBeenCalled()
    })
  })
})
