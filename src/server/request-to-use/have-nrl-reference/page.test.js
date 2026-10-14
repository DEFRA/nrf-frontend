import { getByRole, getByLabelText } from '@testing-library/dom'
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
import { expectFieldsetError } from '../../../test-utils/assertions.js'

describe('Do you have an NRL reference page', () => {
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
    expect(getByRole(document, 'group')).toHaveAccessibleDescription(
      'You can find this reference in your quote email.'
    )
    expect(getByLabelText(document, 'Yes')).not.toBeChecked()
    expect(getByLabelText(document, 'No')).not.toBeChecked()
  })

  it('should link back to the what would you like to do page', async () => {
    const document = await loadPage({
      requestUrl: routePath,
      server: getServer()
    })
    expect(getByRole(document, 'link', { name: 'Back' })).toHaveAttribute(
      'href',
      whatWouldYouLikeToDoPath
    )
  })

  it('should link the Cancel link to the start page', async () => {
    const document = await loadPage({
      requestUrl: routePath,
      server: getServer()
    })
    expect(getByRole(document, 'link', { name: 'Cancel' })).toHaveAttribute(
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
    { answer: 'yes', nextPage: enterNrlReferencePath },
    { answer: 'no', nextPage: noNrlReferencePath }
  ])(
    'should redirect to $nextPage when "$answer" is selected',
    async ({ answer, nextPage }) => {
      const { response } = await submitForm({
        requestUrl: routePath,
        server: getServer(),
        formData: { hasNrlReference: answer }
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
        formData
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
})
