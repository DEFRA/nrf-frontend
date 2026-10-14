import { describe, expect, it } from 'vitest'
import { retrieveQuoteSession, saveHasNrlReference } from './index.js'
import { createSessionRequest } from '../../../../test-utils/create-session-request.js'

const savedAnswers = { hasNrlReference: 'yes', nrlReference: 'NRL-123456' }

describe('saveHasNrlReference', () => {
  it('keeps a saved reference when the answer is yes', () => {
    const request = createSessionRequest({
      session: { retrieveQuote: savedAnswers }
    })

    const result = saveHasNrlReference(request, { hasNrlReference: 'yes' })

    expect(result).toEqual(savedAnswers)
  })

  it('clears a saved reference when the answer is no', () => {
    const request = createSessionRequest({
      session: { retrieveQuote: savedAnswers }
    })

    const result = saveHasNrlReference(request, { hasNrlReference: 'no' })

    expect(result).toEqual({ hasNrlReference: 'no', nrlReference: null })
    expect(retrieveQuoteSession.get(request)).toEqual(result)
  })
})
