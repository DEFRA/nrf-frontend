import { seedSessionFromQuote } from './index.js'
import { createSessionRequest } from '../../../../test-utils/create-session-request.js'
import { savedQuote } from '../../../../test-utils/fixtures/saved-quote.js'
import { boundaryGeojson } from '../../../../test-utils/fixtures/boundary-geojson.js'
import { quoteUploadSession } from '../../../../test-utils/fixtures/upload-session.js'

const staleSession = {
  manage: { whatWouldYouLikeToDo: 'quote' },
  quote: { planningType: 'other', housingUnits: 7 },
  retrieveQuote: { hasNrlReference: 'yes', nrlReference: 'NRL-654321' },
  requestToUse: { nrlReference: 'NRL-654321' },
  ...quoteUploadSession
}

describe('seedSessionFromQuote', () => {
  const seed = () => {
    const request = createSessionRequest({ session: staleSession })
    seedSessionFromQuote({ request, quote: savedQuote })
    return request
  }

  it('should fill the quote answers from the saved quote', () => {
    expect(seed().yar.get('quote')).toEqual({
      planningType: 'full-planning-permission',
      isHousing: 'yes',
      housingUnits: 42,
      email: savedQuote.email.address,
      boundaryEntryType: 'upload',
      boundaryFilename: 'site-plan.geojson',
      boundaryGeojson
    })
  })

  it('should keep the NRL reference in the request to use session', () => {
    expect(seed().yar.get('requestToUse')).toEqual({
      nrlReference: savedQuote.reference
    })
  })

  it('should clear everything else the user had', () => {
    const request = seed()

    for (const key of [
      'manage',
      'retrieveQuote',
      ...Object.keys(quoteUploadSession)
    ]) {
      expect(request.yar.get(key), `${key} should be cleared`).toBeNull()
    }
  })
})
