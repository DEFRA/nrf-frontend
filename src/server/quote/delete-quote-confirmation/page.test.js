import { getByRole } from '@testing-library/dom'
import { routePath } from './routes.js'
import { setupTestServer } from '../../../test-utils/setup-test-server.js'
import { loadPage } from '../../../test-utils/load-page.js'
import { routePath as startPath } from '../../manage/start-page/routes.js'

describe('Delete quote confirmation page', () => {
  const getServer = setupTestServer()

  it('should render the page heading and title', async () => {
    const document = await loadPage({
      requestUrl: routePath,
      server: getServer()
    })
    expect(document.title).toBe(
      'Delete quote confirmation - Nature restoration levy - GOV.UK'
    )
    expect(getByRole(document, 'heading', { level: 1 })).toHaveTextContent(
      'Your details have been deleted'
    )
    expect(
      getByRole(document, 'link', { name: 'Get another quote' })
    ).toHaveAttribute('href', startPath)
  })
})
