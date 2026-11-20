import { describe, expect, it } from 'vitest'
import {
  clearAccountAnswers,
  getAddressForCurrentAccount,
  requestToUseSession,
  saveEnterAddress
} from './index.js'
import { createSessionRequest } from '../../../../test-utils/create-session-request.js'
import { fullQuote } from '../../../../test-utils/fixtures/quote.js'
import { recalculatedLevy } from '../../../../test-utils/fixtures/levy.js'

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
    const levy = recalculatedLevy

    const result = requestToUseSession.save(request, { levy })

    expect(result).toEqual({ nrlReference: fullQuote.reference, levy })
    expect(request.logger.error).not.toHaveBeenCalled()
  })

  it.each([
    ['calculationDate', 'not a date'],
    ['provisionalAmount', -1],
    ['inflationAdjustedAmount', -1],
    ['originalBaseAmount', -1]
  ])('logs a schema error when the levy %s is %s', (field, value) => {
    const request = createSessionRequest({
      session: { requestToUse: { nrlReference: fullQuote.reference } }
    })

    requestToUseSession.save(request, {
      levy: { ...recalculatedLevy, [field]: value }
    })

    expect(request.logger.error).toHaveBeenCalled()
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

  describe('address for the signed in relationship', () => {
    const address = { addressLine1: '1 Road', townOrCity: 'Leeds' }
    const addressPayload = { ...address, postcode: 'LS1 1AA' }

    const createSignedInRequest = ({ currentRelationshipId, requestToUse }) =>
      createSessionRequest({
        session: { requestToUse },
        auth: { credentials: { profile: { currentRelationshipId } } }
      })

    it('stamps the saved address with the signed in relationship', () => {
      const request = createSignedInRequest({ currentRelationshipId: 'rel-1' })

      saveEnterAddress(request, addressPayload)

      expect(requestToUseSession.get(request).signin.relationshipId).toBe(
        'rel-1'
      )
    })

    it('replaces the stamp from an earlier relationship when the address is saved again', () => {
      const request = createSignedInRequest({
        currentRelationshipId: 'rel-2',
        requestToUse: { signin: { relationshipId: 'rel-1' } }
      })

      saveEnterAddress(request, addressPayload)

      expect(requestToUseSession.get(request).signin.relationshipId).toBe(
        'rel-2'
      )
    })

    it('leaves no stamp when the user has no relationship', () => {
      const request = createSignedInRequest({
        requestToUse: { signin: { relationshipId: 'rel-1' } }
      })

      saveEnterAddress(request, addressPayload)

      expect(requestToUseSession.get(request).signin).not.toHaveProperty(
        'relationshipId'
      )
    })

    it('returns the address when it was entered under the signed in relationship', () => {
      const request = createSignedInRequest({
        currentRelationshipId: 'rel-1',
        requestToUse: { address, signin: { relationshipId: 'rel-1' } }
      })

      expect(getAddressForCurrentAccount(request)).toEqual(address)
    })

    it('returns the address for a user with no relationship when none was stamped', () => {
      const request = createSignedInRequest({ requestToUse: { address } })

      expect(getAddressForCurrentAccount(request)).toEqual(address)
    })

    it.each([
      ['a different relationship', 'rel-2', { relationshipId: 'rel-1' }],
      ['no stamp', 'rel-1', {}],
      ['no relationship now', undefined, { relationshipId: 'rel-1' }]
    ])(
      'ignores the address entered under %s',
      (_, currentRelationshipId, signin) => {
        const request = createSignedInRequest({
          currentRelationshipId,
          requestToUse: { address, signin }
        })

        expect(getAddressForCurrentAccount(request)).toBeUndefined()
      }
    )
  })
})
