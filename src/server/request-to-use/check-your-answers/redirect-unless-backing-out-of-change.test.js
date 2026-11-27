import { describe, expect, it } from 'vitest'
import {
  getValidationFlashFromCache,
  saveValidationFlashToCache
} from '../../common/helpers/form-validation-session/index.js'
import { createCheckYourAnswersRequest } from '../../../test-utils/create-check-your-answers-request.js'
import { createMockRedirectToolkit } from '../../../test-utils/create-mock-redirect-toolkit.js'
import {
  checkYourAnswersSessions,
  incompleteCheckYourAnswersSessions
} from '../../../test-utils/fixtures/check-your-answers-sessions.js'
import { validationFlash } from '../../../test-utils/fixtures/validation-flash.js'
import { redirectUnlessBackingOutOfChange } from './redirect-unless-backing-out-of-change.js'

const reviewQuoteDetailsPath = '/request-to-use/review-quote-details'
const backLinkFromChangePage = { change: 'true' }

describe('redirectUnlessBackingOutOfChange', () => {
  it.each([
    ['a direct load', {}],
    ['a back link from a change page', backLinkFromChangePage]
  ])('should continue on %s when every answer is given', (_, query) => {
    const h = createMockRedirectToolkit()

    const result = redirectUnlessBackingOutOfChange(
      createCheckYourAnswersRequest({
        requestToUse: checkYourAnswersSessions.employee,
        query
      }),
      h
    )

    expect(result).toBe(h.continue)
    expect(h.redirect).not.toHaveBeenCalled()
  })

  it('should redirect a direct load to the review and amend page when an answer is missing', () => {
    const h = createMockRedirectToolkit()

    const result = redirectUnlessBackingOutOfChange(
      createCheckYourAnswersRequest({
        requestToUse: incompleteCheckYourAnswersSessions.withoutAcceptedLevy
      }),
      h
    )

    expect(h.redirect).toHaveBeenCalledTimes(1)
    expect(h.redirect).toHaveBeenCalledWith(reviewQuoteDetailsPath)
    expect(result).toBe(h.response.takeover.mock.results[0].value)
  })

  it('should fail a back link from a change page with the incomplete answers error page when an answer is missing', () => {
    const request = createCheckYourAnswersRequest({
      requestToUse: incompleteCheckYourAnswersSessions.withoutAcceptedLevy,
      query: backLinkFromChangePage
    })
    // Left by a failed submit whose form page the error page replaces
    saveValidationFlashToCache(request, validationFlash)

    expect(() =>
      redirectUnlessBackingOutOfChange(request, createMockRedirectToolkit())
    ).toThrow(
      expect.objectContaining({
        isBoom: true,
        output: expect.objectContaining({ statusCode: 400 }),
        data: { completeDetailsPath: reviewQuoteDetailsPath }
      })
    )
    expect(getValidationFlashFromCache(request)).toBeNull()
  })
})
