import { JSDOM } from 'jsdom'
import { getByRole, queryByRole } from '@testing-library/dom'
import { routePath } from './routes.js'
import { setupTestServer } from '../../../test-utils/setup-test-server.js'
import { submitForm } from '../../../test-utils/submit-form.js'
import { withValidQuoteSession } from '../../../test-utils/with-valid-quote-session.js'
import { checkBoundary } from '../../common/services/boundary.js'
import { checkBoundaryPath } from '../upload-received/routes.js'

vi.mock('../../common/services/boundary.js')

const mockGeojson = {
  boundary_geojson_full: {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        geometry: {
          type: 'Polygon',
          coordinates: [
            [
              [0, 0],
              [1, 0],
              [1, 1],
              [0, 0]
            ]
          ]
        },
        properties: {}
      }
    ]
  },
  boundary_geometry: {
    type: 'Polygon',
    coordinates: [
      [
        [0, 0],
        [1, 0],
        [1, 1],
        [0, 0]
      ]
    ]
  },
  intersecting_edps: []
}

const mockEdpGeojson = {
  boundary_geojson_full: {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        geometry: {
          type: 'Polygon',
          coordinates: [
            [
              [0, 0],
              [1, 0],
              [1, 1],
              [0, 0]
            ]
          ]
        },
        properties: {}
      }
    ]
  },
  boundary_geometry: {
    type: 'Polygon',
    coordinates: [
      [
        [0, 0],
        [1, 0],
        [1, 1],
        [0, 0]
      ]
    ]
  },
  intersecting_edps: [
    { label: 'Kent Downs EDP', n2k_site_name: 'North Downs Woodlands' }
  ]
}

async function setupSession(server, geojson = mockGeojson) {
  const sessionCookie = await withValidQuoteSession(server)
  vi.mocked(checkBoundary).mockResolvedValue({ geojson })
  const { cookie } = await submitForm({
    requestUrl: checkBoundaryPath.replace('{id}', 'test-upload-id'),
    server,
    formData: {},
    cookie: sessionCookie
  })
  return cookie
}

async function setupErrorSession(server, error, geojson = null) {
  const sessionCookie = await withValidQuoteSession(server)
  vi.mocked(checkBoundary).mockResolvedValue({ error, geojson })
  const { cookie } = await submitForm({
    requestUrl: checkBoundaryPath.replace('{id}', 'test-upload-id'),
    server,
    formData: {},
    cookie: sessionCookie
  })
  return cookie
}

async function loadPageWithSession(server, geojson = mockGeojson) {
  const cookie = await setupSession(server, geojson)
  const response = await server.inject({
    method: 'GET',
    url: routePath,
    headers: cookie ? { cookie } : {}
  })
  const { window } = new JSDOM(response.result)
  return { document: window.document, cookie }
}

async function loadPageWithError(server, error, geojson = null) {
  const cookie = await setupErrorSession(server, error, geojson)
  const response = await server.inject({
    method: 'GET',
    url: routePath,
    headers: cookie ? { cookie } : {}
  })
  const { window } = new JSDOM(response.result)
  return { document: window.document, cookie }
}

describe('Boundary map page', () => {
  const getServer = setupTestServer()

  describe('when boundary does not intersect EDP', () => {
    it('should render all page elements', async () => {
      const { document } = await loadPageWithSession(getServer())

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
      const { document } = await loadPageWithSession(getServer())

      expect(document.body.textContent).toContain(
        'There are no EDPs within the red line boundary.'
      )
    })

    it('should show save and continue button', async () => {
      const { document } = await loadPageWithSession(getServer())

      expect(
        getByRole(document, 'button', { name: 'Save and continue' })
      ).toBeInTheDocument()
    })

    it('should display feature count', async () => {
      const { document } = await loadPageWithSession(getServer())

      const body = document.querySelector('.govuk-body')
      expect(body.textContent).toContain('1 feature found')
    })

    it('should include map container with geojson data and map scripts', async () => {
      const { document } = await loadPageWithSession(getServer())

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

    it('should redirect to no-edp page on save and continue', async () => {
      const cookie = await setupSession(getServer())
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
    it('should display EDP information', async () => {
      const { document } = await loadPageWithSession(
        getServer(),
        mockEdpGeojson
      )

      expect(document.body.textContent).toContain('Kent Downs EDP')
      expect(document.body.textContent).toContain('North Downs Woodlands')
    })

    it('should show save and continue button', async () => {
      const { document } = await loadPageWithSession(
        getServer(),
        mockEdpGeojson
      )

      expect(
        getByRole(document, 'button', { name: 'Save and continue' })
      ).toBeInTheDocument()
    })

    it('should show upload another boundary file link', async () => {
      const { document } = await loadPageWithSession(
        getServer(),
        mockEdpGeojson
      )

      const uploadLink = getByRole(document, 'link', {
        name: 'Upload a different red line boundary file'
      })
      expect(uploadLink).toHaveAttribute('href', '/quote/upload-boundary')
    })

    it('should redirect to development-types on save and continue', async () => {
      const cookie = await setupSession(getServer(), mockEdpGeojson)
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
    it('should display error summary', async () => {
      const { document } = await loadPageWithError(
        getServer(),
        'Invalid geometry detected'
      )

      expect(document.body.textContent).toContain('There is a problem')
      expect(document.body.textContent).toContain('Invalid geometry detected')
    })

    it('should not show validated successfully message', async () => {
      const { document } = await loadPageWithError(
        getServer(),
        'Invalid geometry detected'
      )

      expect(document.body.textContent).not.toContain('validated successfully')
    })

    it('should not show save and continue button', async () => {
      const { document } = await loadPageWithError(
        getServer(),
        'Invalid geometry detected'
      )

      expect(
        queryByRole(document, 'button', { name: 'Save and continue' })
      ).not.toBeInTheDocument()
    })

    it('should show upload another file link', async () => {
      const { document } = await loadPageWithError(
        getServer(),
        'Invalid geometry detected'
      )

      const uploadLink = getByRole(document, 'link', {
        name: 'Upload a different red line boundary file'
      })
      expect(uploadLink).toHaveAttribute('href', '/quote/upload-boundary')
    })

    it('should show draw boundary link', async () => {
      const { document } = await loadPageWithError(
        getServer(),
        'Invalid geometry detected'
      )

      const drawLink = getByRole(document, 'link', {
        name: 'Draw the red line boundary instead'
      })
      expect(drawLink).toHaveAttribute('href', '/quote/boundary-type')
    })

    it('should still render the map container', async () => {
      const { document } = await loadPageWithError(
        getServer(),
        'Invalid geometry detected'
      )

      const mapEl = document.getElementById('boundary-map')
      expect(mapEl).toBeInTheDocument()
    })
  })
})
