import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getOidcConfig } from './get-oidc-config.js'

vi.mock('@hapi/wreck')
vi.mock('../../config/config.js')

describe('getOidcConfig', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  it('should fetch and return OIDC configuration', async () => {
    const { config } = await import('../../config/config.js')
    const Wreck = await import('@hapi/wreck')

    const mockConfig = {
      authorization_endpoint: 'https://example.com/auth',
      token_endpoint: 'https://example.com/token',
      end_session_endpoint: 'https://example.com/logout'
    }

    config.get = vi.fn().mockReturnValue('https://example.com/.well-known')
    Wreck.default.get = vi.fn().mockResolvedValue({
      payload: mockConfig
    })

    const result = await getOidcConfig()

    expect(result).toEqual(mockConfig)
    expect(Wreck.default.get).toHaveBeenCalledWith(
      'https://example.com/.well-known',
      { json: true }
    )
  })

  it('should throw error when DEFRA_ID_WELL_KNOWN_URL is not configured', async () => {
    const { config } = await import('../../config/config.js')

    config.get = vi.fn().mockReturnValue(undefined)

    await expect(getOidcConfig()).rejects.toThrow(
      'DEFRA_ID_WELL_KNOWN_URL not configured'
    )
  })
})
