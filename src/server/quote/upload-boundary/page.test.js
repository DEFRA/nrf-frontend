import { getByRole } from '@testing-library/dom'
import { routePath } from './routes.js'
import { setupTestServer } from '../../../test-utils/setup-test-server.js'
import { loadPage } from '../../../test-utils/load-page.js'
import { submitForm } from '../../../test-utils/submit-form.js'
import { expectInputError } from '../../../test-utils/assertions.js'
import {
  getValidationFlashFromCache,
  saveValidationFlashToCache
} from '../session-cache.js'

vi.mock('../session-cache.js')

describe('Upload boundary page', () => {
  const getServer = setupTestServer()

  it('should render a page heading, title and back link', async () => {
    const document = await loadPage({
      requestUrl: routePath,
      server: getServer()
    })
    expect(getByRole(document, 'heading', { level: 1 })).toHaveTextContent(
      'Upload a red line boundary file'
    )
    expect(document.title).toBe(
      'Upload a red line boundary file - Nature Restoration Fund - Gov.uk'
    )
    expect(getByRole(document, 'link', { name: 'Back' })).toHaveAttribute(
      'href',
      '#'
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
          redlineFile: {
            field: ['redlineFile'],
            href: '#redlineFile',
            text: 'Select a file'
          }
        },
        summary: [
          {
            field: ['redlineFile'],
            href: '#redlineFile',
            text: 'Select a file'
          }
        ]
      }
    })
  })

  it('should show a validation error if the page is viewed after an invalid form submission', async () => {
    const errorMessage = 'Select a file'
    vi.mocked(getValidationFlashFromCache).mockReturnValue({
      validationErrors: {
        summary: [
          {
            href: '#redlineFile',
            text: errorMessage,
            field: ['redlineFile']
          }
        ],
        messagesByFormField: {
          redlineFile: {
            href: '#redlineFile',
            text: errorMessage,
            field: ['redlineFile']
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
      inputLabel: 'Upload a red line boundary file',
      errorMessage
    })
  })

  it('should redirect to the next page if the form is submitted with a file', async () => {
    const { response } = await submitForm({
      requestUrl: routePath,
      server: getServer(),
      formData: { redlineFile: { filename: 'test.geojson' } }
    })
    expect(response.statusCode).toBe(303)
    expect(response.headers.location).toBe('/quote/next')
  })
})
