import { getByRole } from '@testing-library/dom'
import { routePath } from './routes.js'
import { setupTestServer } from '../../../test-utils/setup-test-server.js'
import { loadPage } from '../../../test-utils/load-page.js'

describe('Start page', () => {
  const getServer = setupTestServer()

  it('should render a page heading', async () => {
    const document = await loadPage({
      requestUrl: routePath,
      server: getServer()
    })
    expect(document.title).toBe('Nature Restoration Fund - Gov.uk')
    expect(getByRole(document, 'heading', { level: 1 })).toHaveTextContent(
      'Nature Restoration Fund'
    )
  })
})
