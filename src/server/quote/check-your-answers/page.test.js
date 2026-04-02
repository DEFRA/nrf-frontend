import { getByRole } from '@testing-library/dom'
import { http, HttpResponse } from 'msw'
import { config } from '../../../config/config.js'
import { routePath } from './routes.js'
import { routePath as boundaryTypePath } from '../boundary-type/routes.js'
import { routePath as developmentTypesPath } from '../development-types/routes.js'
import { routePath as residentialPath } from '../residential/routes.js'
import { routePath as peopleCountPath } from '../people-count/routes.js'
import { routePath as wasteWaterPath } from '../waste-water/routes.js'
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
      'Check your answers - Nature Restoration Fund - Gov.uk'
    )
    expect(getByRole(document, 'heading', { level: 1 })).toHaveTextContent(
      'Check your answers'
    )
    expect(
      getByRole(document, 'button', { name: 'Submit' })
    ).toBeInTheDocument()
    expect(getByRole(document, 'button', { name: 'Delete' })).toHaveAttribute(
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
      requestUrl: boundaryTypePath,
      server: getServer(),
      formData: { boundaryEntryType: 'upload' },
      cookie
    }))
    ;({ cookie } = await submitForm({
      requestUrl: developmentTypesPath,
      server: getServer(),
      formData: { developmentTypes: 'housing' },
      cookie
    }))
    ;({ cookie } = await submitForm({
      requestUrl: residentialPath,
      server: getServer(),
      formData: { residentialBuildingCount: '42' },
      cookie
    }))
    ;({ cookie } = await submitForm({
      requestUrl: peopleCountPath,
      server: getServer(),
      formData: { peopleCount: '100' },
      cookie
    }))
    ;({ cookie } = await submitForm({
      requestUrl: wasteWaterPath,
      server: getServer(),
      formData: { wasteWaterTreatmentWorks: 'i-dont-know' },
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
    expect(summaryList).toHaveTextContent('Red line boundary')
    expect(summaryList).toHaveTextContent('Uploaded')
    expect(summaryList).toHaveTextContent('Development types')
    expect(summaryList).toHaveTextContent('Housing')
    expect(summaryList).toHaveTextContent('Number of residential units')
    expect(summaryList).toHaveTextContent('42')
    expect(summaryList).toHaveTextContent('Maximum number of people')
    expect(summaryList).toHaveTextContent('100')
    expect(summaryList).toHaveTextContent('Waste water treatment works')
    expect(summaryList).toHaveTextContent("I don't know yet")
    expect(summaryList).toHaveTextContent('Email address')
    expect(summaryList).toHaveTextContent('test@example.com')

    expect(
      getByRole(document, 'link', {
        name: 'Changered line boundary'
      })
    ).toHaveAttribute('href', '/quote/upload-boundary')
    expect(
      getByRole(document, 'link', { name: 'Changedevelopment types' })
    ).toHaveAttribute('href', '/quote/development-types')
    expect(
      getByRole(document, 'link', { name: 'Changenumber of residential units' })
    ).toHaveAttribute('href', '/quote/residential')
    expect(
      getByRole(document, 'link', { name: 'Changemaximum number of people' })
    ).toHaveAttribute('href', '/quote/people-count')
    expect(
      getByRole(document, 'link', { name: 'Changewaste water treatment works' })
    ).toHaveAttribute('href', '/quote/waste-water')
    expect(
      getByRole(document, 'link', { name: 'Changeemail address' })
    ).toHaveAttribute('href', '/quote/email')
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
    expect(summaryList).toHaveTextContent('Drawn')
    expect(
      getByRole(document, 'link', {
        name: 'Changered line boundary'
      })
    ).toHaveAttribute('href', '/quote/upload-preview-map')
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
