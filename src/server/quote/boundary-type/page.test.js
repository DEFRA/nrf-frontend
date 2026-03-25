import { getByRole, getByLabelText } from '@testing-library/dom'
import { routePath } from './routes.js'
import { setupTestServer } from '../../../test-utils/setup-test-server.js'
import { loadPage } from '../../../test-utils/load-page.js'
import { submitForm } from '../../../test-utils/submit-form.js'
import { expectFieldsetError } from '../../../test-utils/assertions.js'

describe('Boundary type page', () => {
  const getServer = setupTestServer()

  it('should render all page elements', async () => {
    const document = await loadPage({
      requestUrl: routePath,
      server: getServer()
    })
    expect(getByRole(document, 'heading', { level: 1 })).toHaveTextContent(
      'Choose how you would like to show us the boundary of your development'
    )
    expect(document.title).toBe(
      'Choose how you would like to show us the boundary of your development - Nature Restoration Fund - Gov.uk'
    )
    expect(getByRole(document, 'link', { name: 'Back' })).toHaveAttribute(
      'href',
      '/'
    )
    expect(getByLabelText(document, 'Draw on a map')).not.toBeChecked()
    expect(getByLabelText(document, 'Upload a file')).not.toBeChecked()
    const csrfToken = document.querySelector('form input[name="csrfToken"]')
    expect(csrfToken).toBeInTheDocument()
  })

  it("should remember the user's previous selection", async () => {
    const { cookie } = await submitForm({
      requestUrl: routePath,
      server: getServer(),
      formData: { boundaryEntryType: 'draw' }
    })
    const document = await loadPage({
      requestUrl: routePath,
      server: getServer(),
      cookie
    })
    expect(getByLabelText(document, 'Draw on a map')).toBeChecked()
    expect(getByLabelText(document, 'Upload a file')).not.toBeChecked()
  })

  it('should show a validation error, after an invalid form submission', async () => {
    const { response, cookie } = await submitForm({
      requestUrl: routePath,
      server: getServer(),
      formData: {}
    })
    expect(response.statusCode).toBe(303)
    expect(response.headers.location).toBe(routePath)
    const document = await loadPage({
      requestUrl: routePath,
      server: getServer(),
      cookie
    })
    expectFieldsetError({
      document,
      errorMessage: 'Select if you would like to draw a map or upload a file'
    })
  })

  it('should redirect to the next page', async () => {
    const { response } = await submitForm({
      requestUrl: routePath,
      server: getServer(),
      formData: { boundaryEntryType: 'draw' }
    })
    expect(response.statusCode).toBe(303)
    expect(response.headers.location).toBe('/quote/draw-boundary')
  })

  it('should redirect to the upload boundary page if upload is selected', async () => {
    const { response } = await submitForm({
      requestUrl: routePath,
      server: getServer(),
      formData: { boundaryEntryType: 'upload' }
    })
    expect(response.statusCode).toBe(303)
    expect(response.headers.location).toBe('/quote/upload-boundary')
  })
})
