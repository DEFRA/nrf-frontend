import { describe, expect, it } from 'vitest'
import {
  getValidationFlashFromCache,
  saveValidationFlashToCache
} from '../../../common/helpers/form-validation-session/index.js'
import { createCheckYourAnswersRequest } from '../../../../test-utils/create-check-your-answers-request.js'
import { createMockRedirectToolkit } from '../../../../test-utils/create-mock-redirect-toolkit.js'
import { checkYourAnswersSessions } from '../../../../test-utils/fixtures/check-your-answers-sessions.js'
import { incompleteCheckYourAnswersScenarios } from '../../../../test-utils/fixtures/incomplete-check-your-answers-scenarios.js'
import { validationFlash } from '../../../../test-utils/fixtures/validation-flash.js'
import { redirectWhenAnswersIncomplete } from './index.js'

const reviewQuoteDetailsPath = '/request-to-use/review-quote-details'

describe('redirectWhenAnswersIncomplete', () => {
  it('should continue when every answer the page confirms is given', () => {
    const h = createMockRedirectToolkit()

    const result = redirectWhenAnswersIncomplete(
      createCheckYourAnswersRequest({
        requestToUse: checkYourAnswersSessions.employee
      }),
      h
    )

    expect(result).toBe(h.continue)
    expect(h.redirect).not.toHaveBeenCalled()
  })

  it('should keep a saved validation error when the answers are complete', () => {
    const request = createCheckYourAnswersRequest({
      requestToUse: checkYourAnswersSessions.employee
    })
    saveValidationFlashToCache(request, validationFlash)

    redirectWhenAnswersIncomplete(request, createMockRedirectToolkit())

    expect(getValidationFlashFromCache(request)).toEqual(validationFlash)
  })

  it.each(incompleteCheckYourAnswersScenarios)(
    'should redirect to the review and amend page when $scenario',
    ({ session }) => {
      const request = createCheckYourAnswersRequest({
        requestToUse: session
      })
      // Left by a failed submit whose form page the review page replaces
      saveValidationFlashToCache(request, validationFlash)
      const h = createMockRedirectToolkit()

      const result = redirectWhenAnswersIncomplete(request, h)

      expect(h.redirect).toHaveBeenCalledTimes(1)
      expect(h.redirect).toHaveBeenCalledWith(reviewQuoteDetailsPath)
      expect(h.response.code).toHaveBeenCalledWith(302)
      expect(h.response.takeover).toHaveBeenCalledTimes(1)
      expect(result).toBe(h.response.takeover.mock.results[0].value)
      expect(getValidationFlashFromCache(request)).toBeNull()
    }
  )
})
