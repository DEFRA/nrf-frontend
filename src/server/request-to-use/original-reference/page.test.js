import { getByRole, getByLabelText } from '@testing-library/dom'
import { routePath } from './routes.js'
import getViewModel from './get-view-model.js'
import { routePath as originalCommittedPath } from '../original-committed/route-path.js'
import { routePath as defraAccountUserTypePath } from '../defra-account-user-type/route-path.js'
import { statusCodes } from '../../common/constants/status-codes.js'
import { setupTestServer } from '../../../test-utils/setup-test-server.js'
import { setupSeededRequestToUseServer } from '../../../test-utils/setup-seeded-request-to-use-server.js'
import { getResponse } from '../../../test-utils/get-response.js'
import { loadPage } from '../../../test-utils/load-page.js'
import { submitForm } from '../../../test-utils/submit-form.js'
import { withCompleteQuoteSession } from '../../../test-utils/with-complete-quote-session.js'
import { expectInputError } from '../../../test-utils/assertions.js'
import { routePath as startPath } from '../../manage/start-page/route-path.js'
import { setupMswServer } from '../../../test-utils/setup-msw-server.js'
import { mockCompareBoundaries } from '../../../test-utils/mock-get-quote.js'
import { boundaryGeojsonWithEdp } from '../../../test-utils/fixtures/boundary-geojson.js'
import { withValidQuoteSession } from '../../../test-utils/with-valid-quote-session.js'

const inputLabel =
  'Enter the NRL reference for the original planning permission'
const missingMessage =
  'Enter the NRL reference for the original planning permission'
const formatMessage =
  'Enter an NRL reference in the correct format, like NRL-123456'

