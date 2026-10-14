import { getByRole, getByLabelText } from '@testing-library/dom'
import { routePath } from './routes.js'
import getViewModel from './get-view-model.js'
import { routePath as startPagePath } from '../start-page/route-path.js'
import { routePath as planningTypePath } from '../../quote/planning-type/route-path.js'
import { routePath as haveNrlReferencePath } from '../../request-to-use/have-nrl-reference/route-path.js'
import { statusCodes } from '../../common/constants/status-codes.js'
import { setupTestServer } from '../../../test-utils/setup-test-server.js'
import { loadPage } from '../../../test-utils/load-page.js'
import { submitForm } from '../../../test-utils/submit-form.js'
import { expectFieldsetError } from '../../../test-utils/assertions.js'
import { getResponse } from '../../../test-utils/get-response.js'
import { withCompleteQuoteSession } from '../../../test-utils/with-complete-quote-session.js'
import { withValidRetrieveQuoteSession } from '../../../test-utils/with-valid-retrieve-quote-session.js'
import { routePath as checkYourAnswersPath } from '../../quote/check-your-answers/route-path.js'

const quoteLabel = 'I want a quote for the nature restoration levy'
const requestToUseLabel =
  'I am ready to request to use the nature restoration levy'

describe('What would you like to do page', () => {
  const getServer = setupTestServer()

  it('should render all page elements', async () => {
    const document = await loadPage({
      requestUrl: routePath,
      server: getServer()
    })
    const { pageTitle, pageHeading } = getViewModel()
    expect(document.title).toBe(pageTitle)
    expect(getByRole(document, 'heading', { level: 1 })).toHaveTextContent(
      pageHeading
    )
    expect(getByLabelText(document, quoteLabel)).not.toBeChecked()
    expect(getByLabelText(document, requestToUseLabel)).not.toBeChecked()
    expect(
      getByLabelText(document, requestToUseLabel)
    ).toHaveAccessibleDescription(
      'Do this as part of your planning application. You will need the NRL reference from your quote email.'
    )
  })

  it('should link back to the start page', async () => {
    const document = await loadPage({
      requestUrl: routePath,
      server: getServer()
    })
    expect(getByRole(document, 'link', { name: 'Back' })).toHaveAttribute(
      'href',
      startPagePath
    )
  })

  it('should contain a CSRF token in the form', async () => {
    const document = await loadPage({
      requestUrl: routePath,
      server: getServer()
    })
    const csrfToken = document.querySelector('form input[name="csrfToken"]')
    expect(csrfToken).toBeInTheDocument()
  })

  it.each([
    {
      option: 'quote',
      nextPage: planningTypePath
    },
    {
      option: 'request-to-use',
      nextPage: haveNrlReferencePath
    }
  ])(
    'should redirect to $nextPage when "$option" is selected',
    async ({ option, nextPage }) => {
      const { response } = await submitForm({
        requestUrl: routePath,
        server: getServer(),
        formData: { whatWouldYouLikeToDo: option }
      })
      expect(response.statusCode).toBe(statusCodes.redirectAfterPost)
      expect(response.headers.location).toBe(nextPage)
    }
  )

  it('should show a validation error after continuing without selecting an option', async () => {
    const { response, cookie } = await submitForm({
      requestUrl: routePath,
      server: getServer(),
      formData: {}
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
      errorMessage: 'Select what you would like to do'
    })
    expect(document.title).toBe(`Error: ${getViewModel().pageTitle}`)
  })

  it.each([
    { option: 'quote', label: quoteLabel },
    { option: 'request-to-use', label: requestToUseLabel }
  ])(
    'should show the previous selection of "$option" when returning to the page',
    async ({ option, label }) => {
      const { cookie } = await submitForm({
        requestUrl: routePath,
        server: getServer(),
        formData: { whatWouldYouLikeToDo: option }
      })
      const document = await loadPage({
        requestUrl: routePath,
        server: getServer(),
        cookie
      })
      expect(getByLabelText(document, label)).toBeChecked()
    }
  )

  describe('switching journey', () => {
    const choose = (option, cookie) =>
      submitForm({
        requestUrl: routePath,
        server: getServer(),
        formData: { whatWouldYouLikeToDo: option },
        cookie
      })

    const answerHaveNrlReference = async () => {
      const server = getServer()
      return submitForm({
        requestUrl: haveNrlReferencePath,
        server,
        formData: { hasNrlReference: 'yes' },
        cookie: await withValidRetrieveQuoteSession(server)
      })
    }

    const loadHaveNrlReference = (cookie) =>
      loadPage({
        requestUrl: haveNrlReferencePath,
        server: getServer(),
        cookie
      })

    it('should clear the quote answers when request to use is chosen', async () => {
      const cookie = await withCompleteQuoteSession(getServer())
      const { cookie: updatedCookie } = await choose('request-to-use', cookie)
      const response = await getResponse({
        server: getServer(),
        requestUrl: checkYourAnswersPath,
        cookie: updatedCookie
      })
      expect(response.statusCode).toBe(statusCodes.found)
      expect(response.headers.location).toBe(startPagePath)
    })

    it('should keep the quote answers when quote is chosen again', async () => {
      const cookie = await withCompleteQuoteSession(getServer())
      const { cookie: updatedCookie } = await choose('quote', cookie)
      const response = await getResponse({
        server: getServer(),
        requestUrl: checkYourAnswersPath,
        cookie: updatedCookie
      })
      expect(response.statusCode).toBe(statusCodes.ok)
    })

    it('should clear the request to use answers when quote is chosen', async () => {
      let { cookie } = await answerHaveNrlReference()
      ;({ cookie } = await choose('quote', cookie))
      ;({ cookie } = await choose('request-to-use', cookie))
      const document = await loadHaveNrlReference(cookie)
      expect(getByLabelText(document, 'Yes')).not.toBeChecked()
    })

    it('should keep the request to use answers when request to use is chosen again', async () => {
      let { cookie } = await answerHaveNrlReference()
      ;({ cookie } = await choose('request-to-use', cookie))
      const document = await loadHaveNrlReference(cookie)
      expect(getByLabelText(document, 'Yes')).toBeChecked()
    })
  })
})
