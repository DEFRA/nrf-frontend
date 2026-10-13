import { getByRole, getByLabelText } from '@testing-library/dom'
import { routePath } from './routes.js'
import getViewModel from './get-view-model.js'
import { routePath as startPagePath } from '../start-page/route-path.js'
import { routePath as planningTypePath } from '../../quote/planning-type/route-path.js'
import { statusCodes } from '../../common/constants/status-codes.js'
import { setupTestServer } from '../../../test-utils/setup-test-server.js'
import { loadPage } from '../../../test-utils/load-page.js'
import { submitForm } from '../../../test-utils/submit-form.js'
import { expectFieldsetError } from '../../../test-utils/assertions.js'

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
      nextPage: '/request-to-use/have-nrl-reference'
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
})
