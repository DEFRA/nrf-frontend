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

vi.mock('../session-cache.js', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    getQuoteDataFromCache: vi.fn(),
    getValidationFlashFromCache: vi.fn(),
    clearValidationFlashFromCache: vi.fn(),
    saveValidationFlashToCache: vi.fn()
  }
})

describe('Boundary type page', () => {
  const getServer = setupTestServer()

  it('should render a page heading, title and back link', async () => {
    const document = await loadPage({
      requestUrl: routePath,
      server: getServer()
    })
    expect(getByRole(document, 'heading', { level: 1 })).toHaveTextContent(
      'Choose how you would like to show us the boundary of your development'
    )
    expect(document.title).toBe(
      'Choose how you would like to show us the boundary of your development - Gov.uk'
    )
    expect(getByRole(document, 'link', { name: 'Back' })).toHaveAttribute(
      'href',
      '/'
    )
  })

  it("should not pre-select a radio button if the user didn't previously select one", async () => {
    vi.mocked(getQuoteDataFromCache).mockReturnValue({})
    const document = await loadPage({
      requestUrl: routePath,
      server: getServer()
    })
    expect(getByLabelText(document, 'Draw on a map')).not.toBeChecked()
    expect(getByLabelText(document, 'Upload a file')).not.toBeChecked()
  })

  it('should remember if the user previously selected draw', async () => {
    vi.mocked(getQuoteDataFromCache).mockReturnValue({
      boundaryEntryType: 'draw'
    })
    const document = await loadPage({
      requestUrl: routePath,
      server: getServer()
    })
    expect(getByLabelText(document, 'Draw on a map')).toBeChecked()
    expect(getByLabelText(document, 'Upload a file')).not.toBeChecked()
  })

  it('should remember if the user previously selected upload', async () => {
    vi.mocked(getQuoteDataFromCache).mockReturnValue({
      boundaryEntryType: 'upload'
    })
    const document = await loadPage({
      requestUrl: routePath,
      server: getServer()
    })
    expect(getByLabelText(document, 'Upload a file')).toBeChecked()
    expect(getByLabelText(document, 'Draw on a map')).not.toBeChecked()
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
          boundaryEntryType: {
            field: ['boundaryEntryType'],
            href: '#boundaryEntryType',
            text: 'Select if you would like to draw a map or upload a file'
          }
        },
        summary: [
          {
            field: ['boundaryEntryType'],
            href: '#boundaryEntryType',
            text: 'Select if you would like to draw a map or upload a file'
          }
        ]
      }
    })
  })

  it('should show a validation error if the page is viewed after an invalid form submission', async () => {
    const errorMessage =
      'Select if you would like to draw a map or upload a file'
    vi.mocked(getValidationFlashFromCache).mockReturnValue({
      validationErrors: {
        summary: [
          {
            href: '#boundaryEntryType',
            text: errorMessage,
            field: ['boundaryEntryType']
          }
        ],
        messagesByFormField: {
          boundaryEntryType: {
            href: '#boundaryEntryType',
            text: errorMessage,
            field: ['boundaryEntryType']
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

  it('should redirect to the next page if the form is submitted with a selection', async () => {
    const { response } = await submitForm({
      requestUrl: routePath,
      server: getServer(),
      formData: { boundaryEntryType: 'draw' }
    })
    expect(response.statusCode).toBe(303)
    expect(response.headers.location).toBe('/quote/next')
  })
})
