import { describe, it, expect } from 'vitest'
import getNextPage from './get-next-page.js'
import { routePath as uploadBoundaryPath } from '../upload-boundary/routes.js'

describe('getNextPage', () => {
  it('should return upload-boundary path when boundaryCorrect is no', () => {
    expect(getNextPage({ boundaryCorrect: 'no' })).toBe(uploadBoundaryPath)
  })

  it('should return development-types path when boundaryCorrect is yes', () => {
    expect(getNextPage({ boundaryCorrect: 'yes' })).toBe(
      '/quote/development-types'
    )
  })

  it('should return development-types path when boundaryCorrect is undefined', () => {
    expect(getNextPage({})).toBe('/quote/development-types')
  })
})
