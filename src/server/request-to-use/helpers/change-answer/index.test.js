import { describe, expect, it } from 'vitest'
import { routePath as notHousingPath } from '../../../quote/not-housing/route-path.js'
import { routePath as quotePlanningTypePath } from '../../../quote/planning-type/route-path.js'
import { redirectToReviewPageUnlessDropout, withBackLink } from './index.js'

describe('change answer helpers', () => {
  describe('withBackLink', () => {
    it('spreads the quote page view model and swaps the back link', () => {
      const getQuotePageViewModel = (quoteData) => ({
        pageHeading: 'Question',
        savedAnswer: quoteData.planningType
      })

      const getViewModel = withBackLink({
        backLinkPath: '/request-to-use/review-quote-details',
        getQuotePageViewModel
      })

      expect(getViewModel({ planningType: 'other' }, {})).toEqual({
        pageHeading: 'Question',
        savedAnswer: 'other',
        backLinkPath: '/request-to-use/review-quote-details'
      })
    })
  })

  describe('redirectToReviewPageUnlessDropout', () => {
    it('returns the review and amend page for a journey next step', () => {
      expect(
        redirectToReviewPageUnlessDropout({ nextPage: quotePlanningTypePath })
      ).toBe('/request-to-use/review-quote-details')
    })

    it('still returns a dropout page so an ineligible answer is shown', () => {
      expect(
        redirectToReviewPageUnlessDropout({ nextPage: notHousingPath })
      ).toBe('/quote/not-housing')
    })
  })
})
