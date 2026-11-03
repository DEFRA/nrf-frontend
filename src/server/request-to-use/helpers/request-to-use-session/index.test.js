import { describe, it, expect } from 'vitest'
import { requestToUseSession } from './index.js'
import { createMockRequest } from '../../../../test-utils/create-mock-request.js'
import { fullQuote } from '../../../../test-utils/fixtures/quote.js'

const originalReferenceKey = 'originalNrlReference'

const createRequest = () => {
  const store = {}
  return createMockRequest({
    yar: {
      get: (key) => store[key],
      set: (key, value) => {
        store[key] = value
      }
    }
  })
}

const loggedErrorPaths = (request) =>
  request.logger.error.mock.calls.flatMap(([error]) =>
    error.details.map((detail) => detail.path[0])
  )

describe('requestToUseSession', () => {
  it('should not complain about the original reference when it has not been saved yet', () => {
    const request = createRequest()

    requestToUseSession.save(request, { nrlReference: fullQuote.reference })

    expect(loggedErrorPaths(request)).not.toContain(originalReferenceKey)
  })

  it('should save the original reference in upper case', () => {
    const request = createRequest()

    const saved = requestToUseSession.save(request, {
      nrlReference: fullQuote.reference,
      [originalReferenceKey]: ' nrl-654321 '
    })

    expect(saved[originalReferenceKey]).toBe('NRL-654321')
    expect(loggedErrorPaths(request)).not.toContain(originalReferenceKey)
  })

  it('should log an error when the original reference is in the wrong format', () => {
    const request = createRequest()

    requestToUseSession.save(request, {
      nrlReference: fullQuote.reference,
      [originalReferenceKey]: 'not-a-reference'
    })

    expect(loggedErrorPaths(request)).toContain(originalReferenceKey)
  })
})
