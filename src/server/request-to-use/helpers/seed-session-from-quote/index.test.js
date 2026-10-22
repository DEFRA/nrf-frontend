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
      // The quote record's geometry is nested in the check-response shape the
      // map pages read, so the saved boundary loads into the draw map. The
      // intersecting EDPs are rebuilt from the quote's own EDP list so the
      // file preview can render without a fresh boundary check.
      boundaryGeojson: {
        boundaryGeometryWgs84: boundaryGeojson.boundaryGeometryWgs84,
        intersectingEdps: [
          { label: 'Norfolk Fens East' },
          { label: 'Broadland Rivers' }
        ]
      }
    })
  })

  it('should keep the NRL reference in the request to use session', () => {
    expect(seed().yar.get('requestToUse')).toEqual({
      nrlReference: savedQuote.reference
    })
  })

  it('should select the request to use journey', () => {
    expect(seed().yar.get('manage')).toEqual({
      whatWouldYouLikeToDo: 'request-to-use'
    })
  })

  it('should clear everything else the user had', () => {
    const request = seed()

    for (const key of ['retrieveQuote', ...Object.keys(quoteUploadSession)]) {
      expect(request.yar.get(key), `${key} should be cleared`).toBeNull()
    }
  })
})
