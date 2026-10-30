import { getByRole, getByText } from '@testing-library/dom'
import { routePath } from './routes.js'
import getViewModel from './get-view-model.js'
import { statusCodes } from '../../common/constants/status-codes.js'
import { setupTestServer } from '../../../test-utils/setup-test-server.js'
import { loadPage } from '../../../test-utils/load-page.js'
import { submitForm } from '../../../test-utils/submit-form.js'

describe('Are you sure you want to delete this quote page', () => {
  const getServer = setupTestServer()

  const load = () => loadPage({ requestUrl: routePath, server: getServer() })

  it('should render the heading, title and warning content', async () => {
    const document = await load()

    expect(document.title).toBe(getViewModel().pageTitle)
    expect(getByRole(document, 'heading', { level: 1 })).toHaveTextContent(
      'Are you sure you want to delete this quote?'
    )
    expect(
      getByText(
        document,
        'This will permanently delete your quote. You can create a new quote.'
      )
    ).toBeInTheDocument()
    expect(getByRole(document, 'button', { name: 'Delete' })).toHaveClass(
      'govuk-button--warning'
    )
  })

  it('should link back to the review and amend your quote details page', async () => {
    const document = await load()

    expect(getByRole(document, 'link', { name: 'Back' })).toHaveAttribute(
      'href',
      '/request-to-use/review-quote-details'
    )
  })

  it('should link to the review and amend your quote details page from Cancel', async () => {
    const document = await load()

    expect(getByRole(document, 'link', { name: /Cancel/ })).toHaveAttribute(
      'href',
      '/request-to-use/review-quote-details'
    )
  })

  it('should contain a CSRF token in the form', async () => {
    const document = await load()

    expect(
      document.querySelector('form input[name="csrfToken"]')
    ).toBeInTheDocument()
  })

  it('should redirect to the delete quote confirmation page after form submission', async () => {
    const { response } = await submitForm({
      requestUrl: routePath,
      server: getServer(),
      formData: { confirmDeleteQuote: 'Yes' }
    })

    expect(response.statusCode).toBe(statusCodes.redirectAfterPost)
    expect(response.headers.location).toBe(
      '/request-to-use/delete-quote-confirmation'
    )
  })

  it('should redirect back to the form when the hidden field is missing', async () => {
    const { response } = await submitForm({
      requestUrl: routePath,
      server: getServer(),
      formData: {}
    })

    expect(response.statusCode).toBe(statusCodes.redirectAfterPost)
    expect(response.headers.location).toBe('/request-to-use/delete-quote')
  })
})
