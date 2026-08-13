import { getByRole } from '@testing-library/dom'
import { http, HttpResponse } from 'msw'
import { config } from '../../../config/config.js'
import { routePath } from './routes.js'
import { routePath as planningTypePath } from '../planning-type/routes.js'
import { routePath as boundaryTypePath } from '../boundary-type/routes.js'
import { routePath as residentialPath } from '../unit-number/routes.js'
import { routePath as emailRoutePath } from '../email/routes.js'
import { setupTestServer } from '../../../test-utils/setup-test-server.js'
import { setupMswServer } from '../../../test-utils/setup-msw-server.js'
import { loadPage } from '../../../test-utils/load-page.js'
import { submitForm } from '../../../test-utils/submit-form.js'
const backendUrl = config.get('backend').apiUrl
import { withValidQuoteSession } from '../../../test-utils/with-valid-quote-session.js'

const mswServer = setupMswServer()

describe('Check your answers page', () => {
  const getServer = setupTestServer()
  let sessionCookie

  beforeEach(
    async () => (sessionCookie = await withValidQuoteSession(getServer()))
  )

  it('should render a page heading and submit button', async () => {
    const document = await loadPage({
      requestUrl: routePath,
      server: getServer(),
      cookie: sessionCookie
    })
    expect(document.title).toBe(
      'Check your answers - Nature restoration levy - GOV.UK'
    )
    expect(getByRole(document, 'heading', { level: 1 })).toHaveTextContent(
      'Check your answers'
    )
    expect(
      getByRole(document, 'button', { name: 'Confirm and submit' })
    ).toBeInTheDocument()
    expect(
      document.querySelector('form[data-disable-on-submit]')
    ).toBeInTheDocument()
    expect(getByRole(document, 'link', { name: 'Delete' })).toHaveAttribute(
      'href',
      '/quote/delete-quote'
    )
  })

  it('should show a summary list', async () => {
    const document = await loadPage({
      requestUrl: routePath,
      server: getServer(),
      cookie: sessionCookie
    })
    const summaryList = document.querySelector('.govuk-summary-list')
    expect(summaryList).toBeInTheDocument()
  })

  it('should show all summary rows when a full session is built up', async () => {
    let cookie = sessionCookie
    ;({ cookie } = await submitForm({
      requestUrl: '/quote/planning-type',
      server: getServer(),
      formData: { planningType: 'full-planning-permission' },
      cookie
    }))
    ;({ cookie } = await submitForm({
      requestUrl: boundaryTypePath,
      server: getServer(),
      formData: { boundaryEntryType: 'upload' },
      cookie
    }))
    ;({ cookie } = await submitForm({
      requestUrl: residentialPath,
      server: getServer(),
      formData: { housingUnits: '42' },
      cookie
    }))
    ;({ cookie } = await submitForm({
      requestUrl: emailRoutePath,
      server: getServer(),
      formData: { email: 'test@example.com' },
      cookie
    }))

    const document = await loadPage({
      requestUrl: routePath,
      server: getServer(),
      cookie
    })
    const summaryList = document.querySelector('.govuk-summary-list')
    expect(summaryList).toHaveTextContent('Planning application type')
    expect(summaryList).toHaveTextContent('Full planning permission')
    expect(summaryList).toHaveTextContent('Housing')
    expect(summaryList).toHaveTextContent('Red line boundary')
    expect(summaryList).toHaveTextContent('Uploaded')
    expect(summaryList).toHaveTextContent('Number of units')
    expect(summaryList).toHaveTextContent('42')
    expect(summaryList).toHaveTextContent('Email address')
    expect(summaryList).toHaveTextContent('test@example.com')

    expect(
      getByRole(document, 'link', {
        name: 'Changeplanning application type'
      })
    ).toHaveAttribute('href', `${planningTypePath}?change=true`)
    expect(
      getByRole(document, 'link', {
        name: 'Changeuploaded red line boundary'
      })
    ).toHaveAttribute('href', '/quote/file-preview?change=true')
    expect(
      getByRole(document, 'link', { name: 'Changenumber of units' })
    ).toHaveAttribute('href', '/quote/unit-number?change=true')
    expect(
      getByRole(document, 'link', { name: 'Changeemail address' })
    ).toHaveAttribute('href', '/quote/email?change=true')
  })

  it('should list rows in order: planning type, housing, number of units, then the boundary answer', async () => {
    let cookie = sessionCookie
    ;({ cookie } = await submitForm({
      requestUrl: '/quote/planning-type',
      server: getServer(),
      formData: { planningType: 'full-planning-permission' },
      cookie
    }))
    ;({ cookie } = await submitForm({
      requestUrl: boundaryTypePath,
      server: getServer(),
      formData: { boundaryEntryType: 'upload' },
      cookie
    }))
    ;({ cookie } = await submitForm({
      requestUrl: residentialPath,
      server: getServer(),
      formData: { housingUnits: '42' },
      cookie
    }))

    const document = await loadPage({
      requestUrl: routePath,
      server: getServer(),
      cookie
    })
    const keys = Array.from(
      document.querySelectorAll('.govuk-summary-list__key')
    ).map((key) => key.textContent.trim())

    expect(keys).toEqual([
      'Planning application type',
      'Housing',
      'Number of units',
      'Red line boundary'
    ])
  })

  it('should show a static "Yes" value for the Housing row', async () => {
    const document = await loadPage({
      requestUrl: routePath,
      server: getServer(),
      cookie: sessionCookie
    })
    const rows = Array.from(
      document.querySelectorAll('.govuk-summary-list__row')
    )
    const housingRow = rows.find((row) =>
      row
        .querySelector('.govuk-summary-list__key')
        .textContent.includes('Housing')
    )
    expect(
      housingRow.querySelector('.govuk-summary-list__value')
    ).toHaveTextContent('Yes')
  })

  it('should link to the map page if the boundary was drawn', async () => {
    const { cookie: updatedCookie } = await submitForm({
      requestUrl: boundaryTypePath,
      server: getServer(),
      formData: { boundaryEntryType: 'draw' },
      cookie: sessionCookie
    })
    const document = await loadPage({
      requestUrl: routePath,
      server: getServer(),
      cookie: updatedCookie
    })
    const summaryList = document.querySelector('.govuk-summary-list')
    expect(summaryList).toHaveTextContent('Red line boundary')
    expect(summaryList).toHaveTextContent('Added')
    expect(
      getByRole(document, 'link', {
        name: 'Changedrawn red line boundary'
      })
    ).toHaveAttribute('href', '/quote/draw-boundary?change=true')
  })

  it('should show the uploaded filename when present', async () => {
    const uploadId = 'test-upload-id'
    mswServer.use(
      http.post(`${backendUrl}/boundary/check/${uploadId}`, () =>
        HttpResponse.json({
          boundaryGeometryWgs84: { type: 'Polygon', coordinates: [] },
          boundaryGeometryOriginal: { type: 'Polygon', coordinates: [] },
          boundaryMetadata: {},
          intersectingEdps: [],
          boundaryFilename: 'site-boundary.geojson'
        })
      )
    )

    let cookie = sessionCookie
    ;({ cookie } = await submitForm({
      requestUrl: boundaryTypePath,
      server: getServer(),
      formData: { boundaryEntryType: 'upload' },
      cookie
    }))

    const checkResponse = await getServer().inject({
      method: 'POST',
      url: `/quote/check-boundary/${uploadId}`,
      headers: { cookie }
    })
    cookie = checkResponse.headers['set-cookie']
      ? [].concat(checkResponse.headers['set-cookie']).join('; ')
      : cookie

    const previewResponse = await getServer().inject({
      method: 'POST',
      url: '/quote/file-preview',
      headers: { cookie }
    })
    cookie = previewResponse.headers['set-cookie']
      ? [].concat(previewResponse.headers['set-cookie']).join('; ')
      : cookie

    const document = await loadPage({
      requestUrl: routePath,
      server: getServer(),
      cookie
    })
    const summaryList = document.querySelector('.govuk-summary-list')
    expect(summaryList).toHaveTextContent('site-boundary.geojson')
  })

  it('should set a no-store Cache-Control header so the page cannot be shown from cache', async () => {
    const response = await getServer().inject({
      method: 'GET',
      url: routePath,
      headers: { cookie: sessionCookie }
    })
    expect(response.headers['cache-control']).toBe(
      'no-store, no-cache, must-revalidate, max-age=0'
    )
  })

  it('should redirect to the confirmation page if Submit is clicked', async () => {
    const { cookie: updatedCookie } = await submitForm({
      requestUrl: emailRoutePath,
      server: getServer(),
      formData: { email: 'deidre@developers.org' },
      cookie: sessionCookie
    })
    mswServer.use(
      http.post(`${backendUrl}/quotes`, () =>
        HttpResponse.json({ reference: 'NRF-123456' })
      )
    )
    const { response } = await submitForm({
      requestUrl: routePath,
      server: getServer(),
      formData: {},
      cookie: updatedCookie
    })
    expect(response.statusCode).toBe(303)
    expect(response.headers.location).toBe(
      '/quote/confirmation?reference=NRF-123456'
    )
  })
})
