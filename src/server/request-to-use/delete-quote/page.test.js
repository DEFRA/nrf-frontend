import { getByRole, getByText } from '@testing-library/dom'
import getViewModel from './get-view-model.js'
import { setupSeededRequestToUseServer } from '../../../test-utils/setup-seeded-request-to-use-server.js'
import { loadPage } from '../../../test-utils/load-page.js'
import { getResponse } from '../../../test-utils/get-response.js'
import { submitForm } from '../../../test-utils/submit-form.js'
import { withCompleteQuoteSession } from '../../../test-utils/with-complete-quote-session.js'

const pagePath = '/request-to-use/delete-quote'
const startPath = '/manage/start-page'

describe('Are you sure you want to delete this quote page', () => {
  const getServer = setupSeededRequestToUseServer()
  let sessionCookie

  beforeEach(async () => {
    sessionCookie = await withCompleteQuoteSession(getServer())
  })

  const load = () =>
    loadPage({
      requestUrl: pagePath,
      server: getServer(),
      cookie: sessionCookie
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

  it('should redirect to the delete quote confirmation page after form submission', async () => {
    const { response } = await submitForm({
      requestUrl: pagePath,
      server: getServer(),
      formData: { confirmDeleteQuote: 'Yes' },
      cookie: sessionCookie
    })

    expect(response.statusCode).toBe(303)
    expect(response.headers.location).toBe(
      '/request-to-use/delete-quote-confirmation'
    )
  })

  it('should redirect to the start page when requested again after the quote is deleted', async () => {
    const { cookie } = await submitForm({
      requestUrl: pagePath,
      server: getServer(),
      formData: { confirmDeleteQuote: 'Yes' },
      cookie: sessionCookie
    })

    const response = await getResponse({
      server: getServer(),
      requestUrl: pagePath,
      cookie
    })

    expect(response.statusCode).toBe(302)
    expect(response.headers.location).toBe(startPath)
  })

  it('should redirect to the start page without a session', async () => {
    const response = await getResponse({
      server: getServer(),
      requestUrl: pagePath
    })

    expect(response.statusCode).toBe(302)
    expect(response.headers.location).toBe(startPath)
  })

  it('should redirect back to the form when the hidden field is missing', async () => {
    const { response } = await submitForm({
      requestUrl: pagePath,
      server: getServer(),
      formData: {},
      cookie: sessionCookie
    })

    expect(response.statusCode).toBe(303)
    expect(response.headers.location).toBe('/request-to-use/delete-quote')
  })
})
