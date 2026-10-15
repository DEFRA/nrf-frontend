import { getByRole, getByLabelText, queryByRole } from '@testing-library/dom'
import { routePath } from './routes.js'
import getViewModel from './get-view-model.js'
import { routePath as haveNrlReferencePath } from '../have-nrl-reference/route-path.js'
import { routePath as enterEmailPath } from '../enter-email/route-path.js'
import { statusCodes } from '../../common/constants/status-codes.js'
import { setupTestServer } from '../../../test-utils/setup-test-server.js'
import { loadPage } from '../../../test-utils/load-page.js'
import { submitForm } from '../../../test-utils/submit-form.js'
import { withValidRetrieveQuoteSession } from '../../../test-utils/with-valid-retrieve-quote-session.js'
import { expectInputError } from '../../../test-utils/assertions.js'
import { fullQuote } from '../../../test-utils/fixtures/quote.js'
import { getResponse } from '../../../test-utils/get-response.js'
import { mergeCookies } from '../../../test-utils/merge-cookies.js'
import { routePath as startPath } from '../../manage/start-page/route-path.js'

const inputLabel = 'Enter your NRL reference'
const missingMessage = 'Enter your NRL reference'
const formatMessage =
  'Enter a NRL reference in the correct format, like NRL-123456'
const validReference = fullQuote.reference
const invalidReference = 'not-a-reference'

const urlWithReference = (value) =>
  `${routePath}?nrlReference=${encodeURIComponent(value)}`

