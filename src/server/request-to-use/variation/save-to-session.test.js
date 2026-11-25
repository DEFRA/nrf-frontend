import { saveVariation } from './save-to-session.js'
import { requestToUseSession } from '../helpers/request-to-use-session/index.js'

const createRequest = (requestToUse) => {
  const store = { requestToUse }
  return {
    yar: {
      get: (key) => store[key] ?? null,
      set: (key, value) => {
        store[key] = value
      }
    },
    logger: { error: vi.fn() }
  }
}

const planning = {
  originalCommitted: 'yes',
  originalNrlReference: 'NRL-123456'
}

describe('saveVariation', () => {
  it('discards the original permission answers when the answer is no', () => {
    const request = createRequest({ variation: 'yes', ...planning })

    saveVariation(request, { variation: 'no' })

    expect(requestToUseSession.get(request)).toEqual({ variation: 'no' })
  })

  it('keeps the original permission answers when the answer is yes', () => {
    const request = createRequest({ variation: 'yes', ...planning })

    saveVariation(request, { variation: 'yes' })

    expect(requestToUseSession.get(request)).toEqual({
      variation: 'yes',
      ...planning
    })
  })
})
