import { describe, it, expect } from 'vitest'
import getNextPage from './get-next-page.js'

describe('upload-boundary getNextPage', () => {
  it('should return /upload-received', () => {
    expect(getNextPage()).toBe('/upload-received')
  })
})