describe('Enter the NRL reference for the original planning permission page', () => {
  const getServer = setupSeededRequestToUseServer()
  const mswServer = setupMswServer()
  let sessionCookie
  let compareRequests

  beforeEach(async () => {
    compareRequests = mockCompareBoundaries(mswServer)
    sessionCookie = await withCompleteQuoteSession(getServer())
  })

  const loadForm = (cookie = sessionCookie) =>
    loadPage({ requestUrl: routePath, server: getServer(), cookie })

  it('should render all page elements', async () => {
    const document = await loadForm()
    const { pageTitle, pageHeading } = getViewModel()
    expect(document.title).toBe(pageTitle)
    expect(getByRole(document, 'heading', { level: 1 })).toHaveTextContent(
      pageHeading
    )
    const input = getByLabelText(document, inputLabel)
    expect(input).toHaveValue('')
    expect(input).toHaveClass('govuk-input--width-10')
    expect(input).toHaveAccessibleDescription(
      'This is the NRL reference on the commitment certificate used for the original planning permission, for example NRL-123456.'
    )
    expect(getByRole(document, 'button', { name: 'Continue' })).toBeVisible()
  })

  it('should link back to the was the original planning permission committed page', async () => {
    const document = await loadForm()
    expect(getByRole(document, 'link', { name: 'Back' })).toHaveAttribute(
      'href',
      originalCommittedPath
    )
  })

  it('should contain a CSRF token in the form', async () => {
    const document = await loadForm()
    const csrfToken = document.querySelector('form input[name="csrfToken"]')
    expect(csrfToken).toBeInTheDocument()
  })

  it.each([
    { scenario: 'a valid reference', value: 'NRL-123456' },
    { scenario: 'a lowercase reference', value: 'nrl-123456' },
    { scenario: 'a reference with whitespace', value: '  NRL-123456  ' }
  ])('should redirect to the next page for $scenario', async ({ value }) => {
    const { response } = await submitForm({
      requestUrl: routePath,
      server: getServer(),
      formData: { originalReference: value },
      cookie: sessionCookie
    })
    expect(response.statusCode).toBe(statusCodes.redirectAfterPost)
    expect(response.headers.location).toBe(defraAccountUserTypePath)
  })

  it('should send the original reference and the session boundary to the backend', async () => {
    await submitForm({
      requestUrl: routePath,
      server: getServer(),
      formData: { originalReference: 'nrl-123456' },
      cookie: sessionCookie
    })
    expect(compareRequests).toEqual([
      {
        originalReference: 'NRL-123456',
        currentBoundaryGeoJson: boundaryGeojsonWithEdp.boundaryGeometryWgs84
      }
    ])
  })

  it('should redirect to the start page without calling the backend when the session has no boundary', async () => {
    const { response } = await submitForm({
      requestUrl: routePath,
      server: getServer(),
      formData: { originalReference: 'NRL-123456' },
      cookie: await withValidQuoteSession(getServer())
    })
    expect(response.statusCode).toBe(303)
    expect(response.headers.location).toBe('/manage/start-page')
    expect(compareRequests).toEqual([])
  })

  it('should redirect to the original reference not matched page when the original quote is not found', async () => {
    mockCompareBoundaries(mswServer, { status: statusCodes.notFound })
    const { response } = await submitForm({
      requestUrl: routePath,
      server: getServer(),
      formData: { originalReference: 'NRL-123456' },
      cookie: sessionCookie
    })
    expect(response.statusCode).toBe(303)
    expect(response.headers.location).toBe(
      '/request-to-use/original-reference-not-matched'
    )
  })

  it('should redirect to the original boundary not matched page when the boundaries differ', async () => {
    mockCompareBoundaries(mswServer, { boundariesMatch: false })
    const { response } = await submitForm({
      requestUrl: routePath,
      server: getServer(),
      formData: { originalReference: 'NRL-123456' },
      cookie: sessionCookie
    })
    expect(response.statusCode).toBe(303)
    expect(response.headers.location).toBe(
      '/request-to-use/original-boundary-not-matched'
    )
  })

  it('should show the error page when the backend request fails', async () => {
    mockCompareBoundaries(mswServer, { status: statusCodes.badGateway })
    const { response } = await submitForm({
      requestUrl: routePath,
      server: getServer(),
      formData: { originalReference: 'NRL-123456' },
      cookie: sessionCookie
    })
    expect(response.statusCode).toBe(502)
  })

  it('should not call the backend when validation fails', async () => {
    await submitForm({
      requestUrl: routePath,
      server: getServer(),
      formData: { originalReference: 'ABC-123' },
      cookie: sessionCookie
    })
    expect(compareRequests).toEqual([])
  })

  it('should show the saved reference when returning to the page', async () => {
    const { cookie } = await submitForm({
      requestUrl: routePath,
      server: getServer(),
      formData: { originalReference: 'nrl-123456' },
      cookie: sessionCookie
    })

    const document = await loadForm(cookie)
    expect(getByLabelText(document, inputLabel)).toHaveValue('NRL-123456')
  })

  it.each([
    { scenario: 'is absent', formData: {}, errorMessage: missingMessage },
    {
      scenario: 'is in the wrong format',
      formData: { originalReference: 'ABC-123' },
      errorMessage: formatMessage
    }
  ])(
    'should redirect back with a validation error when the reference $scenario',
    async ({ formData, errorMessage }) => {
      const { response, cookie } = await submitForm({
        requestUrl: routePath,
        server: getServer(),
        formData,
        cookie: sessionCookie
      })
      expect(response.statusCode).toBe(statusCodes.redirectAfterPost)
      expect(response.headers.location).toBe(routePath)
      const document = await loadPage({
        requestUrl: routePath,
        server: getServer(),
        cookie
      })
      expectInputError({ document, inputLabel, errorMessage })
      expect(document.title).toBe(`Error: ${getViewModel().pageTitle}`)
    }
  )

  it('should show the invalid value as typed after a format error', async () => {
    const { cookie } = await submitForm({
      requestUrl: routePath,
      server: getServer(),
      formData: { originalReference: 'ABC-123' },
      cookie: sessionCookie
    })
    const document = await loadPage({
      requestUrl: routePath,
      server: getServer(),
      cookie
    })
    expect(getByLabelText(document, inputLabel)).toHaveValue('ABC-123')
  })
})

describe('Enter the NRL reference for the original planning permission page without a session', () => {
  const getServer = setupTestServer()

  it('should redirect to the start page when there is no session', async () => {
    const response = await getResponse({
      server: getServer(),
      requestUrl: routePath
    })

    expect(response.statusCode).toBe(statusCodes.found)
    expect(response.headers.location).toBe(startPath)
  })
})
