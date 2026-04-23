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
  debug: vi.fn(),
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

function createMockRequest(query = {}) {
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

  it('defines a GET route at /os-names-search', () => {
    expect(routes[0].method).toBe('GET')
    expect(routes[0].path).toBe('/os-names-search')
    expect(routes[0].options.auth).toBe(false)
  })

  it('returns empty results for missing query without calling upstream', async () => {
    const h = createMockH()

    await handler(createMockRequest(), h)

    expect(h.response).toHaveBeenCalledWith({ results: [] })
    expect(h._response.code).toHaveBeenCalledWith(200)
  })

  it('forwards query and api key to OS Names API', async () => {
    let capturedUrl
    server.use(
      http.get('https://api.os.uk/search/names/v1/find', ({ request: req }) => {
        capturedUrl = new URL(req.url)
        return HttpResponse.json(
          { results: [] },
          {
            headers: { 'content-type': 'application/json' }
          }
        )
      })
    )

    const h = createMockH()
    await handler(createMockRequest({ query: 'York' }), h)

    expect(capturedUrl.searchParams.get('query')).toBe('York')
    expect(capturedUrl.searchParams.get('key')).toBe('test-api-key')
    expect(h._response.type).toHaveBeenCalledWith('application/json')
  })

  it('does not log the raw search query on successful upstream responses', async () => {
    server.use(
      http.get('https://api.os.uk/search/names/v1/find', () =>
        HttpResponse.json({ results: [] })
      )
    )

    const h = createMockH()
    await handler(createMockRequest({ query: '10 Downing Street, London' }), h)

    expect(mockLogger.info).toHaveBeenCalledWith(
      expect.objectContaining({ status: 200 }),
      'OS Names proxy'
    )
    expect(mockLogger.info).not.toHaveBeenCalledWith(
      expect.stringContaining('10 Downing Street, London')
    )
  })

  it('returns a stable error shape for upstream errors, not upstream body', async () => {
    server.use(
      http.get('https://api.os.uk/search/names/v1/find', () =>
        HttpResponse.text('Forbidden — internal upstream detail', {
          status: 403
        })
      )
    )

    const h = createMockH()
    await handler(createMockRequest({ query: 'York' }), h)

    expect(h.response).toHaveBeenCalledWith({ error: 'upstream_error' })
    expect(h._response.code).toHaveBeenCalledWith(403)
  })

  it('returns 502 with stable error shape for network errors', async () => {
    server.use(
      http.get('https://api.os.uk/search/names/v1/find', () =>
        HttpResponse.error()
      )
    )

    const h = createMockH()
    await handler(createMockRequest({ query: 'York' }), h)

    expect(h.response).toHaveBeenCalledWith({ error: 'upstream_error' })
    expect(h._response.code).toHaveBeenCalledWith(502)
    expect(mockLogger.error).toHaveBeenCalled()
  })

  describe('postcode normalization (GDS)', () => {
    const captureQuery = () => {
      let captured
      server.use(
        http.get(
          'https://api.os.uk/search/names/v1/find',
          ({ request: req }) => {
            captured = new URL(req.url).searchParams.get('query')
            return HttpResponse.json({ results: [] })
          }
        )
      )
      return () => captured
    }

    it.each([
      ['SW1A 2AA', 'SW1A 2AA'],
      ['sw1a2aa', 'SW1A 2AA'],
      ['SW1A2AA', 'SW1A 2AA'],
      ['sw1a 2aa', 'SW1A 2AA'],
      ['m11ae', 'M1 1AE'],
      ['  M1   1AE  ', 'M1 1AE']
    ])('normalizes "%s" → "%s"', async (input, expected) => {
      const getQuery = captureQuery()
      const h = createMockH()
      await handler(createMockRequest({ query: input }), h)
      expect(getQuery()).toBe(expected)
    })

    it('passes non-postcode queries through unchanged', async () => {
      const getQuery = captureQuery()
      const h = createMockH()
      await handler(createMockRequest({ query: '10 Downing Street' }), h)
      expect(getQuery()).toBe('10 Downing Street')
    })
  })
})
