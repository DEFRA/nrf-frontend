import { getByRole } from '@testing-library/dom'
import { routePath } from './routes.js'
import { setupTestServer } from '../../../test-utils/setup-test-server.js'
import { loadPage } from '../../../test-utils/load-page.js'
import { expectInputError } from '../../../test-utils/assertions.js'
import {
  getValidationFlashFromCache,
  saveValidationFlashToCache
} from '../session-cache.js'

vi.mock('../session-cache.js')

/**
 * Creates a multipart form payload for file upload testing
 */
function createMultipartPayload({ filename, content } = {}) {
  const boundary = '----FormBoundary' + Math.random().toString(36).substring(2)
  let payload

  if (filename && content) {
    payload =
      `--${boundary}\r\n` +
      `Content-Disposition: form-data; name="file"; filename="${filename}"\r\n` +
      `Content-Type: application/geo+json\r\n\r\n` +
      `${content}\r\n` +
      `--${boundary}--\r\n`
  } else {
    // Empty form (no file)
    payload = `--${boundary}--\r\n`
  }

  return {
    payload,
    headers: {
      'Content-Type': `multipart/form-data; boundary=${boundary}`
    }
  }
}

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
    const { payload, headers } = createMultipartPayload()
    const response = await getServer().inject({
      method: 'POST',
      url: routePath,
      payload,
      headers
    })
    expect(response.statusCode).toBe(303)
    expect(response.headers.location).toBe(routePath)
    expect(saveValidationFlashToCache.mock.calls[0][1]).toEqual({
      formSubmitData: {},
      validationErrors: {
        messagesByFormField: {
          file: {
            field: ['file'],
            href: '#file',
            text: 'Select a file'
          }
        },
        summary: [
          {
            field: ['file'],
            href: '#file',
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
            href: '#file',
            text: errorMessage,
            field: ['file']
          }
        ],
        messagesByFormField: {
          file: {
            href: '#file',
            text: errorMessage,
            field: ['file']
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
    const fileContent = JSON.stringify({
      type: 'FeatureCollection',
      features: []
    })
    const { payload, headers } = createMultipartPayload({
      filename: 'boundary.geojson',
      content: fileContent
    })

    const response = await getServer().inject({
      method: 'POST',
      url: routePath,
      payload,
      headers
    })
    expect(response.statusCode).toBe(303)
    expect(response.headers.location).toBe('/quote/upload-received')
  })
})
