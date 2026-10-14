import { getByRole, queryByRole } from '@testing-library/dom'
import { routePath } from './routes.js'
import getViewModel from './get-view-model.js'
import { setupTestServer } from '../../../test-utils/setup-test-server.js'
import { loadPage } from '../../../test-utils/load-page.js'
import { assertContactDetails } from '../../../test-utils/assert-contact-details.js'

describe('We have sent you an email page', () => {
  const getServer = setupTestServer()

  it('should render a page heading and title', async () => {
    const document = await loadPage({
      requestUrl: routePath,
      server: getServer()
    })
    const { pageTitle, pageHeading } = getViewModel()

    expect(getByRole(document, 'heading', { level: 1 })).toHaveTextContent(
      pageHeading
    )
    expect(document.title).toBe(pageTitle)
  })

  it('should not render a back link', async () => {
    const document = await loadPage({
      requestUrl: routePath,
      server: getServer()
    })

    expect(
      queryByRole(document, 'link', { name: 'Back' })
    ).not.toBeInTheDocument()
  })

  it('should show the email sent confirmation content', async () => {
    const document = await loadPage({
      requestUrl: routePath,
      server: getServer()
    })
    const main = getByRole(document, 'main')

    expect(main).toHaveTextContent('We’ve sent an email to')
    expect(main).toHaveTextContent(
      'The email contains a link you can use to retrieve your quote details.'
    )
    expect(main).toHaveTextContent(
      'If you do not receive the email, check your spam or junk folder.'
    )
  })

  it('should show contact details for help with the nature restoration levy', async () => {
    const document = await loadPage({
      requestUrl: routePath,
      server: getServer()
    })

    assertContactDetails(document)
  })
})
