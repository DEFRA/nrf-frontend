import { vi } from 'vitest'

import crumb from '@hapi/crumb'

import { csrf } from './csrf.js'

const mockConfigGet = vi.hoisted(() => vi.fn().mockReturnValue(false))

vi.mock('../../../config/config.js', () => ({
  config: {
    get: mockConfigGet
  }
}))

describe('#csrf', () => {
  beforeEach(() => {
    mockConfigGet.mockReturnValue(false)
  })

  test('Should use the crumb plugin', () => {
    expect(csrf.plugin).toBe(crumb)
  })

  test('Should have key "csrfToken"', () => {
    expect(csrf.options.key).toBe('csrfToken')
  })

  test('Should have size 43', () => {
    expect(csrf.options.size).toBe(43)
  })

  describe('cookieOptions.isSecure', () => {
    test('Should be false when not in production', () => {
      expect(csrf.options.cookieOptions.isSecure).toBe(false)
    })

    test('Should be true when in production', async () => {
      mockConfigGet.mockReturnValue(true)
      vi.resetModules()
      const { csrf: freshCsrf } = await import('./csrf.js')
      expect(freshCsrf.options.cookieOptions.isSecure).toBe(true)
    })
  })

  describe('skip', () => {
    test('Should return false when not in test environment', () => {
      expect(csrf.options.skip()).toBe(false)
    })

    test('Should return true in test environment', () => {
      mockConfigGet.mockReturnValue(true)
      expect(csrf.options.skip()).toBe(true)
    })
  })
})
