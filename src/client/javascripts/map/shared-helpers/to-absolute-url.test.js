// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import { toAbsoluteUrl } from './to-absolute-url.js'

describe('toAbsoluteUrl', () => {
  it('resolves a relative URL against the current origin', () => {
    expect(toAbsoluteUrl('/impact-assessor-map/tiles/x')).toBe(
      `${window.location.origin}/impact-assessor-map/tiles/x`
    )
  })

  it('leaves an absolute URL untouched', () => {
    expect(toAbsoluteUrl('https://example.com/tile')).toBe(
      'https://example.com/tile'
    )
  })

  it('leaves a non-string value untouched', () => {
    expect(toAbsoluteUrl(undefined)).toBeUndefined()
  })
})