describe('Enter your NRL reference page', () => {
  const getServer = setupTestServer()
  let sessionCookie

  beforeEach(async () => {
    sessionCookie = await withValidRetrieveQuoteSession(getServer())
  })

  const loadForm = (requestUrl = routePath) =>
    loadPage({ requestUrl, server: getServer(), cookie: sessionCookie })

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
      'Enter the reference to retrieve the details entered during the quote, for example NRL-123456.'
    )
    expect(getByRole(document, 'button', { name: 'Continue' })).toBeVisible()
  })

  it('should link back to the have an NRL reference page', async () => {
    const document = await loadForm()
    expect(getByRole(document, 'link', { name: 'Back' })).toHaveAttribute(
      'href',
      haveNrlReferencePath
    )
  })

  it.each([
    { scenario: 'a valid reference', query: validReference },
    { scenario: 'an invalid reference', query: invalidReference }
  ])(
    'should not show a back link when arriving from the quote email with $scenario',
    async ({ query }) => {
      const document = await loadForm(urlWithReference(query))
      expect(
        queryByRole(document, 'link', { name: 'Back' })
      ).not.toBeInTheDocument()
    }
  )

  it('should not show a back link after a validation error on an email arrival', async () => {
    const requestUrl = urlWithReference(validReference)
    const { cookie } = await submitForm({
      requestUrl,
      server: getServer(),
      formData: { nrlReference: '' }
    })
    const document = await loadPage({
      requestUrl,
      server: getServer(),
      cookie
    })
    expect(
      queryByRole(document, 'link', { name: 'Back' })
    ).not.toBeInTheDocument()
  })

  it('should not have a Cancel link', async () => {
    const document = await loadForm()
    expect(
      queryByRole(document, 'link', { name: 'Cancel' })
    ).not.toBeInTheDocument()
  })

  it('should contain a CSRF token in the form', async () => {
    const document = await loadForm()
    const csrfToken = document.querySelector('form input[name="csrfToken"]')
    expect(csrfToken).toBeInTheDocument()
  })

  describe('pre-filling from the nrlReference query parameter', () => {
    it.each([
      { scenario: 'is valid', query: validReference },
      { scenario: 'is lowercase', query: validReference.toLowerCase() },
      { scenario: 'has surrounding whitespace', query: ` ${validReference} ` }
    ])(
      'should pre-fill the input when the reference $scenario',
      async ({ query }) => {
        const document = await loadForm(urlWithReference(query))
        expect(getByLabelText(document, inputLabel)).toHaveValue(validReference)
      }
    )

    it.each([
      { scenario: 'is malformed', query: invalidReference },
      { scenario: 'has too few digits', query: 'NRL-12345' },
      { scenario: 'is empty', query: '' }
    ])(
      'should leave the input empty when the reference $scenario',
      async ({ query }) => {
        const document = await loadForm(urlWithReference(query))
        expect(getByLabelText(document, inputLabel)).toHaveValue('')
        expect(queryByRole(document, 'alert')).not.toBeInTheDocument()
      }
    )

    it('should leave the input empty when the parameter is repeated', async () => {
      const document = await loadForm(
        `${urlWithReference(validReference)}&nrlReference=${validReference}`
      )
      expect(getByLabelText(document, inputLabel)).toHaveValue('')
    })

    it('should not restore the pre-fill after the input is cleared and submitted', async () => {
      const requestUrl = urlWithReference(validReference)
      const { response, cookie } = await submitForm({
        requestUrl,
        server: getServer(),
        formData: { nrlReference: '' },
        cookie: sessionCookie
      })
      expect(response.statusCode).toBe(statusCodes.redirectAfterPost)
      expect(response.headers.location).toBe(requestUrl)
      const document = await loadPage({
        requestUrl: response.headers.location,
        server: getServer(),
        cookie
      })
      expect(getByLabelText(document, inputLabel)).toHaveValue('')
      expectInputError({ document, inputLabel, errorMessage: missingMessage })
    })
  })

  it.each([
    { scenario: 'a valid reference', value: validReference },
    { scenario: 'a lowercase reference', value: validReference.toLowerCase() },
    { scenario: 'a reference with whitespace', value: `  ${validReference} ` },
    {
      scenario: 'six digits without the NRL- prefix',
      value: validReference.replace('NRL-', '')
    }
  ])('should redirect to the next page for $scenario', async ({ value }) => {
    const { response } = await submitForm({
      requestUrl: routePath,
      server: getServer(),
      formData: { nrlReference: value },
      cookie: sessionCookie
    })
    expect(response.statusCode).toBe(statusCodes.redirectAfterPost)
    expect(response.headers.location).toBe(enterEmailPath)
  })

  it.each([
    { scenario: 'is absent', formData: {}, errorMessage: missingMessage },
    {
      scenario: 'is empty',
      formData: { nrlReference: '' },
      errorMessage: missingMessage
    },
    {
      scenario: 'is only whitespace',
      formData: { nrlReference: '   ' },
      errorMessage: missingMessage
    },
    {
      scenario: 'is in the wrong format',
      formData: { nrlReference: 'ABC-123' },
      errorMessage: formatMessage
    },
    {
      scenario: 'has too many digits',
      formData: { nrlReference: 'NRL-1234567' },
      errorMessage: formatMessage
    },
    {
      scenario: 'has no hyphen',
      formData: { nrlReference: 'NRL123456' },
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
      formData: { nrlReference: 'ABC-123' },
      cookie: sessionCookie
    })
    const document = await loadPage({
      requestUrl: routePath,
      server: getServer(),
      cookie
    })
    expect(getByLabelText(document, inputLabel)).toHaveValue('ABC-123')
  })

  it('should show the previously entered reference when returning to the page', async () => {
    const { cookie } = await submitForm({
      requestUrl: routePath,
      server: getServer(),
      formData: { nrlReference: validReference },
      cookie: sessionCookie
    })
    const document = await loadPage({
      requestUrl: routePath,
      server: getServer(),
      cookie
    })
    expect(getByLabelText(document, inputLabel)).toHaveValue(validReference)
  })

  it('should show the saved reference in preference to the pre-filled one', async () => {
    const savedReference = 'NRL-654321'
    const { cookie } = await submitForm({
      requestUrl: routePath,
      server: getServer(),
      formData: { nrlReference: savedReference },
      cookie: sessionCookie
    })
    const document = await loadPage({
      requestUrl: urlWithReference(validReference),
      server: getServer(),
      cookie
    })
    expect(getByLabelText(document, inputLabel)).toHaveValue(savedReference)
  })

  describe('without a session', () => {
    it('should redirect to the start page', async () => {
      const response = await getResponse({
        server: getServer(),
        requestUrl: routePath
      })
      expect(response.statusCode).toBe(statusCodes.found)
      expect(response.headers.location).toBe(startPath)
    })

    it('should redirect to the start page when the pre-filled reference is invalid', async () => {
      const response = await getResponse({
        server: getServer(),
        requestUrl: urlWithReference(invalidReference)
      })
      expect(response.statusCode).toBe(statusCodes.found)
      expect(response.headers.location).toBe(startPath)
    })

    it('should show the page with the reference when it is pre-filled with a valid one', async () => {
      const document = await loadPage({
        requestUrl: urlWithReference(validReference),
        server: getServer()
      })
      expect(getByLabelText(document, inputLabel)).toHaveValue(validReference)
    })

    it('should let the user continue to the email address page after a pre-filled visit', async () => {
      const response = await getResponse({
        server: getServer(),
        requestUrl: urlWithReference(validReference)
      })
      const prefilledCookie = mergeCookies(null, response.headers['set-cookie'])
      const { cookie } = await submitForm({
        requestUrl: routePath,
        server: getServer(),
        formData: { nrlReference: validReference },
        cookie: prefilledCookie
      })
      const emailResponse = await getResponse({
        server: getServer(),
        requestUrl: enterEmailPath,
        cookie
      })
      expect(emailResponse.statusCode).toBe(statusCodes.ok)
    })
  })
})
