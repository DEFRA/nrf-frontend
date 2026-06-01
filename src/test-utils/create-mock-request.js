import { vi } from 'vitest'

export const createMockResponseToolkit = () => {
  const mockResponse = { code: vi.fn().mockReturnThis() }
  return { response: vi.fn().mockReturnValue(mockResponse), mockResponse }
}

export const createMockRequest = (overrides = {}) => ({
  payload: {},
  logger: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    debug: vi.fn()
  },
  yar: { id: 'test-session-id' },
  ...overrides
})
