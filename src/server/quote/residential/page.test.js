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

describe('Residential page', () => {
  const getServer = setupTestServer()

  it('should render a page heading, title and back link', async () => {
    const document = await loadPage({
      requestUrl: routePath,
      server: getServer()
    })
    expect(getByRole(document, 'heading', { level: 1 })).toHaveTextContent(
      'How many residential units in this development?'
    )
    expect(document.title).toBe(
      'How many residential units in this development? - Nature Restoration Fund - Gov.uk'
    )
    expect(getByRole(document, 'link', { name: 'Back' })).toHaveAttribute(
      'href',
      '#'
    )
  })

  it('should not pre-populate the input if the user did not previously enter a value', async () => {
    vi.mocked(getQuoteDataFromCache).mockReturnValue({})
    const document = await loadPage({
      requestUrl: routePath,
      server: getServer()
    })
    expect(
      getByLabelText(
        document,
        'How many residential units in this development?'
      )
    ).toHaveValue(null)
  })

  it('should remember the previously entered value', async () => {
    vi.mocked(getQuoteDataFromCache).mockReturnValue({
      residentialBuildingCount: 25
    })
    const document = await loadPage({
      requestUrl: routePath,
      server: getServer()
    })
    expect(
      getByLabelText(
        document,
        'How many residential units in this development?'
      )
    ).toHaveValue(25)
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
          residentialBuildingCount: {
            field: ['residentialBuildingCount'],
            href: '#residentialBuildingCount',
            text: 'Enter the number of residential units'
          }
        },
        summary: [
          {
            field: ['residentialBuildingCount'],
            href: '#residentialBuildingCount',
            text: 'Enter the number of residential units'
          }
        ]
      }
    })
  })

  it('should show a validation error if the page is viewed after an invalid form submission', async () => {
    const errorMessage = 'Enter the number of residential units'
    vi.mocked(getValidationFlashFromCache).mockReturnValue({
      validationErrors: {
        summary: [
          {
            href: '#residentialBuildingCount',
            text: errorMessage,
            field: ['residentialBuildingCount']
          }
        ],
        messagesByFormField: {
          residentialBuildingCount: {
            href: '#residentialBuildingCount',
            text: errorMessage,
            field: ['residentialBuildingCount']
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
      inputLabel: 'How many residential units in this development?',
      errorMessage
    })
  })

  it('should redirect to the next page if the form is submitted with a valid value', async () => {
    const { response } = await submitForm({
      requestUrl: routePath,
      server: getServer(),
      formData: { residentialBuildingCount: '10' }
    })
    expect(response.statusCode).toBe(303)
    expect(response.headers.location).toBe('/quote/next')
  })
})
