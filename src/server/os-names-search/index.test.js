import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockLogger = vi.hoisted(() => ({
  info: vi.fn(),
  warn: vi.fn()
}))

vi.mock('../common/helpers/logging/logger.js', () => ({
  createLogger: () => mockLogger
}))

vi.mock('../../config/config.js', () => ({
  config: {
    get: vi.fn()
  }
}))

vi.mock('./routes.js', () => ({
  default: [{ method: 'GET', path: '/os-names-search' }],
  routePath: '/os-names-search'
}))

const { config } = await import('../../config/config.js')
const { osNamesSearch } = await import('./index.js')

describe('osNamesSearch plugin', () => {
  beforeEach(() => {
    config.get.mockReturnValue(null)
  })

  it('exposes the plugin name', () => {
    expect(osNamesSearch.plugin.name).toBe('os-names-search')
  })

  it('logs an info message when the OS API key is configured', () => {
    config.get.mockReturnValue('test-key')
    const server = { route: vi.fn() }

    osNamesSearch.plugin.register(server)

    expect(mockLogger.info).toHaveBeenCalledWith(
      expect.stringContaining('/os-names-search')
    )
    expect(mockLogger.warn).not.toHaveBeenCalled()
  })

  it('logs a warning when the OS API key is not configured', () => {
    config.get.mockReturnValue(null)
    const server = { route: vi.fn() }

    osNamesSearch.plugin.register(server)

    expect(mockLogger.warn).toHaveBeenCalledWith(
      expect.stringContaining('OS_API_KEY')
    )
    expect(mockLogger.info).not.toHaveBeenCalled()
  })

  it('registers routes with the server', () => {
    const server = { route: vi.fn() }

    osNamesSearch.plugin.register(server)

    expect(server.route).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ path: '/os-names-search' })
      ])
    )
  })
})
