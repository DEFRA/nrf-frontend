import { describe, expect, it } from 'vitest'
import { getContinueRedirectPath } from './get-continue-redirect-path.js'

describe('getContinueRedirectPath', () => {
  it.each([
    {
      scenario: 'the planning type is Other',
      quoteData: { planningType: 'other' },
      expected:
        '/request-to-use/change/application-type-not-available?from=review'
    },
    {
      scenario: 'the development is not housing',
      quoteData: { planningType: 'full-planning-permission', isHousing: 'no' },
      expected: '/request-to-use/change/not-housing?from=review'
    },
    {
      scenario: 'both answers are ineligible',
      quoteData: { planningType: 'other', isHousing: 'no' },
      expected:
        '/request-to-use/change/application-type-not-available?from=review'
    },
    {
      scenario: 'the answers are eligible',
      quoteData: { planningType: 'full-planning-permission', isHousing: 'yes' },
      expected: '/request-to-use/review-quote-details'
    },
    {
      scenario: 'there are no saved answers',
      quoteData: null,
      expected: '/request-to-use/review-quote-details'
    }
  ])('redirects to $expected when $scenario', ({ quoteData, expected }) => {
    expect(getContinueRedirectPath(quoteData)).toBe(expected)
  })
})
