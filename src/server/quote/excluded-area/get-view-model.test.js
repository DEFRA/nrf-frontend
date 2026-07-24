import { describe, it, expect } from 'vitest'
import getViewModel from './get-view-model.js'

describe('excluded-area getViewModel', () => {
  it('returns the correct pageTitle and pageHeading', () => {
    const viewModel = getViewModel()

    expect(viewModel.pageTitle).toBe(
      'Development is within the excluded area of this Environmental Delivery Plan (EDP) - Nature restoration levy - GOV.UK'
    )
    expect(viewModel.pageHeading).toBe(
      'Development is within the excluded area of this Environmental Delivery Plan (EDP)'
    )
  })

  it('returns a backLinkPath for the boundary entry page', () => {
    const viewModel = getViewModel()

    expect(viewModel.backLinkPath).toBe('/quote/boundary-type')
  })
})
