import { describe, it, expect, vi } from 'vitest'
import { browserLogs } from './index.js'
import { browserLogsController } from './controller.js'

describe('browserLogs plugin', () => {
  it('registers a POST route at /api/browser-logs', () => {
    const route = vi.fn()
    browserLogs.plugin.register({ route })

    expect(route).toHaveBeenCalledWith(
      expect.objectContaining({
        method: 'POST',
        path: '/api/browser-logs',
        handler: browserLogsController.handler
      })
    )
  })

  it('disables CSRF and validates the payload', () => {
    const route = vi.fn()
    browserLogs.plugin.register({ route })

    const [{ options }] = route.mock.calls[0]
    expect(options.plugins.crumb).toBe(false)
    expect(options.validate.payload).toBeDefined()
    expect(options.validate.failAction).toBeTypeOf('function')
  })
})
