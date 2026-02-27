import { getByRole, getByLabelText } from '@testing-library/dom'
import { routePath } from './routes.js'
import { setupTestServer } from '../../../test-utils/setup-test-server.js'
import { loadPage } from '../../../test-utils/load-page.js'
import { submitForm } from '../../../test-utils/submit-form.js'
import { expectInputError } from '../../../test-utils/assertions.js'
import {
  getQuoteDataFromCache,
  getValidationFlashFromCache,
  saveValidationFlashToCache
} from '../session-cache.js'

vi.mock('../session-cache.js')

describe('Email page', () => {
  const getServer = setupTestServer()

  it('should render a page heading, title and back link', async () => {
    const document = await loadPage({
      requestUrl: routePath,
      server: getServer()
    })
    expect(getByRole(document, 'heading', { level: 1 })).toHaveTextContent(
      'Enter your email address'
    )
    expect(document.title).toBe(
      'Enter your email address - Nature Restoration Fund - Gov.uk'
    )
    expect(getByRole(document, 'link', { name: 'Back' })).toHaveAttribute(
      'href',
      '#'
    )
  })

  it('should not pre-populate the email field if the user has not entered one', async () => {
    vi.mocked(getQuoteDataFromCache).mockReturnValue({})
    const document = await loadPage({
      requestUrl: routePath,
      server: getServer()
    })
    expect(getByLabelText(document, 'Enter your email address')).toHaveValue('')
  })

  it('should remember if the user previously entered an email', async () => {
    vi.mocked(getQuoteDataFromCache).mockReturnValue({
      email: 'test@example.com'
    })
    const document = await loadPage({
      requestUrl: routePath,
      server: getServer()
    })
    expect(getByLabelText(document, 'Enter your email address')).toHaveValue(
      'test@example.com'
    )
  })

  it('should include a CSRF token inside the form, to prevent CSRF attacks', async () => {
    const document = await loadPage({
      requestUrl: routePath,
      server: getServer()
    })
    const csrfToken = document.querySelector('form input[name="csrfToken"]')
    expect(csrfToken).toBeInTheDocument()
  })

  it('should redirect and save validation errors to cache, after submitting without an email', async () => {
    const { response } = await submitForm({
      requestUrl: routePath,
      server: getServer(),
      formData: {}
    })
    expect(response.statusCode).toBe(303)
    expect(response.headers.location).toBe(routePath)
    expect(saveValidationFlashToCache.mock.calls[0][1]).toEqual({
      formSubmitData: {},
      validationErrors: {
        messagesByFormField: {
          email: {
            field: ['email'],
            href: '#email',
            text: 'Enter an email address'
          }
        },
        summary: [
          {
            field: ['email'],
            href: '#email',
            text: 'Enter an email address'
          }
        ]
      }
    })
  })

  it('should redirect and save validation errors to cache, after submitting with an invalid email', async () => {
    const { response } = await submitForm({
      requestUrl: routePath,
      server: getServer(),
      formData: { email: 'invalid-email' }
    })
    expect(response.statusCode).toBe(303)
    expect(response.headers.location).toBe(routePath)
    expect(saveValidationFlashToCache.mock.calls[0][1]).toEqual({
      formSubmitData: { email: 'invalid-email' },
      validationErrors: {
        messagesByFormField: {
          email: {
            field: ['email'],
            href: '#email',
            text: 'Enter an email address in the correct format, like name@example.com'
          }
        },
        summary: [
          {
            field: ['email'],
            href: '#email',
            text: 'Enter an email address in the correct format, like name@example.com'
          }
        ]
      }
    })
  })

  it('should show a validation error if the page is viewed after submitting without an email', async () => {
    const errorMessage = 'Enter an email address'
    vi.mocked(getValidationFlashFromCache).mockReturnValue({
      validationErrors: {
        summary: [
          {
            href: '#email',
            text: errorMessage,
            field: ['email']
          }
        ],
        messagesByFormField: {
          email: {
            href: '#email',
            text: errorMessage,
            field: ['email']
          }
        }
      },
      formSubmitData: {}
    })
    const document = await loadPage({
      requestUrl: routePath,
      server: getServer()
    })
    expectInputError({
      document,
      inputLabel: 'Enter your email address',
      errorMessage
    })
  })

  it('should show a validation error if the page is viewed after submitting an invalid email', async () => {
    const errorMessage =
      'Enter an email address in the correct format, like name@example.com'
    vi.mocked(getValidationFlashFromCache).mockReturnValue({
      validationErrors: {
        summary: [
          {
            href: '#email',
            text: errorMessage,
            field: ['email']
          }
        ],
        messagesByFormField: {
          email: {
            href: '#email',
            text: errorMessage,
            field: ['email']
          }
        }
      },
      formSubmitData: { email: 'invalid-email' }
    })
    const document = await loadPage({
      requestUrl: routePath,
      server: getServer()
    })
    expectInputError({
      document,
      inputLabel: 'Enter your email address',
      errorMessage
    })
  })

  it('should redirect to the next page if the form is submitted with a valid email', async () => {
    const { response } = await submitForm({
      requestUrl: routePath,
      server: getServer(),
      formData: { email: 'test@example.com' }
    })
    expect(response.statusCode).toBe(303)
    expect(response.headers.location).toBe('/quote/next')
  })
})
