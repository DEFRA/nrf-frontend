import { saveOriginalCommitted } from './save-to-session.js'
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

const saved = {
  variation: 'yes',
  originalCommitted: 'yes',
  originalNrlReference: 'NRL-123456'
}

describe('saveOriginalCommitted', () => {
  it('discards the original NRL reference when the answer is no', () => {
    const request = createRequest(saved)

    saveOriginalCommitted(request, { originalCommitted: 'no' })

    expect(requestToUseSession.get(request)).toEqual({
      variation: 'yes',
      originalCommitted: 'no'
    })
  })

  it('keeps the original NRL reference when the answer is yes', () => {
    const request = createRequest(saved)

    saveOriginalCommitted(request, { originalCommitted: 'yes' })

    expect(requestToUseSession.get(request)).toEqual(saved)
  })
})
