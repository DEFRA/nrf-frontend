import { getByRole, getByLabelText } from '@testing-library/dom'
import { routePath } from './routes.js'
import getViewModel from './get-view-model.js'
import { routePath as enterNrlReferencePath } from '../enter-nrl-reference/route-path.js'
import { statusCodes } from '../../common/constants/status-codes.js'
import { setupTestServer } from '../../../test-utils/setup-test-server.js'
import { loadPage } from '../../../test-utils/load-page.js'
import { submitForm } from '../../../test-utils/submit-form.js'
import { expectInputError } from '../../../test-utils/assertions.js'
import { fullQuote } from '../../../test-utils/fixtures/quote.js'

const inputLabel = 'Enter your email address'
const missingMessage = 'Enter your email address'
const formatMessage =
  'Enter an email address in the correct format, like name@example.com'
const emailSentPath = '/request-to-use/email-sent'
const validEmail = fullQuote.email.address

describe('Enter your email address page', () => {
  const getServer = setupTestServer()

  const loadForm = () =>
    loadPage({ requestUrl: routePath, server: getServer() })

  it('should render all page elements', async () => {
    const document = await loadForm()
    const { pageTitle, pageHeading } = getViewModel()
    expect(document.title).toBe(pageTitle)
    expect(getByRole(document, 'heading', { level: 1 })).toHaveTextContent(
      pageHeading
    )
    const input = getByLabelText(document, inputLabel)
    expect(input).toHaveValue('')
    expect(input).toHaveAttribute('type', 'email')
    expect(input).toHaveAttribute('autocomplete', 'email')
    expect(input).toHaveAccessibleDescription(
      'Enter the email address you used to get your quote. We’ll send you a link to retrieve your quote details.'
    )
    expect(getByRole(document, 'button', { name: 'Continue' })).toBeVisible()
  })

  it('should link back to the enter your NRL reference page', async () => {
    const document = await loadForm()
    expect(getByRole(document, 'link', { name: 'Back' })).toHaveAttribute(
      'href',
      enterNrlReferencePath
    )
  })

  it('should contain a CSRF token in the form', async () => {
    const document = await loadForm()
    const csrfToken = document.querySelector('form input[name="csrfToken"]')
    expect(csrfToken).toBeInTheDocument()
  })

  it.each([
    { scenario: 'a valid email address', value: validEmail },
    { scenario: 'an email address with whitespace', value: `  ${validEmail} ` }
  ])('should redirect to the next page for $scenario', async ({ value }) => {
    const { response } = await submitForm({
      requestUrl: routePath,
      server: getServer(),
      formData: { email: value }
    })
    expect(response.statusCode).toBe(statusCodes.redirectAfterPost)
    expect(response.headers.location).toBe(emailSentPath)
  })

  it.each([
    { scenario: 'is absent', formData: {}, errorMessage: missingMessage },
    {
      scenario: 'is empty',
      formData: { email: '' },
      errorMessage: missingMessage
    },
    {
      scenario: 'is only whitespace',
      formData: { email: '   ' },
      errorMessage: missingMessage
    },
    {
      scenario: 'has no @ symbol',
      formData: { email: 'testemail.com' },
      errorMessage: formatMessage
    },
    {
      scenario: 'has no domain',
      formData: { email: 'test@' },
      errorMessage: formatMessage
    }
  ])(
    'should redirect back with a validation error when the email address $scenario',
    async ({ formData, errorMessage }) => {
      const { response, cookie } = await submitForm({
        requestUrl: routePath,
        server: getServer(),
        formData
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
      formData: { email: 'testemail.com' }
    })
    const document = await loadPage({
      requestUrl: routePath,
      server: getServer(),
      cookie
    })
    expect(getByLabelText(document, inputLabel)).toHaveValue('testemail.com')
  })
})
