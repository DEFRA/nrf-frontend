import { saveOriginalCommitted } from './save-to-session.js'
import { requestToUseSession } from '../helpers/request-to-use-session/index.js'
import { createSessionRequest } from '../../../test-utils/create-session-request.js'
import { originalNrlReference } from '../../../test-utils/fixtures/quote.js'

const saved = {
  variation: 'yes',
  originalCommitted: 'yes',
  originalNrlReference
}

describe('saveOriginalCommitted', () => {
  it('discards the original NRL reference when the answer is no', () => {
    const request = createSessionRequest({ session: { requestToUse: saved } })

    saveOriginalCommitted(request, { originalCommitted: 'no' })

    expect(requestToUseSession.get(request)).toEqual({
      variation: 'yes',
      originalCommitted: 'no'
    })
  })

  it('keeps the original NRL reference when the answer is yes', () => {
    const request = createSessionRequest({ session: { requestToUse: saved } })

    saveOriginalCommitted(request, { originalCommitted: 'yes' })

    expect(requestToUseSession.get(request)).toEqual(saved)
  })
})
