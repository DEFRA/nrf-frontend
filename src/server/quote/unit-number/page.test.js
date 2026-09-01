import { getByRole, getByLabelText } from '@testing-library/dom'
import { routePath } from './routes.js'
import { routePath as checkYourAnswersPath } from '../check-your-answers/routes.js'
import { statusCodes } from '../../common/constants/status-codes.js'

import { setupTestServer } from '../../../test-utils/setup-test-server.js'
import { loadPage } from '../../../test-utils/load-page.js'
import { submitForm } from '../../../test-utils/submit-form.js'
import { expectInputError } from '../../../test-utils/assertions.js'
import { withValidQuoteSession } from '../../../test-utils/with-valid-quote-session.js'

describe('Residential page', () => {
  const getServer = setupTestServer()
  const inputLabel = 'Enter the maximum number of units you are developing'
  const changeUrl = `${routePath}?change=true`
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
      inputLabel
    )
    expect(document.title).toBe(
      'Number of units - Nature restoration levy - GOV.UK'
    )
    expect(getByRole(document, 'link', { name: 'Back' })).toHaveAttribute(
      'href',
      '/quote/confirm-housing'
    )
    expect(getByLabelText(document, inputLabel)).toHaveValue('')
    const csrfToken = document.querySelector('form input[name="csrfToken"]')
    expect(csrfToken).toBeInTheDocument()
  })

  it('should link back to check-your-answers when loaded with change=true', async () => {
    const document = await loadPage({
      requestUrl: changeUrl,
      server: getServer(),
      cookie: sessionCookie
    })
    expect(getByRole(document, 'link', { name: 'Back' })).toHaveAttribute(
      'href',
      checkYourAnswersPath
    )
  })

  it('should redirect back to check-your-answers when a change is submitted', async () => {
    const { response } = await submitForm({
      requestUrl: changeUrl,
      server: getServer(),
      formData: { housingUnits: '6' },
      cookie: sessionCookie
    })
    expect(response.statusCode).toBe(statusCodes.redirectAfterPost)
    expect(response.headers.location).toBe(checkYourAnswersPath)
  })

  it('should keep change mode when a change submission fails validation', async () => {
    const { response, cookie } = await submitForm({
      requestUrl: changeUrl,
      server: getServer(),
      formData: {},
      cookie: sessionCookie
    })
    expect(response.statusCode).toBe(statusCodes.redirectAfterPost)
    expect(response.headers.location).toBe(changeUrl)
    const document = await loadPage({
      requestUrl: changeUrl,
      server: getServer(),
      cookie
    })
    expectInputError({
      document,
      inputLabel,
      errorMessage: 'Enter the number of housing units'
    })
    expect(getByRole(document, 'link', { name: 'Back' })).toHaveAttribute(
      'href',
      checkYourAnswersPath
    )
  })

  it("should remember the user's previously entered value", async () => {
    const { cookie: updatedCookie } = await submitForm({
      requestUrl: routePath,
      server: getServer(),
      formData: { housingUnits: '25' },
      cookie: sessionCookie
    })
    const document = await loadPage({
      requestUrl: routePath,
      server: getServer(),
      cookie: updatedCookie
    })
    expect(getByLabelText(document, inputLabel)).toHaveValue('25')
  })

  it('should show a validation error, after an invalid form submission', async () => {
    const { response, cookie: updatedCookie } = await submitForm({
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
      cookie: updatedCookie
    })
    expectInputError({
      document,
      inputLabel,
      errorMessage: 'Enter the number of housing units'
    })
  })

  it('should redirect to the next page', async () => {
    const { response } = await submitForm({
      requestUrl: routePath,
      server: getServer(),
      formData: { housingUnits: '6' },
      cookie: sessionCookie
    })
    expect(response.statusCode).toBe(303)
    expect(response.headers.location).toBe('/quote/boundary-type')
  })
})
