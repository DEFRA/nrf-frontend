import { getByRole } from '@testing-library/dom'
import { routePath } from './routes.js'
import { title } from './get-view-model.js'
import { setupTestServer } from '../../../test-utils/setup-test-server.js'
import { loadPage } from '../../../test-utils/load-page.js'

describe('Delete quote confirmation page', () => {
  const getServer = setupTestServer()

  it('should render the page heading and title', async () => {
    const document = await loadPage({
      requestUrl: routePath,
      server: getServer()
    })
    expect(document.title).toBe(`${title} - Nature Restoration Fund - Gov.uk`)
    expect(getByRole(document, 'heading', { level: 1 })).toHaveTextContent(
      title
    )
    expect(
      getByRole(document, 'link', { name: 'Get another quote' })
    ).toHaveAttribute('href', '/')
  })
})
