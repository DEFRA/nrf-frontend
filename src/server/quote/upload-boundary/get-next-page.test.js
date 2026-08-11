import { describe, it, expect } from 'vitest'
import getNextPage from './get-next-page.js'

describe('upload-boundary getNextPage', () => {
  it('should return /quote/checking-file', () => {
    expect(getNextPage()).toBe('/quote/checking-file')
  })
})
