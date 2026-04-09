import { getByRole } from '@testing-library/dom'
import { routePath } from './routes.js'
import { setupTestServer } from '../../../test-utils/setup-test-server.js'
import { submitForm } from '../../../test-utils/submit-form.js'
import { withValidQuoteSession } from '../../../test-utils/with-valid-quote-session.js'
import { loadPage } from '../../../test-utils/load-page.js'
import { mockCheckBoundary } from '../../../test-utils/mock-check-boundary.js'
import { checkBoundaryPath } from '../upload-received/routes.js'
import {
  boundaryGeojson,
  boundaryGeojsonWithEdp
} from '../../../test-utils/fixtures/boundary-geojson.js'

vi.mock('../../common/services/boundary.js')

const boundaryCheckPath = checkBoundaryPath.replace('{id}', 'test-upload-id')
const uploadLinkText = 'Upload a different red line boundary file'
const drawLinkText = 'Draw the red line boundary on a map instead'

describe('Boundary map page', () => {
  const getServer = setupTestServer()

  beforeEach(() => {
    mockCheckBoundary({ geojson: boundaryGeojson })
  })

  describe('when boundary does not intersect EDP', () => {
    it('should render all page elements', async () => {
      const cookie = await withValidQuoteSession(getServer(), boundaryCheckPath)
      const document = await loadPage({
        requestUrl: routePath,
        server: getServer(),
        cookie
      })

      expect(getByRole(document, 'heading', { level: 1 })).toHaveTextContent(
        'Boundary Map'
      )
      expect(document.title).toBe(
        'Boundary Map - Nature Restoration Fund - Gov.uk'
      )
      expect(getByRole(document, 'link', { name: 'Back' })).toHaveAttribute(
        'href',
        '/quote/upload-boundary'
      )
      const csrfToken = document.querySelector('form input[name="csrfToken"]')
      expect(csrfToken).toBeInTheDocument()
    })

    it('should display no EDPs message', async () => {
      const cookie = await withValidQuoteSession(getServer(), boundaryCheckPath)
      const document = await loadPage({
        requestUrl: routePath,
        server: getServer(),
        cookie
      })

      expect(document.body.textContent).toContain(
        'There are no EDPs within the red line boundary.'
      )
    })

    it('should show save and continue button', async () => {
      const cookie = await withValidQuoteSession(getServer(), boundaryCheckPath)
      const document = await loadPage({
        requestUrl: routePath,
        server: getServer(),
        cookie
      })

      const saveButton = getByRole(document, 'button', {
        name: 'Save and continue'
      })
      expect(saveButton).not.toBeDisabled()
    })

    it('should display feature count', async () => {
      const cookie = await withValidQuoteSession(getServer(), boundaryCheckPath)
      const document = await loadPage({
        requestUrl: routePath,
        server: getServer(),
        cookie
      })

      const body = document.querySelector('.govuk-body')
      expect(body.textContent).toContain('1 feature found')
    })

    it('should include map container with geojson data and map scripts', async () => {
      const cookie = await withValidQuoteSession(getServer(), boundaryCheckPath)
      const document = await loadPage({
        requestUrl: routePath,
        server: getServer(),
        cookie
      })

      const mapEl = document.getElementById('boundary-map')
      expect(mapEl).toBeInTheDocument()
      expect(mapEl.getAttribute('data-geojson')).toBeTruthy()
      expect(mapEl.getAttribute('data-map-style-url')).toBeTruthy()

      const mapCss = document.querySelector('link[href*="interactive-map"]')
      expect(mapCss).toBeInTheDocument()

      const scripts = Array.from(document.querySelectorAll('script[src]'))
      const mapScripts = scripts.filter((s) =>
        s.getAttribute('src').includes('interactive-map')
      )
      expect(mapScripts.length).toBeGreaterThanOrEqual(1)
    })

    it('should show upload another boundary file and draw boundary links', async () => {
      const cookie = await withValidQuoteSession(getServer(), boundaryCheckPath)
      const document = await loadPage({
        requestUrl: routePath,
        server: getServer(),
        cookie
      })

      const uploadLink = getByRole(document, 'link', {
        name: uploadLinkText
      })
      expect(uploadLink).toHaveAttribute('href', '/quote/upload-boundary')

      expect(
        getByRole(document, 'link', {
          name: drawLinkText
        })
      ).toHaveAttribute('href', '/quote/draw-boundary')
    })

    it('should redirect to no-edp page on save and continue', async () => {
      const cookie = await withValidQuoteSession(getServer(), boundaryCheckPath)
      const { response } = await submitForm({
        requestUrl: routePath,
        server: getServer(),
        formData: {},
        cookie
      })
      expect(response.statusCode).toBe(302)
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
    expect(response.statusCode).toBe(302)
    expect(response.headers.location).toBe('/quote/upload-boundary')
  })

  describe('when boundary intersects EDP', () => {
    beforeEach(() => {
      mockCheckBoundary({ geojson: boundaryGeojsonWithEdp })
    })

    it('should display EDP information', async () => {
      const cookie = await withValidQuoteSession(getServer(), boundaryCheckPath)
      const document = await loadPage({
        requestUrl: routePath,
        server: getServer(),
        cookie
      })

      expect(document.body.textContent).toContain('Kent Downs EDP')
      expect(document.body.textContent).toContain('North Downs Woodlands')
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

    it('should show upload another boundary file and draw boundary links', async () => {
      const cookie = await withValidQuoteSession(getServer(), boundaryCheckPath)
      const document = await loadPage({
        requestUrl: routePath,
        server: getServer(),
        cookie
      })

      const uploadLink = getByRole(document, 'link', {
        name: uploadLinkText
      })
      expect(uploadLink).toHaveAttribute('href', '/quote/upload-boundary')

      expect(
        getByRole(document, 'link', {
          name: drawLinkText
        })
      ).toHaveAttribute('href', '/quote/draw-boundary')
    })

    it('should redirect to development-types on save and continue', async () => {
      const cookie = await withValidQuoteSession(getServer(), boundaryCheckPath)
      const { response } = await submitForm({
        requestUrl: routePath,
        server: getServer(),
        formData: {},
        cookie
      })
      expect(response.statusCode).toBe(302)
      expect(response.headers.location).toBe('/quote/development-types')
    })
  })

  describe('when boundary check returns an error', () => {
    beforeEach(() => {
      mockCheckBoundary({ error: 'Invalid geometry detected' })
    })

    it('should display error summary', async () => {
      const cookie = await withValidQuoteSession(getServer(), boundaryCheckPath)
      const document = await loadPage({
        requestUrl: routePath,
        server: getServer(),
        cookie
      })

      expect(document.body.textContent).toContain('There is a problem')
      expect(document.body.textContent).toContain('Invalid geometry detected')
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

    it('should show upload another file link', async () => {
      const cookie = await withValidQuoteSession(getServer(), boundaryCheckPath)
      const document = await loadPage({
        requestUrl: routePath,
        server: getServer(),
        cookie
      })

      const uploadLink = getByRole(document, 'link', {
        name: uploadLinkText
      })
      expect(uploadLink).toHaveAttribute('href', '/quote/upload-boundary')
    })

    it('should show draw boundary link', async () => {
      const cookie = await withValidQuoteSession(getServer(), boundaryCheckPath)
      const document = await loadPage({
        requestUrl: routePath,
        server: getServer(),
        cookie
      })

      expect(
        getByRole(document, 'link', {
          name: drawLinkText
        })
      ).toHaveAttribute('href', '/quote/draw-boundary')
    })

    it('should still render the map container', async () => {
      const cookie = await withValidQuoteSession(getServer(), boundaryCheckPath)
      const document = await loadPage({
        requestUrl: routePath,
        server: getServer(),
        cookie
      })

      const mapEl = document.getElementById('boundary-map')
      expect(mapEl).toBeInTheDocument()
    })

    it('should disable the Save button on boundary error', async () => {
      const cookie = await withValidQuoteSession(getServer(), boundaryCheckPath)
      const document = await loadPage({
        requestUrl: routePath,
        server: getServer(),
        cookie
      })

      const saveButton = getByRole(document, 'button', {
        name: 'Save and continue'
      })
      expect(saveButton).toBeDisabled()
    })
  })
})
