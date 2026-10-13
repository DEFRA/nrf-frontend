import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockApiKeyRef = vi.hoisted(() => ({ current: '' }))

vi.mock('../../../config/config.js', () => ({
  config: {
    get: vi.fn((key) => {
      if (key === 'map.impactAssessorBaseUrl') {
        return 'https://impact-assessor.example'
      }
      if (key === 'tracing.header') {
        return 'x-cdp-request-id'
      }
      if (key === 'map.impactAssessorApiKey') {
        return mockApiKeyRef.current
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
    mockApiKeyRef.current = ''
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

  it('includes the x-api-key header when map.impactAssessorApiKey is set', async () => {
    mockApiKeyRef.current = 'secret-key'

    await getMapTile('tiles/7/1/2.mvt', createMockRequest())

    expect(fetchSpy).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: { 'x-api-key': 'secret-key' }
      })
    )
  })
})
