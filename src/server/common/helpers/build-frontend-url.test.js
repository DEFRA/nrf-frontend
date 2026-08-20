import { describe, it, expect } from 'vitest'
import { buildFrontendUrl } from './build-frontend-url.js'

describe('buildFrontendUrl', () => {
  it('resolves a path against the configured frontendBaseUrl', () => {
    expect(buildFrontendUrl('/login/return')).toBe(
      'http://localhost:3000/login/return'
    )
    expect(buildFrontendUrl('/login/signed-out')).toBe(
      'http://localhost:3000/login/signed-out'
    )
  })
})
