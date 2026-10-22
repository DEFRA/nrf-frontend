import { getByRole } from '@testing-library/dom'
import { checkBoundaryGeometry } from '../../../common/services/boundary.js'
import { routePath, checkPath, savePath } from './routes.js'
import { setupTestServer } from '../../../../test-utils/setup-test-server.js'
import { setupSeededRequestToUseServer } from '../../../../test-utils/setup-seeded-request-to-use-server.js'
import { getResponse } from '../../../../test-utils/get-response.js'
import { loadPage } from '../../../../test-utils/load-page.js'
import { submitForm } from '../../../../test-utils/submit-form.js'
import { withCompleteQuoteSession } from '../../../../test-utils/with-complete-quote-session.js'
import {
  boundaryGeojsonWithEdp,
  boundaryGeojsonWithExcludedArea
} from '../../../../test-utils/fixtures/boundary-geojson.js'

vi.mock('../../../common/services/boundary.js')

describe('Change draw boundary page', () => {
  const getServer = setupTestServer()
  const getSeededServer = setupSeededRequestToUseServer()
  const reviewQuoteDetailsPath = '/request-to-use/review-quote-details'

  it('should redirect to the start page when there is no request to use session', async () => {
    const response = await getResponse({
      server: getServer(),
      requestUrl: routePath,
      cookie: await withCompleteQuoteSession(getServer())
    })

    expect(response.statusCode).toBe(302)
    expect(response.headers.location).toBe('/manage/start-page')
  })

  it('should point the map at the change alias endpoints', async () => {
    const cookie = await withCompleteQuoteSession(getSeededServer())

    const document = await loadPage({
      requestUrl: routePath,
      server: getSeededServer(),
      cookie
    })

    expect(getByRole(document, 'heading', { level: 1 })).toHaveTextContent(
      'Draw your boundary on a map'
    )

    const mapEl = document.getElementById('draw-boundary-map')
    // The saved boundary must reach the map: a redraw starts from the geometry
    // cached in the quote session (seeded nested in the check-response shape).
    expect(mapEl.getAttribute('data-existing-boundary-geojson')).not.toBe(
      'null'
    )
    expect(mapEl).toHaveAttribute(
      'data-boundary-validation-url',
      '/request-to-use/change/draw-boundary/check'
    )
    expect(mapEl).toHaveAttribute(
      'data-save-and-continue-url',
      '/request-to-use/change/draw-boundary/save'
    )
    expect(mapEl).toHaveAttribute(
      'data-back-link-path',
      '/request-to-use/change/boundary-type'
    )
  })

  it('should return to the review page when a drawn boundary is saved', async () => {
    const { response } = await submitForm({
      requestUrl: savePath,
      server: getSeededServer(),
      formData: { boundaryGeojson: boundaryGeojsonWithEdp },
      cookie: await withCompleteQuoteSession(getSeededServer())
    })

    expect(response.statusCode).toBe(303)
    expect(response.headers.location).toBe(reviewQuoteDetailsPath)
  })

  it('should keep the excluded area dropout page when a drawn boundary intersects one', async () => {
    const { response } = await submitForm({
      requestUrl: savePath,
      server: getSeededServer(),
      formData: { boundaryGeojson: boundaryGeojsonWithExcludedArea },
      cookie: await withCompleteQuoteSession(getSeededServer())
    })

    expect(response.statusCode).toBe(303)
    expect(response.headers.location).toBe('/quote/excluded-area')
  })

  it('should validate drawn geometry through the check endpoint', async () => {
    const mockGeojson = {
      boundaryGeometryOriginal: { type: 'Polygon', coordinates: [] },
      boundaryGeometryWgs84: { type: 'Polygon', coordinates: [] },
      intersectingEdps: []
    }
    vi.mocked(checkBoundaryGeometry).mockResolvedValue({ geojson: mockGeojson })
    const cookie = await withCompleteQuoteSession(getSeededServer())

    const response = await getSeededServer().inject({
      method: 'POST',
      url: checkPath,
      headers: { cookie },
      payload: {
        geometry: {
          type: 'Polygon',
          coordinates: [
            [
              [-1.5, 52.0],
              [-1.4, 52.0],
              [-1.4, 52.1],
              [-1.5, 52.0]
            ]
          ]
        }
      }
    })

    expect(response.statusCode).toBe(200)
    expect(JSON.parse(response.payload)).toEqual(mockGeojson)
  })
})
