import { getByRole, getByLabelText } from '@testing-library/dom'
import { routePath } from './routes.js'
import { setupTestServer } from '../../../test-utils/setup-test-server.js'
import { loadPage } from '../../../test-utils/load-page.js'
import { submitForm } from '../../../test-utils/submit-form.js'
import { expectFieldsetError } from '../../../test-utils/assertions.js'
import {
  getQuoteDataFromCache,
  getValidationFlashFromCache,
  saveValidationFlashToCache
} from '../session-cache.js'

vi.mock('../session-cache.js')

describe('Development type page', () => {
  const getServer = setupTestServer()

  it('should render a page heading, title and back link', async () => {
    const document = await loadPage({
      requestUrl: routePath,
      server: getServer()
    })
    expect(getByRole(document, 'heading', { level: 1 })).toHaveTextContent(
      'What type of development is it?'
    )
    expect(document.title).toBe(
      'What type of development is it? - Nature Restoration Fund - Gov.uk'
    )
    expect(getByRole(document, 'link', { name: 'Back' })).toHaveAttribute(
      'href',
      '#'
    )
  })

  it("should not pre-check any checkboxes if the user didn't previously make a selection", async () => {
    vi.mocked(getQuoteDataFromCache).mockReturnValue({})
    const document = await loadPage({
      requestUrl: routePath,
      server: getServer()
    })
    expect(getByLabelText(document, 'Housing')).not.toBeChecked()
    expect(getByLabelText(document, 'Other residential')).not.toBeChecked()
  })

  it('should remember if the user previously selected Housing', async () => {
    vi.mocked(getQuoteDataFromCache).mockReturnValue({
      developmentTypes: ['housing']
    })
    const document = await loadPage({
      requestUrl: routePath,
      server: getServer()
    })
    expect(getByLabelText(document, 'Housing')).toBeChecked()
    expect(getByLabelText(document, 'Other residential')).not.toBeChecked()
  })

  it('should remember if the user previously selected Other residential', async () => {
    vi.mocked(getQuoteDataFromCache).mockReturnValue({
      developmentTypes: ['other-residential']
    })
    const document = await loadPage({
      requestUrl: routePath,
      server: getServer()
    })
    expect(getByLabelText(document, 'Other residential')).toBeChecked()
    expect(getByLabelText(document, 'Housing')).not.toBeChecked()
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
          developmentTypes: {
            field: ['developmentTypes'],
            href: '#developmentTypes',
            text: 'Select a development type to continue'
          }
        },
        summary: [
          {
            field: ['developmentTypes'],
            href: '#developmentTypes',
            text: 'Select a development type to continue'
          }
        ]
      }
    })
  })

  it('should show a validation error if the page is viewed after an invalid form submission', async () => {
    const errorMessage = 'Select a development type to continue'
    vi.mocked(getValidationFlashFromCache).mockReturnValue({
      validationErrors: {
        summary: [
          {
            href: '#developmentTypes',
            text: errorMessage,
            field: ['developmentTypes']
          }
        ],
        messagesByFormField: {
          developmentTypes: {
            href: '#developmentTypes',
            text: errorMessage,
            field: ['developmentTypes']
          }
        }
      },
      formSubmitData: {}
    })
    const document = await loadPage({
      requestUrl: routePath,
      server: getServer()
    })
    expectFieldsetError({ document, errorMessage })
  })

  it('should redirect to the next placeholder page if Housing is not selected', async () => {
    const { response } = await submitForm({
      requestUrl: routePath,
      server: getServer(),
      formData: { developmentTypes: ['other-residential'] }
    })
    expect(response.statusCode).toBe(303)
    expect(response.headers.location).toBe('/quote/next')
  })

  it('should redirect to the next placeholder page if Housing is selected', async () => {
    const { response } = await submitForm({
      requestUrl: routePath,
      server: getServer(),
      formData: { developmentTypes: ['housing', 'other-residential'] }
    })
    expect(response.statusCode).toBe(303)
    expect(response.headers.location).toBe('/quote/residential')
  })
})
