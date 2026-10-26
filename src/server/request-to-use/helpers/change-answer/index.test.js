import { describe, expect, it, vi } from 'vitest'
import { routePath as applicationTypeNotAvailablePath } from '../../../quote/application-type-not-available/route-path.js'
import { routePath as notHousingPath } from '../../../quote/not-housing/route-path.js'
import { routePath as notInEdpPath } from '../../../quote/not-in-edp/route-path.js'
import { routePath as quotePlanningTypePath } from '../../../quote/planning-type/route-path.js'
import getNextPage from '../../../quote/planning-type/get-next-page.js'
import {
  redirectToReviewPageUnlessDropout,
  saveToSessionUnlessDropout,
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

  describe('saveToSessionUnlessDropout', () => {
    it('does not save an answer that leads to a dropout page', () => {
      const saveToSession = vi.fn()
      const save = saveToSessionUnlessDropout({ getNextPage, saveToSession })

      expect(save('request', { planningType: 'other' })).toEqual({
        planningType: 'other'
      })
      expect(saveToSession).not.toHaveBeenCalled()
    })

    it('saves an eligible answer', () => {
      const sessionData = { planningType: 'outline-planning-permission' }
      const saveToSession = vi.fn(() => sessionData)
      const save = saveToSessionUnlessDropout({ getNextPage, saveToSession })

      expect(
        save('request', { planningType: 'outline-planning-permission' })
      ).toBe(sessionData)
      expect(saveToSession).toHaveBeenCalledWith('request', {
        planningType: 'outline-planning-permission'
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
