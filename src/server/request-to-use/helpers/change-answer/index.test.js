import { describe, expect, it } from 'vitest'
import { routePath as applicationTypeNotAvailablePath } from '../../../quote/application-type-not-available/route-path.js'
import { routePath as notHousingPath } from '../../../quote/not-housing/route-path.js'
import { routePath as notInEdpPath } from '../../../quote/not-in-edp/route-path.js'
import { routePath as quotePlanningTypePath } from '../../../quote/planning-type/route-path.js'
import getNextPage from '../../../quote/planning-type/get-next-page.js'
import {
  redirectToReviewPageUnlessDropout,
  withBackLink,
  withBackLinkUnlessDropout
} from './index.js'

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

  describe('withBackLinkUnlessDropout', () => {
    const getQuotePageViewModel = (quoteData) => ({
      pageHeading: 'Question',
      savedAnswer: quoteData.planningType
    })
    const getViewModel = withBackLinkUnlessDropout({
      getNextPage,
      getQuotePageViewModel
    })

    it('spreads the quote page view model and links back to the dropout page while the answer is ineligible', () => {
      expect(getViewModel({ planningType: 'other' }, {})).toEqual({
        pageHeading: 'Question',
        savedAnswer: 'other',
        backLinkPath: '/request-to-use/change/application-type-not-available'
      })
    })

    it('links back to the review and amend page once the answer is eligible', () => {
      expect(
        getViewModel({ planningType: 'full-planning-permission' }, {})
      ).toEqual({
        pageHeading: 'Question',
        savedAnswer: 'full-planning-permission',
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

    it('returns the change alias of a dropout page so an ineligible answer is shown under the request to use prefix', () => {
      expect(
        redirectToReviewPageUnlessDropout({ nextPage: notHousingPath })
      ).toBe('/request-to-use/change/not-housing')
      expect(
        redirectToReviewPageUnlessDropout({
          nextPage: applicationTypeNotAvailablePath
        })
      ).toBe('/request-to-use/change/application-type-not-available')
    })

    it('still returns a dropout page without an alias unchanged (the boundary dropouts until NRF2-1315)', () => {
      expect(
        redirectToReviewPageUnlessDropout({ nextPage: notInEdpPath })
      ).toBe(notInEdpPath)
    })
  })
})
