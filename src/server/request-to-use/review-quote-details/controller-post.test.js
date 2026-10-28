import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { reviewQuoteDetailsPostController } from './controller-post.js'
import { createSessionRequest } from '../../../test-utils/create-session-request.js'
import { createMockRedirectToolkit } from '../../../test-utils/create-mock-redirect-toolkit.js'
import { setupMswServer } from '../../../test-utils/setup-msw-server.js'
import { mockRecalculateLevy } from '../../../test-utils/mock-recalculate-levy.js'
import { recalculatedLevy } from '../../../test-utils/fixtures/levy.js'
import { fullQuote } from '../../../test-utils/fixtures/quote.js'

const nrlReference = fullQuote.reference

const buildRequest = () =>
  createSessionRequest({
    session: {
      quote: { housingUnits: 42 },
      requestToUse: { nrlReference }
    }
  })

describe('reviewQuoteDetailsPostController', () => {
  const mswServer = setupMswServer()

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should recalculate the levy for the saved housing units', async () => {
    vi.setSystemTime(new Date('2026-10-14T09:30:00Z'))
    const requests = mockRecalculateLevy(mswServer)

    await reviewQuoteDetailsPostController.handler(
      buildRequest(),
      createMockRedirectToolkit()
    )

    expect(requests.map(({ body }) => body)).toEqual([
      { units: 42, requestDate: '2026-10-14' }
    ])
  })

  it('should use the UK calendar day as the request date', async () => {
    vi.setSystemTime(new Date('2026-07-14T23:30:00Z'))
    const requests = mockRecalculateLevy(mswServer)

    await reviewQuoteDetailsPostController.handler(
      buildRequest(),
      createMockRedirectToolkit()
    )

    expect(requests[0].body.requestDate).toBe('2026-07-15')
  })

  it('should save the levy to the request to use session and keep the NRL reference', async () => {
    mockRecalculateLevy(mswServer)
    const request = buildRequest()

    await reviewQuoteDetailsPostController.handler(
      request,
      createMockRedirectToolkit()
    )

    expect(request.yar.get('requestToUse')).toEqual({
      nrlReference,
      levy: recalculatedLevy
    })
  })

  it('should replace a previously saved levy when recalculating again', async () => {
    mockRecalculateLevy(mswServer)
    const request = buildRequest()
    request.yar.set('requestToUse', {
      nrlReference,
      levy: { ...recalculatedLevy, provisionalAmount: 1 }
    })

    await reviewQuoteDetailsPostController.handler(
      request,
      createMockRedirectToolkit()
    )

    expect(request.yar.get('requestToUse').levy).toEqual(recalculatedLevy)
  })

  it('should redirect to the accept levy page', async () => {
    mockRecalculateLevy(mswServer)
    const toolkit = createMockRedirectToolkit()

    await reviewQuoteDetailsPostController.handler(buildRequest(), toolkit)

    expect(toolkit.redirect).toHaveBeenCalledWith('/request-to-use/accept-levy')
    expect(toolkit.response.code).toHaveBeenCalledWith(303)
  })

  it('should not save a levy or redirect when the recalculation fails', async () => {
    mockRecalculateLevy(mswServer, { status: 500 })
    const request = buildRequest()
    const toolkit = createMockRedirectToolkit()

    await expect(
      reviewQuoteDetailsPostController.handler(request, toolkit)
    ).rejects.toThrow()

    expect(request.yar.get('requestToUse')).toEqual({ nrlReference })
    expect(toolkit.redirect).not.toHaveBeenCalled()
  })
})
