import { describe, it, expect } from 'vitest'
import getViewModel, { title } from './get-view-model.js'

describe('email getViewModel', () => {
  it('should export the correct title', () => {
    expect(title).toBe('Enter your email address')
  })

  it('should return the correct pageTitle and pageHeading', () => {
    const viewModel = getViewModel({})
    expect(viewModel.pageTitle).toBe(
      'Enter your email address - Nature Restoration Fund - Gov.uk'
    )
    expect(viewModel.pageHeading).toBe(title)
  })

  it('should link back to people-count if other-residential is in quoteData', () => {
    const viewModel = getViewModel({
      developmentTypes: ['other-residential']
    })
    expect(viewModel.backLinkPath).toBe('/quote/people-count')
  })

  it('should link back to people-count if other-residential is selected alongside housing', () => {
    const viewModel = getViewModel({
      developmentTypes: ['housing', 'other-residential']
    })
    expect(viewModel.backLinkPath).toBe('/quote/people-count')
  })

  it('should link back to residential if other-residential is not in quoteData', () => {
    const viewModel = getViewModel({ developmentTypes: ['housing'] })
    expect(viewModel.backLinkPath).toBe('/quote/residential')
  })

  it('should link back to residential if developmentTypes is absent', () => {
    const viewModel = getViewModel({})
    expect(viewModel.backLinkPath).toBe('/quote/residential')
  })
})
