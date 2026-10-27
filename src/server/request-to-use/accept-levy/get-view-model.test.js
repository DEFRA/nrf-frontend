import { describe, it, expect } from 'vitest'
import getViewModel from './get-view-model.js'

const levy = (provisionalAmount, inflationAdjustedAmount) => ({
  levy: { provisionalAmount, inflationAdjustedAmount }
})

describe('accept-levy getViewModel', () => {
  it('should link back to the review quote details page', () => {
    expect(getViewModel(levy(1, 1)).backLinkPath).toBe(
      '/request-to-use/review-quote-details'
    )
  })

  it('should show whole pound amounts without pence', () => {
    const viewModel = getViewModel(levy(26750, 27000))

    expect(viewModel.provisionalAmount).toBe('£26,750')
    expect(viewModel.inflationAdjustedAmount).toBe('£27,000')
  })

  it('should show pence when the amount is not a whole number of pounds', () => {
    const viewModel = getViewModel(levy(26750.5, 27123.45))

    expect(viewModel.provisionalAmount).toBe('£26,750.50')
    expect(viewModel.inflationAdjustedAmount).toBe('£27,123.45')
  })

  it.each([
    { scenario: 'there is no session data', data: undefined },
    { scenario: 'the session holds no levy', data: { nrlReference: 'NRL-1' } }
  ])('should throw when $scenario', ({ data }) => {
    expect(() => getViewModel(data)).toThrow(
      'No levy in the request to use session'
    )
  })
})
