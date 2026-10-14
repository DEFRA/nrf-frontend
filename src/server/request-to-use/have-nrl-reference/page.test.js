import { getByRole, getByLabelText, queryByRole } from '@testing-library/dom'
import { routePath } from './routes.js'
import getViewModel from './get-view-model.js'
import { routePath as whatWouldYouLikeToDoPath } from '../../manage/what-would-you-like-to-do/route-path.js'
import { routePath as noNrlReferencePath } from '../no-nrl-reference/route-path.js'
import { routePath as startPagePath } from '../../manage/start-page/route-path.js'
import { routePath as enterNrlReferencePath } from '../enter-nrl-reference/route-path.js'
import { statusCodes } from '../../common/constants/status-codes.js'
import { setupTestServer } from '../../../test-utils/setup-test-server.js'
import { loadPage } from '../../../test-utils/load-page.js'
import { submitForm } from '../../../test-utils/submit-form.js'
import { withValidRetrieveQuoteSession } from '../../../test-utils/with-valid-retrieve-quote-session.js'
import { expectFieldsetError } from '../../../test-utils/assertions.js'
import { getResponse } from '../../../test-utils/get-response.js'
import { fullQuote } from '../../../test-utils/fixtures/quote.js'

describe('Do you have an NRL reference page', () => {
  const getServer = setupTestServer()
  let sessionCookie

  beforeEach(async () => {
    sessionCookie = await withValidRetrieveQuoteSession(getServer())
  })

  it('should render all page elements', async () => {
    const document = await loadPage({
      requestUrl: routePath,
      server: getServer(),
      cookie: sessionCookie
    })
    const { pageTitle, pageHeading } = getViewModel()
    expect(document.title).toBe(pageTitle)
    expect(getByRole(document, 'heading', { level: 1 })).toHaveTextContent(
      pageHeading
    )
    expect(getByRole(document, 'group')).toHaveAccessibleDescription(
      'You can find this reference in your quote email.'
    )
    expect(getByLabelText(document, 'Yes')).not.toBeChecked()
    expect(getByLabelText(document, 'No')).not.toBeChecked()
  })

  it('should link back to the what would you like to do page', async () => {
    const document = await loadPage({
      requestUrl: routePath,
      server: getServer(),
      cookie: sessionCookie
    })
    expect(getByRole(document, 'link', { name: 'Back' })).toHaveAttribute(
      'href',
      whatWouldYouLikeToDoPath
    )
  })

  it('should not have a Cancel link', async () => {
    const document = await loadPage({
      requestUrl: routePath,
      server: getServer(),
      cookie: sessionCookie
    })
    expect(
      queryByRole(document, 'link', { name: 'Cancel' })
    ).not.toBeInTheDocument()
  })

  it('should contain a CSRF token in the form', async () => {
    const document = await loadPage({
      requestUrl: routePath,
      server: getServer(),
      cookie: sessionCookie
    })
    const csrfToken = document.querySelector('form input[name="csrfToken"]')
    expect(csrfToken).toBeInTheDocument()
  })

  it.each([
    { answer: 'yes', nextPage: enterNrlReferencePath },
    { answer: 'no', nextPage: noNrlReferencePath }
  ])(
    'should redirect to $nextPage when "$answer" is selected',
    async ({ answer, nextPage }) => {
      const { response } = await submitForm({
        requestUrl: routePath,
        server: getServer(),
        formData: { hasNrlReference: answer },
        cookie: sessionCookie
      })
      expect(response.statusCode).toBe(statusCodes.redirectAfterPost)
      expect(response.headers.location).toBe(nextPage)
    }
  )

  it.each([
    { scenario: 'no option is selected', formData: {} },
    {
      scenario: 'the value is not a recognised option',
      formData: { hasNrlReference: 'maybe' }
    }
  ])(
    'should redirect back with a validation error when $scenario',
    async ({ formData }) => {
      const { response, cookie } = await submitForm({
        requestUrl: routePath,
        server: getServer(),
        formData,
        cookie: sessionCookie
      })
      expect(response.statusCode).toBe(statusCodes.redirectAfterPost)
      expect(response.headers.location).toBe(routePath)
      const document = await loadPage({
        requestUrl: routePath,
        server: getServer(),
        cookie
      })
      expectFieldsetError({
        document,
        errorMessage: 'Select yes if you have an NRL reference'
      })
      expect(document.title).toBe(`Error: ${getViewModel().pageTitle}`)
    }
  )

  it.each(['yes', 'no'])(
    'should show the previous answer of "%s" when returning to the page',
    async (answer) => {
      const { cookie } = await submitForm({
        requestUrl: routePath,
        server: getServer(),
        formData: { hasNrlReference: answer },
        cookie: sessionCookie
      })
      const document = await loadPage({
        requestUrl: routePath,
        server: getServer(),
        cookie
      })
      expect(
        getByLabelText(document, answer === 'yes' ? 'Yes' : 'No')
      ).toBeChecked()
    }
  )

  it('should forget a saved NRL reference when the answer is changed to no', async () => {
    const server = getServer()
    let { cookie } = await submitForm({
      requestUrl: routePath,
      server,
      formData: { hasNrlReference: 'yes' },
      cookie: sessionCookie
    })
    ;({ cookie } = await submitForm({
      requestUrl: enterNrlReferencePath,
      server,
      formData: { nrlReference: fullQuote.reference },
      cookie
    }))
    ;({ cookie } = await submitForm({
      requestUrl: routePath,
      server,
      formData: { hasNrlReference: 'no' },
      cookie
    }))
    const document = await loadPage({
      requestUrl: enterNrlReferencePath,
      server,
      cookie
    })
    expect(getByLabelText(document, 'Enter your NRL reference')).toHaveValue('')
  })

  it('should redirect to the start page when there is no session', async () => {
    const response = await getResponse({
      server: getServer(),
      requestUrl: routePath
    })
    expect(response.statusCode).toBe(statusCodes.found)
    expect(response.headers.location).toBe(startPagePath)
  })
})
