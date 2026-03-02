import { describe, it, expect } from 'vitest'
import getNextPage from './get-next-page.js'

describe('upload-boundary getNextPage', () => {
  it('should return /quote/upload-received', () => {
    expect(getNextPage()).toBe('/quote/upload-received')
  })
})
