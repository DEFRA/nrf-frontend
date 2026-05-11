import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getTraceId } from '@defra/hapi-tracing'

vi.mock('@defra/hapi-tracing', () => ({
  getTraceId: vi.fn()
}))

vi.mock('../../../config/config.js', () => ({
  config: {
    get: vi.fn((key) => {
      if (key === 'map.impactAssessorBaseUrl') {
        return 'https://impact-assessor.example'
      }
      if (key === 'tracing.header') {
        return 'x-cdp-request-id'
      }
      return null
    })
  }
}))

const mockLogger = vi.hoisted(() => ({
  debug: vi.fn(),
  error: vi.fn()
}))

vi.mock('../helpers/logging/logger.js', () => ({
  createLogger: () => mockLogger
}))

const { getMapTile } = await import('./ia-map-tile-server.js')

function createMockRequest(query = {}) {
  return { query }
}

describe('getMapTile', () => {
  let fetchSpy

  beforeEach(() => {
    fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue({ ok: true })
    vi.mocked(getTraceId).mockReturnValue(null)
  })

  it('fetches the upstream URL constructed from path and query', async () => {
    await getMapTile('tiles/7/1/2.mvt', createMockRequest({ token: 'abc' }))

    expect(fetchSpy).toHaveBeenCalledWith(
      'https://impact-assessor.example/tiles/7/1/2.mvt?token=abc',
      expect.objectContaining({ redirect: 'follow' })
    )
  })

  it('uses the base URL when path is empty', async () => {
    await getMapTile('', createMockRequest())

    expect(fetchSpy).toHaveBeenCalledWith(
      'https://impact-assessor.example',
      expect.objectContaining({ redirect: 'follow' })
    )
  })

  it('includes the tracing header when a trace ID is present', async () => {
    vi.mocked(getTraceId).mockReturnValue('trace-abc-123')

    await getMapTile('tiles/7/1/2.mvt', createMockRequest())

    expect(fetchSpy).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: { 'x-cdp-request-id': 'trace-abc-123' }
      })
    )
  })

  it('omits the tracing header when no trace ID is present', async () => {
    await getMapTile('tiles/7/1/2.mvt', createMockRequest())

    expect(fetchSpy).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ headers: {} })
    )
  })

  it('logs the request path', async () => {
    await getMapTile('tiles/7/1/2.mvt', createMockRequest())

    expect(mockLogger.debug).toHaveBeenCalledWith(
      'Impact assessor proxy request: tiles/7/1/2.mvt'
    )
  })

  it('logs / when path is empty', async () => {
    await getMapTile('', createMockRequest())

    expect(mockLogger.debug).toHaveBeenCalledWith(
      'Impact assessor proxy request: /'
    )
  })

  it('returns the fetch response', async () => {
    const mockResponse = { ok: true, status: 200 }
    fetchSpy.mockResolvedValue(mockResponse)

    const result = await getMapTile('tiles/7/1/2.mvt', createMockRequest())

    expect(result).toBe(mockResponse)
  })
})
