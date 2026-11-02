import { deleteQuotePostController } from './controller-post.js'
import { createSessionRequest } from '../../../test-utils/create-session-request.js'
import { createMockRedirectToolkit } from '../../../test-utils/create-mock-redirect-toolkit.js'
import { setupMswServer } from '../../../test-utils/setup-msw-server.js'
import { mockDeleteQuote } from '../../../test-utils/mock-get-quote.js'
import { fullQuote } from '../../../test-utils/fixtures/quote.js'
import {
  redeemedQuoteSession,
  reviewQuoteSession
} from '../../../test-utils/fixtures/session.js'

const nrlReference = fullQuote.reference

describe('deleteQuotePostController', () => {
  const mswServer = setupMswServer()

  it.each([
    {
      scenario: 'the request to use session is missing',
      session: { quote: reviewQuoteSession.quote }
    },
    {
      scenario: 'the quote session is incomplete',
      session: { quote: {}, requestToUse: reviewQuoteSession.requestToUse }
    },
    {
      scenario: 'the request to use session has no reference',
      session: { quote: reviewQuoteSession.quote, requestToUse: {} }
    }
  ])(
    'should redirect to the start page without deleting when $scenario',
    async ({ session }) => {
      const requests = mockDeleteQuote(mswServer)
      const toolkit = createMockRedirectToolkit()

      await deleteQuotePostController.handler(
        createSessionRequest({ session }),
        toolkit
      )

      expect(toolkit.redirect).toHaveBeenCalledWith('/manage/start-page')
      expect(toolkit.response.code).toHaveBeenCalledWith(303)
      expect(requests).toEqual([])
    }
  )

  it('should delete the quote for the session reference', async () => {
    const requests = mockDeleteQuote(mswServer)

    await deleteQuotePostController.handler(
      createSessionRequest({ session: redeemedQuoteSession }),
      createMockRedirectToolkit()
    )

    expect(requests).toEqual([nrlReference])
  })

  it('should clear every journey session key on success', async () => {
    mockDeleteQuote(mswServer)
    const request = createSessionRequest({ session: redeemedQuoteSession })

    await deleteQuotePostController.handler(
      request,
      createMockRedirectToolkit()
    )

    expect(request.yar.get('requestToUse')).toBe(null)
    expect(request.yar.get('quote')).toBe(null)
    expect(request.yar.get('retrieveQuote')).toBe(null)
    expect(request.yar.get('pendingUploadId')).toBe(null)
  })

  it('should redirect to the delete quote confirmation page on success', async () => {
    mockDeleteQuote(mswServer)
    const toolkit = createMockRedirectToolkit()

    await deleteQuotePostController.handler(
      createSessionRequest({ session: redeemedQuoteSession }),
      toolkit
    )

    expect(toolkit.redirect).toHaveBeenCalledWith(
      '/request-to-use/delete-quote-confirmation'
    )
    expect(toolkit.response.code).toHaveBeenCalledWith(303)
  })

  it.each([404, 500])(
    'should keep the session and not redirect when the delete returns %i',
    async (status) => {
      mockDeleteQuote(mswServer, { status })
      const request = createSessionRequest({ session: redeemedQuoteSession })
      const toolkit = createMockRedirectToolkit()

      await expect(
        deleteQuotePostController.handler(request, toolkit)
      ).rejects.toThrow()

      expect(request.yar.get('requestToUse')).toEqual({ nrlReference })
      expect(request.yar.get('quote')).toEqual(reviewQuoteSession.quote)
      expect(toolkit.redirect).not.toHaveBeenCalled()
    }
  )
})
