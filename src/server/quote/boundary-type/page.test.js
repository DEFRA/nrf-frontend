import { getByRole, getByLabelText } from '@testing-library/dom'
import { routePath } from './routes.js'
import { routePath as checkYourAnswersPath } from '../check-your-answers/route-path.js'
import { routePath as drawBoundaryPath } from '../draw-boundary/route-path.js'
import { routePath as uploadBoundaryPath } from '../upload-boundary/route-path.js'
import { routePath as housingUnitsPath } from '../unit-number/route-path.js'
import { statusCodes } from '../../common/constants/status-codes.js'
import { setupTestServer } from '../../../test-utils/setup-test-server.js'
import { loadPage } from '../../../test-utils/load-page.js'
import { submitForm } from '../../../test-utils/submit-form.js'
import { expectFieldsetError } from '../../../test-utils/assertions.js'
import { withValidQuoteSession } from '../../../test-utils/with-valid-quote-session.js'
import { withCompleteQuoteSession } from '../../../test-utils/with-complete-quote-session.js'

describe('Boundary type page', () => {
  const getServer = setupTestServer()
  let sessionCookie

  beforeEach(
    async () => (sessionCookie = await withValidQuoteSession(getServer()))
  )

  it('should render all page elements', async () => {
    const document = await loadPage({
      requestUrl: routePath,
      server: getServer(),
      cookie: sessionCookie
    })
    expect(getByRole(document, 'heading', { level: 1 })).toHaveTextContent(
      'Choose how you would like to show us the boundary of your development'
    )
    expect(document.title).toBe(
      'Boundary type - Nature restoration levy - GOV.UK'
    )
    expect(getByRole(document, 'link', { name: 'Back' })).toHaveAttribute(
      'href',
      '/quote/unit-number'
    )
    expect(getByLabelText(document, 'Draw on a map')).not.toBeChecked()
    expect(getByLabelText(document, 'Upload a file')).not.toBeChecked()
    const csrfToken = document.querySelector('form input[name="csrfToken"]')
    expect(csrfToken).toBeInTheDocument()
  })

  it("should remember the user's previous selection", async () => {
    const { cookie } = await submitForm({
      requestUrl: routePath,
      server: getServer(),
      formData: { boundaryEntryType: 'draw' },
      cookie: sessionCookie
    })
    const document = await loadPage({
      requestUrl: routePath,
      server: getServer(),
      cookie
    })
    expect(getByLabelText(document, 'Draw on a map')).toBeChecked()
    expect(getByLabelText(document, 'Upload a file')).not.toBeChecked()
  })

  it('should show a validation error, after an invalid form submission', async () => {
    const { response, cookie } = await submitForm({
      requestUrl: routePath,
      server: getServer(),
      formData: {},
      cookie: sessionCookie
    })
    expect(response.statusCode).toBe(303)
    expect(response.headers.location).toBe(routePath)
    const document = await loadPage({
      requestUrl: routePath,
      server: getServer(),
      cookie
    })
    expectFieldsetError({
      document,
      errorMessage: 'Select how you would like to show your red line boundary'
    })
  })

  it('should redirect to the next page', async () => {
    const { response } = await submitForm({
      requestUrl: routePath,
      server: getServer(),
      formData: { boundaryEntryType: 'draw' },
      cookie: sessionCookie
    })
    expect(response.statusCode).toBe(303)
    expect(response.headers.location).toBe('/quote/draw-boundary')
  })

  it('should redirect to the upload boundary page if upload is selected', async () => {
    const { response } = await submitForm({
      requestUrl: routePath,
      server: getServer(),
      formData: { boundaryEntryType: 'upload' },
      cookie: sessionCookie
    })
    expect(response.statusCode).toBe(303)
    expect(response.headers.location).toBe('/quote/upload-boundary')
  })

  it('should link back to check-your-answers when loaded with change=true', async () => {
    const document = await loadPage({
      requestUrl: `${routePath}?change=true`,
      server: getServer(),
      cookie: await withCompleteQuoteSession(getServer())
    })
    expect(getByRole(document, 'link', { name: 'Back' })).toHaveAttribute(
      'href',
      checkYourAnswersPath
    )
  })

  it('should continue to the map page without change=true when a change keeps Draw', async () => {
    const { response } = await submitForm({
      requestUrl: `${routePath}?change=true`,
      server: getServer(),
      formData: { boundaryEntryType: 'draw' },
      cookie: await withCompleteQuoteSession(getServer())
    })
    expect(response.statusCode).toBe(statusCodes.redirectAfterPost)
    expect(response.headers.location).toBe(drawBoundaryPath)
  })

  it('should continue to the upload page without change=true when a change selects Upload', async () => {
    const { response } = await submitForm({
      requestUrl: `${routePath}?change=true`,
      server: getServer(),
      formData: { boundaryEntryType: 'upload' },
      cookie: await withCompleteQuoteSession(getServer())
    })
    expect(response.statusCode).toBe(statusCodes.redirectAfterPost)
    expect(response.headers.location).toBe(uploadBoundaryPath)
  })

  it('should fall back to the unit-number back link when a type change has cleared the boundary', async () => {
    const { cookie } = await submitForm({
      requestUrl: `${routePath}?change=true`,
      server: getServer(),
      formData: { boundaryEntryType: 'upload' },
      cookie: await withCompleteQuoteSession(getServer())
    })
    const document = await loadPage({
      requestUrl: `${routePath}?change=true`,
      server: getServer(),
      cookie
    })
    expect(getByRole(document, 'link', { name: 'Back' })).toHaveAttribute(
      'href',
      housingUnitsPath
    )
  })

  it('should keep change mode when a change submission fails validation', async () => {
    const { response, cookie } = await submitForm({
      requestUrl: `${routePath}?change=true`,
      server: getServer(),
      formData: {},
      cookie: await withCompleteQuoteSession(getServer())
    })
    expect(response.statusCode).toBe(statusCodes.redirectAfterPost)
    expect(response.headers.location).toBe(`${routePath}?change=true`)
    const document = await loadPage({
      requestUrl: `${routePath}?change=true`,
      server: getServer(),
      cookie
    })
    expectFieldsetError({
      document,
      errorMessage: 'Select how you would like to show your red line boundary'
    })
    expect(getByRole(document, 'link', { name: 'Back' })).toHaveAttribute(
      'href',
      checkYourAnswersPath
    )
  })
})
