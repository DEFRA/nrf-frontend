import { describe, expect, it } from 'vitest'
import { clearAccountAnswers, requestToUseSession } from './index.js'
import { createSessionRequest } from '../../../../test-utils/create-session-request.js'
import { fullQuote } from '../../../../test-utils/fixtures/quote.js'

const originalReferenceKey = 'originalNrlReference'

const savedNrlReference = {
  nrlReference: fullQuote.reference,
  acceptLevy: 'yes'
}

const createRequest = () =>
  createSessionRequest({ session: { requestToUse: savedNrlReference } })

const loggedErrorPaths = (request) =>
  request.logger.error.mock.calls.flatMap(([error]) =>
    error.details.map((detail) => detail.path[0])
  )

describe('requestToUseSession', () => {
  it('saves the variation answer without logging a schema error', () => {
    const request = createRequest()

    const result = requestToUseSession.save(request, { variation: 'yes' })

    expect(result).toEqual({ ...savedNrlReference, variation: 'yes' })
    expect(request.logger.error).not.toHaveBeenCalled()
  })

  it('allows the levy to be saved before the accept levy answer exists', () => {
    const request = createSessionRequest({
      session: { requestToUse: { nrlReference: fullQuote.reference } }
    })
    const levy = {
      calculationDate: '2026-01-01',
      provisionalAmount: 100,
      inflationAdjustedAmount: 110
    }

    const result = requestToUseSession.save(request, { levy })

    expect(result).toEqual({ nrlReference: fullQuote.reference, levy })
    expect(request.logger.error).not.toHaveBeenCalled()
  })

  it('allows other answers to be saved before variation has been answered', () => {
    const request = createRequest()

    const result = requestToUseSession.save(request, {
      signin: { intendedUserType: 'individual' }
    })

    expect(result).toEqual({
      ...savedNrlReference,
      signin: { intendedUserType: 'individual' }
    })
    expect(request.logger.error).not.toHaveBeenCalled()
  })

  it('logs an error when the variation answer is not a recognised option', () => {
    const request = createRequest()

    requestToUseSession.save(request, { variation: 'maybe' })

    expect(request.logger.error).toHaveBeenCalledWith(
      expect.any(Error),
      'session namespace requestToUse: invalid data on save'
    )
  })

  it('saves the original committed answer without logging a schema error', () => {
    const request = createSessionRequest({
      session: { requestToUse: savedNrlReference }
    })

    const result = requestToUseSession.save(request, {
      originalCommitted: 'no'
    })

    expect(result).toEqual({ ...savedNrlReference, originalCommitted: 'no' })
    expect(request.logger.error).not.toHaveBeenCalled()
  })

  it('logs an error when the original committed answer is not a recognised option', () => {
    const request = createSessionRequest({
      session: { requestToUse: savedNrlReference }
    })

    requestToUseSession.save(request, { originalCommitted: 'maybe' })

    expect(request.logger.error).toHaveBeenCalledWith(
      expect.any(Error),
      'session namespace requestToUse: invalid data on save'
    )
  })

  it('should not complain about the original reference when it has not been saved yet', () => {
    const request = createRequest()

    requestToUseSession.save(request, { nrlReference: fullQuote.reference })

    expect(loggedErrorPaths(request)).not.toContain(originalReferenceKey)
  })

  it('should save the original reference in upper case', () => {
    const request = createRequest()

    const saved = requestToUseSession.save(request, {
      [originalReferenceKey]: ' nrl-654321 '
    })

    expect(saved[originalReferenceKey]).toBe('NRL-654321')
    expect(loggedErrorPaths(request)).not.toContain(originalReferenceKey)
  })

  it('should log an error when the original reference is in the wrong format', () => {
    const request = createRequest()

    requestToUseSession.save(request, {
      [originalReferenceKey]: 'not-a-reference'
    })

    expect(loggedErrorPaths(request)).toContain(originalReferenceKey)
  })

  describe('clearAccountAnswers', () => {
    it('clears the address and sign in answers but keeps the intended user type and other answers', () => {
      const request = createSessionRequest({
        session: {
          requestToUse: {
            ...savedNrlReference,
            address: { addressLine1: '1 Road', townOrCity: 'Leeds' },
            signin: {
              intendedUserType: 'organisation',
              actualUserType: 'employee',
              organisation: { organisationName: 'Org', organisationId: '1' }
            }
          }
        }
      })

      clearAccountAnswers(request)

      expect(requestToUseSession.get(request)).toEqual({
        ...savedNrlReference,
        signin: { intendedUserType: 'organisation' }
      })
    })

    it('does nothing when there is no request to use session', () => {
      const request = createSessionRequest({ session: {} })

      clearAccountAnswers(request)

      expect(requestToUseSession.get(request)).toBeNull()
    })
  })
})
