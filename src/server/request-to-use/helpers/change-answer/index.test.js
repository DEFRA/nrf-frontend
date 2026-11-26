import { describe, expect, it } from 'vitest'
import { routePath as applicationTypeNotAvailablePath } from '../../../quote/application-type-not-available/route-path.js'
import { routePath as notHousingPath } from '../../../quote/not-housing/route-path.js'
import { routePath as notInEdpPath } from '../../../quote/not-in-edp/route-path.js'
import { routePath as excludedAreaPath } from '../../../quote/excluded-area/route-path.js'
import { routePath as quotePlanningTypePath } from '../../../quote/planning-type/route-path.js'
import {
  dropoutPaths,
  isChangeMode
} from '../../../quote/helpers/change-mode/index.js'
import {
  checkYourAnswersBackLinkPath,
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

  describe('checkYourAnswersBackLinkPath', () => {
    it('is the check your answers page carrying the change flag', () => {
      expect(checkYourAnswersBackLinkPath).toBe(
        '/request-to-use/check-your-answers?change=true'
      )
    })

    it('is seen as a change by the check the check your answers page makes', () => {
      const query = Object.fromEntries(
        new URLSearchParams(checkYourAnswersBackLinkPath.split('?')[1])
      )

      expect(isChangeMode(query)).toBe(true)
      expect(isChangeMode({})).toBe(false)
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

    it('returns the change alias of the boundary dropout pages', () => {
      expect(
        redirectToReviewPageUnlessDropout({ nextPage: notInEdpPath })
      ).toBe('/request-to-use/change/not-in-edp')

      expect(
        redirectToReviewPageUnlessDropout({ nextPage: excludedAreaPath })
      ).toBe('/request-to-use/change/excluded-area')
    })
  })

  describe('dropoutPageAliases', () => {
    // A new quote dropout page without a change alias would redirect a
    // request to use session to the /quote/ page its guard bounces to the
    // start page — this fails so the alias is added.
    it('maps every quote dropout page to a change alias', () => {
      const unmappedDropoutPaths = [...dropoutPaths].filter(
        (path) => !dropoutPageAliases.has(path)
      )

      expect(unmappedDropoutPaths).toEqual([])
    })
  })
})
