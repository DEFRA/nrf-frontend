import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setupMswServer } from '../../../test-utils/setup-msw-server.js'
import { mockRecalculateLevy } from '../../../test-utils/mock-recalculate-levy.js'
import { recalculatedLevy } from '../../../test-utils/fixtures/levy.js'

const mockApiKeyRef = vi.hoisted(() => ({ current: '' }))

vi.mock('../../../config/config.js', () => ({
  config: {
    get: vi.fn((key) => {
      if (key === 'impactAssessor.baseUrl') {
        return 'https://impact-assessor.example'
      }
      if (key === 'tracing.header') {
        return 'x-cdp-request-id'
      }
      if (key === 'impactAssessor.apiKey') {
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

const { getMapTile, recalculateLevy } = await import('./nrf-impact-assessor.js')

const mswServer = setupMswServer()

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

  it('includes the x-api-key header when impactAssessor.apiKey is set', async () => {
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

describe('recalculateLevy', () => {
  const units = 42
  const requestDate = '2026-10-14'

  beforeEach(() => {
    mockApiKeyRef.current = ''
  })

  it('posts the units and request date to the levy recalculate endpoint', async () => {
    const requests = mockRecalculateLevy(mswServer)

    await recalculateLevy({ units, requestDate })

    expect(requests).toHaveLength(1)
    expect(requests[0].body).toEqual({ units, requestDate })
  })

  it('includes the edpId when given', async () => {
    const requests = mockRecalculateLevy(mswServer)

    await recalculateLevy({ edpId: 2, units, requestDate })

    expect(requests[0].body).toEqual({ edpId: 2, units, requestDate })
  })

  it('sends the x-api-key header when impactAssessor.apiKey is set', async () => {
    mockApiKeyRef.current = 'secret-key'
    const requests = mockRecalculateLevy(mswServer)

    await recalculateLevy({ units, requestDate })

    expect(requests[0].headers['x-api-key']).toBe('secret-key')
  })

  it('returns the recalculated levy', async () => {
    mockRecalculateLevy(mswServer)

    const result = await recalculateLevy({ units, requestDate })

    expect(result).toEqual(recalculatedLevy)
  })

  it.each([400, 404, 422, 500])(
    'logs and throws a 500 when the impact assessor responds with %i',
    async (status) => {
      mockRecalculateLevy(mswServer, { status })

      await expect(
        recalculateLevy({ units, requestDate })
      ).rejects.toMatchObject({ output: { statusCode: 500 } })
      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.any(Error),
        'Levy recalculation request to impact assessor failed'
      )
    }
  )
})
