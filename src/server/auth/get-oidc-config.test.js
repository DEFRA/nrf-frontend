import { describe, it, expect, vi, beforeEach } from 'vitest'
import { http, HttpResponse } from 'msw'
import { setupMswServer } from '../../test-utils/setup-msw-server.js'
import { getOidcConfig, resetOidcConfigCache } from './get-oidc-config.js'

vi.mock('../../config/config.js')

const server = setupMswServer()

const wellKnownUrl = 'https://example.com/.well-known'

describe('getOidcConfig', () => {
  beforeEach(() => {
    resetOidcConfigCache()
  })

  it('should fetch and return OIDC configuration', async () => {
    const { config } = await import('../../config/config.js')

    const mockConfig = {
      authorization_endpoint: 'https://example.com/auth',
      token_endpoint: 'https://example.com/token',
      end_session_endpoint: 'https://example.com/logout'
    }

    config.get = vi.fn().mockReturnValue(wellKnownUrl)

    let requestedUrl
    server.use(
      http.get(wellKnownUrl, ({ request }) => {
        requestedUrl = request.url
        return HttpResponse.json(mockConfig)
      })
    )

    const result = await getOidcConfig()

    expect(result).toEqual(mockConfig)
    expect(requestedUrl).toBe(wellKnownUrl)
  })

  it('should memoise the configuration and not re-fetch on subsequent calls', async () => {
    const { config } = await import('../../config/config.js')

    const mockConfig = { token_endpoint: 'https://example.com/token' }
    config.get = vi.fn().mockReturnValue(wellKnownUrl)

    let fetchCount = 0
    server.use(
      http.get(wellKnownUrl, () => {
        fetchCount += 1
        return HttpResponse.json(mockConfig)
      })
    )

    await getOidcConfig()
    await getOidcConfig()

    expect(fetchCount).toBe(1)
  })

  it('should throw error when DEFRA_ID_WELL_KNOWN_URL is not configured', async () => {
    const { config } = await import('../../config/config.js')

    config.get = vi.fn().mockReturnValue(undefined)

    await expect(getOidcConfig({ error: vi.fn() })).rejects.toThrow(
      'DEFRA_ID_WELL_KNOWN_URL not configured'
    )
  })
})
