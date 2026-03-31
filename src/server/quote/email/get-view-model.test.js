import { describe, it, expect } from 'vitest'
import getViewModel, { title } from './get-view-model.js'

describe('email getViewModel', () => {
  it('should export the correct title', () => {
    expect(title).toBe('Enter your email address')
  })

  it('should return the correct pageTitle and pageHeading', () => {
    const viewModel = getViewModel()
    expect(viewModel.pageTitle).toBe(
      'Enter your email address - Nature Restoration Fund - Gov.uk'
    )
    expect(viewModel.pageHeading).toBe(title)
  })

  it('should link back to waste-water', () => {
    const viewModel = getViewModel()
    expect(viewModel.backLinkPath).toBe('/quote/waste-water')
  })
})
