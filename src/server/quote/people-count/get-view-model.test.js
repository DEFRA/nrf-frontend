import { describe, it, expect } from 'vitest'
import getViewModel, { title } from './get-view-model.js'

describe('people-count getViewModel', () => {
  it('should export the correct title', () => {
    expect(title).toBe(
      'What is the maximum number of people the development will serve?'
    )
  })

  it('should link back to development-types if housing is not in quoteData', () => {
    const viewModel = getViewModel({ developmentTypes: ['other-residential'] })
    expect(viewModel.backLinkPath).toBe('/quote/development-types')
  })

  it('should link back to residential if housing is in quoteData', () => {
    const viewModel = getViewModel({ developmentTypes: ['housing'] })
    expect(viewModel.backLinkPath).toBe('/quote/residential')
  })

  it('should return the correct pageTitle and pageHeading', () => {
    const viewModel = getViewModel({})
    expect(viewModel.pageTitle).toBe(
      'What is the maximum number of people the development will serve? - Nature Restoration Fund - Gov.uk'
    )
    expect(viewModel.pageHeading).toBe(title)
  })
})
