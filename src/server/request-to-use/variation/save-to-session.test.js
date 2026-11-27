import { saveVariation } from './save-to-session.js'
import { requestToUseSession } from '../helpers/request-to-use-session/index.js'
import { createSessionRequest } from '../../../test-utils/create-session-request.js'
import { originalNrlReference } from '../../../test-utils/fixtures/quote.js'

const planning = {
  originalCommitted: 'yes',
  originalNrlReference
}

describe('saveVariation', () => {
  it('discards the original permission answers when the answer is no', () => {
    const request = createSessionRequest({
      session: { requestToUse: { variation: 'yes', ...planning } }
    })

    saveVariation(request, { variation: 'no' })

    expect(requestToUseSession.get(request)).toEqual({ variation: 'no' })
  })

  it('keeps the original permission answers when the answer is yes', () => {
    const request = createSessionRequest({
      session: { requestToUse: { variation: 'yes', ...planning } }
    })

    saveVariation(request, { variation: 'yes' })

    expect(requestToUseSession.get(request)).toEqual({
      variation: 'yes',
      ...planning
    })
  })
})
