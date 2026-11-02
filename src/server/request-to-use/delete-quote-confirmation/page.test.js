import { getByRole, getByText, queryByRole } from '@testing-library/dom'
import { getPageTitle } from '../../common/helpers/page-title.js'
import { setupTestServer } from '../../../test-utils/setup-test-server.js'
import { loadPage } from '../../../test-utils/load-page.js'
import { assertContactDetails } from '../../../test-utils/assert-contact-details.js'

const pagePath = '/request-to-use/delete-quote-confirmation'
const startPath = '/manage/start-page'

describe('Your details have been deleted page (request to use)', () => {
  const getServer = setupTestServer()

  const load = () => loadPage({ requestUrl: pagePath, server: getServer() })

  it('should render the page heading and title', async () => {
    const document = await load()

    expect(document.title).toBe(getPageTitle('Your details have been deleted'))
    expect(getByRole(document, 'heading', { level: 1 })).toHaveTextContent(
      'Your details have been deleted'
    )
  })

  it('should not show a back link', async () => {
    const document = await load()

    expect(queryByRole(document, 'link', { name: 'Back' })).toBeNull()
  })

  it('should show the request to use sub-service heading', async () => {
    const document = await load()

    expect(
      getByText(document, 'Request to use the nature restoration levy')
    ).toBeInTheDocument()
  })

  it('should link to the start page to get another quote', async () => {
    const document = await load()

    expect(
      getByRole(document, 'link', { name: 'Get another quote' })
    ).toHaveAttribute('href', startPath)
  })

  it('should show contact details for help with the nature restoration levy', async () => {
    assertContactDetails(await load())
  })
})
