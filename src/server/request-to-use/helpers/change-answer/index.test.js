import { describe, expect, it } from 'vitest'
import { routePath as applicationTypeNotAvailablePath } from '../../../quote/application-type-not-available/route-path.js'
import { routePath as notHousingPath } from '../../../quote/not-housing/route-path.js'
import { routePath as notInEdpPath } from '../../../quote/not-in-edp/route-path.js'
import { routePath as quotePlanningTypePath } from '../../../quote/planning-type/route-path.js'
import { dropoutPaths } from '../../../quote/helpers/change-mode/index.js'
import {
  dropoutPageAliases,
  redirectToReviewPageUnlessDropout,
  withBackLink
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

  describe('redirectToReviewPageUnlessDropout', () => {
    it('returns the review and amend page for a journey next step', () => {
      expect(
        redirectToReviewPageUnlessDropout({ nextPage: quotePlanningTypePath })
      ).toBe('/request-to-use/review-quote-details')
    })

    it('returns the change alias of a dropout page', () => {
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

  describe('dropoutPageAliases', () => {
    // A new quote dropout page without a change alias would redirect a
    // request to use session to the /quote/ page its guard bounces to the
    // start page — this fails so the alias (or a boundary entry) is added.
    it('maps every quote dropout page to a change alias except the boundary dropouts reserved for NRF2-1315', () => {
      const unmappedDropoutPaths = [...dropoutPaths].filter(
        (path) => !dropoutPageAliases.has(path)
      )

      expect(unmappedDropoutPaths).toEqual([
        '/quote/not-in-edp',
        '/quote/excluded-area'
      ])
    })
  })
})
