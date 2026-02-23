import { getByRole } from '@testing-library/dom'
import { routePath } from './routes.js'
import { setupTestServer } from '../../../test-utils/setup-test-server.js'
import { loadPage } from '../../../test-utils/load-page.js'
import { submitForm } from '../../../test-utils/submit-form.js'
import { expectFieldsetError } from '../../../test-utils/assertions.js'

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

  it('should show a validation error if the form is submitted without a selection', async () => {
    const { document } = await submitForm({
      requestUrl: routePath,
      server: getServer(),
      formData: {}
    })
    expectFieldsetError({
      document,
      errorMessage: 'Select if you would like to draw a map or upload a file'
    })
  })

  it('should redirect to the next page if the form is submitted with a selection', async () => {
    const { response } = await submitForm({
      requestUrl: routePath,
      server: getServer(),
      formData: { boundaryEntryType: 'draw' }
    })
    expect(response.statusCode).toBe(302)
    expect(response.headers.location).toBe('/quote/next')
  })
})
