import { describe, expect, it } from 'vitest'
import { requestToUseSession } from './index.js'
import { createSessionRequest } from '../../../../test-utils/create-session-request.js'
import { fullQuote } from '../../../../test-utils/fixtures/quote.js'

const savedNrlReference = {
  nrlReference: fullQuote.reference,
  acceptLevy: 'yes'
}

describe('requestToUseSession', () => {
  it('saves the variation answer without logging a schema error', () => {
    const request = createSessionRequest({
      session: { requestToUse: savedNrlReference }
    })

    const result = requestToUseSession.save(request, { variation: 'yes' })

    expect(result).toEqual({ ...savedNrlReference, variation: 'yes' })
    expect(request.logger.error).not.toHaveBeenCalled()
  })

  it('allows other answers to be saved before variation has been answered', () => {
    const request = createSessionRequest({
      session: { requestToUse: savedNrlReference }
    })

    const result = requestToUseSession.save(request, {
      defraId: { userType: 'individual' }
    })

    expect(result).toEqual({
      ...savedNrlReference,
      defraId: { userType: 'individual' }
    })
    expect(request.logger.error).not.toHaveBeenCalled()
  })

  it('logs an error when the variation answer is not a recognised option', () => {
    const request = createSessionRequest({
      session: { requestToUse: savedNrlReference }
    })

    requestToUseSession.save(request, { variation: 'maybe' })

    expect(request.logger.error).toHaveBeenCalledWith(
      expect.any(Error),
      'session namespace requestToUse: invalid data on save'
    )
  })
})
