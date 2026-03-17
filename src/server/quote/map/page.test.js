import { JSDOM } from 'jsdom'
import { getByRole, queryByLabelText } from '@testing-library/dom'
import { routePath } from './routes.js'
import { setupTestServer } from '../../../test-utils/setup-test-server.js'
import { submitForm } from '../../../test-utils/submit-form.js'
import { withValidQuoteSession } from '../../../test-utils/with-valid-quote-session.js'
import { checkBoundary } from '../../common/services/boundary.js'
import { checkBoundaryPath } from '../upload-received/routes.js'

vi.mock('../../common/services/boundary.js')

const mockGeojson = {
  geometry: {
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
  intersecting_edps: [],
  intersects_edp: false
}

const mockEdpGeojson = {
  geometry: {
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
  intersecting_edps: [
    { label: 'Kent Downs EDP', n2k_site_name: 'North Downs Woodlands' }
  ],
  intersects_edp: true
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
      expect(queryByLabelText(document, 'Yes, continue')).toBeNull()
      expect(
        queryByLabelText(document, 'No, upload a different file')
      ).toBeNull()
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

  it('should redirect to upload-boundary when no geojson in session', async () => {
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

    it('should show disabled edit button', async () => {
      const { document } = await loadPageWithSession(
        getServer(),
        mockEdpGeojson
      )

      const editButton = getByRole(document, 'button', { name: 'Edit' })
      expect(editButton).toBeDisabled()
    })

    it('should not show the boundary correct radio buttons', async () => {
      const { document } = await loadPageWithSession(
        getServer(),
        mockEdpGeojson
      )

      expect(queryByLabelText(document, 'Yes, continue')).toBeNull()
      expect(
        queryByLabelText(document, 'No, upload a different file')
      ).toBeNull()
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
})
