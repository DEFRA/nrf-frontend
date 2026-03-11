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

const pageHeading =
  'What is the maximum number of people the development will serve?'

describe('People count page', () => {
  const getServer = setupTestServer()

  beforeEach(() => vi.mocked(getQuoteDataFromCache).mockReturnValue({}))

  it('should render a page heading and title', async () => {
    const document = await loadPage({
      requestUrl: routePath,
      server: getServer()
    })
    expect(getByRole(document, 'heading', { level: 1 })).toHaveTextContent(
      pageHeading
    )
    expect(document.title).toBe(
      'What is the maximum number of people the development will serve? - Nature Restoration Fund - Gov.uk'
    )
  })

  it('should link back to development-types if housing was not selected', async () => {
    vi.mocked(getQuoteDataFromCache).mockReturnValue({
      developmentTypes: ['other-residential']
    })
    const document = await loadPage({
      requestUrl: routePath,
      server: getServer()
    })
    expect(getByRole(document, 'link', { name: 'Back' })).toHaveAttribute(
      'href',
      '/quote/development-types'
    )
  })

  it('should link back to residential if housing was selected', async () => {
    vi.mocked(getQuoteDataFromCache).mockReturnValue({
      developmentTypes: ['housing']
    })
    const document = await loadPage({
      requestUrl: routePath,
      server: getServer()
    })
    expect(getByRole(document, 'link', { name: 'Back' })).toHaveAttribute(
      'href',
      '/quote/residential'
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

  it('should redirect and save validation errors to cache, after an invalid form submission', async () => {
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
          peopleCount: {
            field: ['peopleCount'],
            href: '#peopleCount',
            text: 'Enter the maximum number of people to continue'
          }
        },
        summary: [
          {
            field: ['peopleCount'],
            href: '#peopleCount',
            text: 'Enter the maximum number of people to continue'
          }
        ]
      }
    })
  })

  it('should show a validation error if the page is viewed after an invalid form submission', async () => {
    const errorMessage = 'Enter the maximum number of people to continue'
    vi.mocked(getValidationFlashFromCache).mockReturnValue({
      validationErrors: {
        summary: [
          {
            href: '#peopleCount',
            text: errorMessage,
            field: ['peopleCount']
          }
        ],
        messagesByFormField: {
          peopleCount: {
            href: '#peopleCount',
            text: errorMessage,
            field: ['peopleCount']
          }
        }
      },
      formSubmitData: {}
    })
    const document = await loadPage({
      requestUrl: routePath,
      server: getServer()
    })
    expectInputError({ document, inputLabel: pageHeading, errorMessage })
  })

  it('should redirect to the next page if the form is submitted with a valid value', async () => {
    const { response } = await submitForm({
      requestUrl: routePath,
      server: getServer(),
      formData: { peopleCount: '50' }
    })
    expect(response.statusCode).toBe(303)
    expect(response.headers.location).toBe('/quote/email')
  })

  it("should not pre-fill the input if the user didn't previously enter a value", async () => {
    const document = await loadPage({
      requestUrl: routePath,
      server: getServer()
    })
    expect(getByLabelText(document, pageHeading)).toHaveValue(null)
  })

  it('should remember a previously entered value', async () => {
    vi.mocked(getQuoteDataFromCache).mockReturnValue({ peopleCount: 42 })
    const document = await loadPage({
      requestUrl: routePath,
      server: getServer()
    })
    expect(getByLabelText(document, pageHeading)).toHaveValue(42)
  })
})
