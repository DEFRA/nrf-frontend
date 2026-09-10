import { JSDOM } from 'jsdom'
import { getByRole } from '@testing-library/dom'
import { http, HttpResponse } from 'msw'
import { config } from '../../../config/config.js'
import { routePath } from './routes.js'
import { routePath as planningTypePath } from '../planning-type/routes.js'
import { routePath as boundaryTypePath } from '../boundary-type/routes.js'
import { setupTestServer } from '../../../test-utils/setup-test-server.js'
import { setupMswServer } from '../../../test-utils/setup-msw-server.js'
import { loadPage } from '../../../test-utils/load-page.js'
import { submitForm } from '../../../test-utils/submit-form.js'
const backendUrl = config.get('backend').apiUrl
import { withValidQuoteSession } from '../../../test-utils/with-valid-quote-session.js'
import { withCompleteQuoteSession } from '../../../test-utils/with-complete-quote-session.js'

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
      cookie: await withCompleteQuoteSession(getServer())
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
      cookie: await withCompleteQuoteSession(getServer())
    })
    const summaryList = document.querySelector('.govuk-summary-list')
    expect(summaryList).toBeInTheDocument()
  })

  it('should show a 400 error page when required questions are unanswered', async () => {
    const response = await getServer().inject({
      method: 'GET',
      url: routePath,
      headers: { cookie: sessionCookie }
    })
    expect(response.statusCode).toBe(400)
    const { document } = new JSDOM(response.result).window
    expect(getByRole(document, 'heading', { level: 1 })).toHaveTextContent(
      'Your details are incomplete'
    )
  })

  it('should not submit an incomplete quote to the backend', async () => {
    const response = await getServer().inject({
      method: 'POST',
      url: routePath,
      headers: { cookie: sessionCookie }
    })
    // No /quotes handler is registered with MSW (unhandled requests error),
    // so a 400 — not a 500 — proves the backend was never called.
    expect(response.statusCode).toBe(400)
  })

  it('should show all summary rows when the journey is complete', async () => {
    const document = await loadPage({
      requestUrl: routePath,
      server: getServer(),
      cookie: await withCompleteQuoteSession(getServer())
    })
    const summaryList = document.querySelector('.govuk-summary-list')
    expect(summaryList).toHaveTextContent('Planning application type')
    expect(summaryList).toHaveTextContent('Full planning permission')
    expect(summaryList).toHaveTextContent('Housing')
    expect(summaryList).toHaveTextContent('Red line boundary')
    expect(summaryList).toHaveTextContent('Added')
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
        name: 'Changedrawn red line boundary'
      })
    ).toHaveAttribute('href', '/quote/draw-boundary?change=true')
    expect(
      getByRole(document, 'link', { name: 'Changenumber of units' })
    ).toHaveAttribute('href', '/quote/unit-number?change=true')
    expect(
      getByRole(document, 'link', { name: 'Changeemail address' })
    ).toHaveAttribute('href', '/quote/email?change=true')
  })

  it('should list rows in order: planning type, housing, number of units, boundary answer, then email', async () => {
    const document = await loadPage({
      requestUrl: routePath,
      server: getServer(),
      cookie: await withCompleteQuoteSession(getServer())
    })
    const keys = Array.from(
      document.querySelectorAll('.govuk-summary-list__key')
    ).map((key) => key.textContent.trim())

    expect(keys).toEqual([
      'Planning application type',
      'Housing',
      'Number of units',
      'Red line boundary',
      'Email address'
    ])
  })

  it('should show a static "Yes" value for the Housing row', async () => {
    const document = await loadPage({
      requestUrl: routePath,
      server: getServer(),
      cookie: await withCompleteQuoteSession(getServer())
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
    const document = await loadPage({
      requestUrl: routePath,
      server: getServer(),
      cookie: await withCompleteQuoteSession(getServer())
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
          intersectingEdps: [{ label: 'Kent Downs EDP' }],
          boundaryFilename: 'site-boundary.geojson'
        })
      )
    )

    let cookie = await withCompleteQuoteSession(getServer())
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
      headers: { cookie: await withCompleteQuoteSession(getServer()) }
    })
    expect(response.headers['cache-control']).toBe(
      'no-store, no-cache, must-revalidate, max-age=0'
    )
  })

  it('should redirect to the confirmation page if Submit is clicked', async () => {
    mswServer.use(
      http.post(`${backendUrl}/quotes`, () =>
        HttpResponse.json({ reference: 'NRF-123456' })
      )
    )
    const { response } = await submitForm({
      requestUrl: routePath,
      server: getServer(),
      formData: {},
      cookie: await withCompleteQuoteSession(getServer())
    })
    expect(response.statusCode).toBe(303)
    expect(response.headers.location).toBe(
      '/quote/confirmation?reference=NRF-123456'
    )
  })
})
