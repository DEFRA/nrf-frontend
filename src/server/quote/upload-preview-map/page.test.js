import { getByRole, queryByRole } from '@testing-library/dom'
import { routePath } from './routes.js'
import { statusCodes } from '../../common/constants/status-codes.js'
import { setupTestServer } from '../../../test-utils/setup-test-server.js'
import { submitForm } from '../../../test-utils/submit-form.js'
import { withValidQuoteSession } from '../../../test-utils/with-valid-quote-session.js'
import { loadPage } from '../../../test-utils/load-page.js'
import { mockCheckBoundary } from '../../../test-utils/mock-check-boundary.js'
import { getBoundaryErrorMessage } from '../../common/constants/boundary-error-messages.js'
import { checkBoundaryPath } from '../upload-received/routes.js'
import {
  boundaryGeojson,
  boundaryGeojsonWithEdp
} from '../../../test-utils/fixtures/boundary-geojson.js'

vi.mock('../../common/services/boundary.js')

const boundaryCheckPath = checkBoundaryPath.replace('{id}', 'test-upload-id')
const retryLinkText = 'Upload a new file or draw on a map'

describe('Boundary map page', () => {
  const getServer = setupTestServer()

  beforeEach(() => {
    mockCheckBoundary({ geojson: boundaryGeojson })
  })

  describe('when boundary does not intersect EDP', () => {
    it('redirects to the no-edp page instead of rendering the map', async () => {
      const cookie = await withValidQuoteSession(getServer(), boundaryCheckPath)
      const response = await getServer().inject({
        method: 'GET',
        url: routePath,
        headers: { cookie }
      })

      expect(response.statusCode).toBe(statusCodes.found)
      expect(response.headers.location).toBe('/quote/no-edp')
    })

    it('redirects the form post to the no-edp page', async () => {
      const cookie = await withValidQuoteSession(getServer(), boundaryCheckPath)
      const { response } = await submitForm({
        requestUrl: routePath,
        server: getServer(),
        formData: {},
        cookie
      })

      expect(response.statusCode).toBe(statusCodes.redirectAfterPost)
      expect(response.headers.location).toBe('/quote/no-edp')
    })
  })

  it('should redirect to upload-boundary if the session cache does not contain boundary data', async () => {
    const sessionCookie = await withValidQuoteSession(getServer())
    const response = await getServer().inject({
      method: 'GET',
      url: routePath,
      headers: { cookie: sessionCookie }
    })
    expect(response.statusCode).toBe(statusCodes.found)
    expect(response.headers.location).toBe('/quote/upload-boundary')
  })

  describe('when boundary intersects EDP', () => {
    beforeEach(() => {
      mockCheckBoundary({ geojson: boundaryGeojsonWithEdp })
    })

    it('populates map element dataset attributes from cached boundaryGeojson session data', async () => {
      const cookie = await withValidQuoteSession(getServer(), boundaryCheckPath)
      const document = await loadPage({
        requestUrl: routePath,
        server: getServer(),
        cookie
      })

      const mapEl = document.getElementById('boundary-map')
      expect(mapEl).toBeInTheDocument()
      expect(mapEl).toHaveAttribute(
        'data-geojson',
        JSON.stringify(boundaryGeojsonWithEdp.boundaryGeometryWgs84)
      )
      expect(mapEl).toHaveAttribute(
        'data-existing-boundary-metadata',
        JSON.stringify(boundaryGeojsonWithEdp.boundaryMetadata)
      )
    })

    it('should display EDP information', async () => {
      const cookie = await withValidQuoteSession(getServer(), boundaryCheckPath)
      const document = await loadPage({
        requestUrl: routePath,
        server: getServer(),
        cookie
      })

      expect(document.body.textContent).toContain('Kent Downs EDP')
      expect(document.body.textContent).not.toContain('North Downs Woodlands')
    })

    it('should display the EDP overlap area and percentage', async () => {
      const cookie = await withValidQuoteSession(getServer(), boundaryCheckPath)
      const document = await loadPage({
        requestUrl: routePath,
        server: getServer(),
        cookie
      })

      expect(document.body.textContent).toContain('overlap: 0.5 ha')
      expect(document.body.textContent).toContain('(25% of boundary)')
    })

    it('should show save and continue button', async () => {
      const cookie = await withValidQuoteSession(getServer(), boundaryCheckPath)
      const document = await loadPage({
        requestUrl: routePath,
        server: getServer(),
        cookie
      })

      expect(
        getByRole(document, 'button', { name: 'Save and continue' })
      ).toBeInTheDocument()
    })

    it('should link back to the boundary type page to retry', async () => {
      const cookie = await withValidQuoteSession(getServer(), boundaryCheckPath)
      const document = await loadPage({
        requestUrl: routePath,
        server: getServer(),
        cookie
      })

      const retryLink = getByRole(document, 'link', { name: retryLinkText })
      expect(retryLink).toHaveAttribute('href', '/quote/boundary-type')
    })

    it('should redirect to email on save and continue', async () => {
      const cookie = await withValidQuoteSession(getServer(), boundaryCheckPath)
      const { response } = await submitForm({
        requestUrl: routePath,
        server: getServer(),
        formData: {},
        cookie
      })
      expect(response.statusCode).toBe(statusCodes.redirectAfterPost)
      expect(response.headers.location).toBe('/quote/email')
    })
  })

  describe('when boundary check returns an error', () => {
    beforeEach(() => {
      mockCheckBoundary({ failureReason: 'self_intersecting_geometry' })
    })

    it('should display the error message', async () => {
      const cookie = await withValidQuoteSession(getServer(), boundaryCheckPath)
      const document = await loadPage({
        requestUrl: routePath,
        server: getServer(),
        cookie
      })

      expect(document.body.textContent).toContain(
        getBoundaryErrorMessage('self_intersecting_geometry')
      )
    })

    it('should not show validated successfully message', async () => {
      const cookie = await withValidQuoteSession(getServer(), boundaryCheckPath)
      const document = await loadPage({
        requestUrl: routePath,
        server: getServer(),
        cookie
      })

      expect(document.body.textContent).not.toContain('validated successfully')
    })

    it('should link back to the boundary type page to retry', async () => {
      const cookie = await withValidQuoteSession(getServer(), boundaryCheckPath)
      const document = await loadPage({
        requestUrl: routePath,
        server: getServer(),
        cookie
      })

      const retryLink = getByRole(document, 'link', { name: retryLinkText })
      expect(retryLink).toHaveAttribute('href', '/quote/boundary-type')
    })

    it('does not show a save and continue button on error', async () => {
      const cookie = await withValidQuoteSession(getServer(), boundaryCheckPath)
      const document = await loadPage({
        requestUrl: routePath,
        server: getServer(),
        cookie
      })

      expect(
        queryByRole(document, 'button', { name: 'Save and continue' })
      ).not.toBeInTheDocument()
    })

    it('renders the map for a geometry error that carries geometry', async () => {
      mockCheckBoundary({
        geojson: boundaryGeojson,
        failureReason: 'self_intersecting_geometry'
      })
      const cookie = await withValidQuoteSession(getServer(), boundaryCheckPath)
      const document = await loadPage({
        requestUrl: routePath,
        server: getServer(),
        cookie
      })

      expect(document.getElementById('boundary-map')).toBeInTheDocument()
    })

    it('hides the map when the error carries no geometry', async () => {
      mockCheckBoundary({ failureReason: 'unsupported_crs' })
      const cookie = await withValidQuoteSession(getServer(), boundaryCheckPath)
      const document = await loadPage({
        requestUrl: routePath,
        server: getServer(),
        cookie
      })

      expect(document.getElementById('boundary-map')).not.toBeInTheDocument()
    })
  })
})
