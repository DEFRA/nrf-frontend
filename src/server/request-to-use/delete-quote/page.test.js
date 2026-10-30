import { getByRole, getByText } from '@testing-library/dom'
import { routePath } from './routes.js'
import getViewModel from './get-view-model.js'
import { statusCodes } from '../../common/constants/status-codes.js'
import { setupTestServer } from '../../../test-utils/setup-test-server.js'
import { setupSeededRequestToUseServer } from '../../../test-utils/setup-seeded-request-to-use-server.js'
import { setupMswServer } from '../../../test-utils/setup-msw-server.js'
import { loadPage } from '../../../test-utils/load-page.js'
import { submitForm } from '../../../test-utils/submit-form.js'
import { getResponse } from '../../../test-utils/get-response.js'
import { withCompleteQuoteSession } from '../../../test-utils/with-complete-quote-session.js'
import { mockDeleteQuote } from '../../../test-utils/mock-get-quote.js'

const mswServer = setupMswServer()

describe('Are you sure you want to delete this quote page', () => {
  const getServer = setupTestServer()
  const getSeededServer = setupSeededRequestToUseServer()

  const load = async () =>
    loadPage({
      requestUrl: routePath,
      server: getSeededServer(),
      cookie: await withCompleteQuoteSession(getSeededServer())
    })

  it('should redirect to the start page when there is no session', async () => {
    const response = await getResponse({
      server: getServer(),
      requestUrl: routePath
    })

    expect(response.statusCode).toBe(statusCodes.found)
    expect(response.headers.location).toBe('/manage/start-page')
  })

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

  it('should delete the quote and redirect to the delete quote confirmation page after form submission', async () => {
    const requests = mockDeleteQuote(mswServer)

    const { response } = await submitForm({
      requestUrl: routePath,
      server: getSeededServer(),
      formData: { confirmDeleteQuote: 'Yes' },
      cookie: await withCompleteQuoteSession(getSeededServer())
    })

    expect(response.statusCode).toBe(statusCodes.redirectAfterPost)
    expect(response.headers.location).toBe(
      '/request-to-use/delete-quote-confirmation'
    )
    expect(requests).toEqual(['NRL-123456'])
  })

  it('should redirect back to the form when the hidden field is missing', async () => {
    const { response } = await submitForm({
      requestUrl: routePath,
      server: getSeededServer(),
      formData: {},
      cookie: await withCompleteQuoteSession(getSeededServer())
    })

    expect(response.statusCode).toBe(statusCodes.redirectAfterPost)
    expect(response.headers.location).toBe('/request-to-use/delete-quote')
  })

  it.each([404, 500])(
    'should show the 500 error page when the delete fails with %i',
    async (status) => {
      mockDeleteQuote(mswServer, { status })

      const { response, document } = await submitForm({
        requestUrl: routePath,
        server: getSeededServer(),
        formData: { confirmDeleteQuote: 'Yes' },
        cookie: await withCompleteQuoteSession(getSeededServer())
      })

      expect(response.statusCode).toBe(500)
      expect(getByRole(document, 'heading', { level: 1 })).toHaveTextContent(
        'Sorry, there is a problem with the service'
      )
    }
  )
})
