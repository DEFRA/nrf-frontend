import { getByRole } from '@testing-library/dom'
import { routePath } from './routes.js'
import getViewModel from './get-view-model.js'
import { routePath as haveNrlReferencePath } from '../have-nrl-reference/route-path.js'
import { setupTestServer } from '../../../test-utils/setup-test-server.js'
import { loadPage } from '../../../test-utils/load-page.js'

describe('You need a quote before you can request to use the nature restoration levy page', () => {
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

  it('should link back to the do you have an NRL reference page', async () => {
    const document = await loadPage({
      requestUrl: routePath,
      server: getServer()
    })

    expect(getByRole(document, 'link', { name: 'Back' })).toHaveAttribute(
      'href',
      haveNrlReferencePath
    )
  })

  it('should link the get a quote link to the root redirect', async () => {
    const document = await loadPage({
      requestUrl: routePath,
      server: getServer()
    })

    expect(
      getByRole(document, 'link', { name: 'get a quote at any time' })
    ).toHaveAttribute('href', '/')
  })
})
