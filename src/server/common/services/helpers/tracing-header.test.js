import { describe, it, expect, vi } from 'vitest'
import { getTraceId } from '@defra/hapi-tracing'
import { addTracingHeader } from './tracing-header.js'

vi.mock('@defra/hapi-tracing', () => ({
  getTraceId: vi.fn()
}))

describe('addTracingHeader', () => {
  it('adds the tracing header when a trace ID is present', () => {
    vi.mocked(getTraceId).mockReturnValue('trace-abc-123')

    const result = addTracingHeader()

    expect(result).toEqual({ 'x-cdp-request-id': 'trace-abc-123' })
  })

  it('does not add the tracing header when no trace ID is present', () => {
    vi.mocked(getTraceId).mockReturnValue(null)

    const result = addTracingHeader()

    expect(result).toEqual({})
  })

  it('preserves existing headers when adding the tracing header', () => {
    vi.mocked(getTraceId).mockReturnValue('trace-abc-123')

    const result = addTracingHeader({ 'Content-Type': 'application/json' })

    expect(result).toEqual({
      'Content-Type': 'application/json',
      'x-cdp-request-id': 'trace-abc-123'
    })
  })

  it('preserves existing headers when no trace ID is present', () => {
    vi.mocked(getTraceId).mockReturnValue(undefined)

    const result = addTracingHeader({ 'Content-Type': 'application/json' })

    expect(result).toEqual({ 'Content-Type': 'application/json' })
  })

  it('returns a new object rather than mutating the input', () => {
    vi.mocked(getTraceId).mockReturnValue('trace-abc-123')

    const headers = {}
    const result = addTracingHeader(headers)

    expect(result).not.toBe(headers)
    expect(headers).toEqual({})
  })
})
