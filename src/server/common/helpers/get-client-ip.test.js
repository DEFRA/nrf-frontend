import { describe, it, expect } from 'vitest'
import { getClientIp } from './get-client-ip.js'

describe('getClientIp', () => {
  it('returns the first X-Forwarded-For entry when present', () => {
    const request = {
      headers: { 'x-forwarded-for': '1.2.3.4, 5.6.7.8' },
      info: { remoteAddress: '172.16.0.1' }
    }
    expect(getClientIp(request)).toBe('1.2.3.4')
  })

  it('trims whitespace from the X-Forwarded-For entry', () => {
    const request = {
      headers: { 'x-forwarded-for': '  1.2.3.4  , 5.6.7.8' },
      info: { remoteAddress: '172.16.0.1' }
    }
    expect(getClientIp(request)).toBe('1.2.3.4')
  })

  it('falls back to remoteAddress when X-Forwarded-For is absent', () => {
    const request = {
      headers: {},
      info: { remoteAddress: '172.16.0.1' }
    }
    expect(getClientIp(request)).toBe('172.16.0.1')
  })

  it('handles a single X-Forwarded-For value with no comma', () => {
    const request = {
      headers: { 'x-forwarded-for': '9.8.7.6' },
      info: { remoteAddress: '172.16.0.1' }
    }
    expect(getClientIp(request)).toBe('9.8.7.6')
  })
})
