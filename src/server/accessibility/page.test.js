import { getByRole } from '@testing-library/dom'
import { setupTestServer } from '../../test-utils/setup-test-server.js'
import { loadPage } from '../../test-utils/load-page.js'
import { routePath } from './route-path.js'
import { COOKIE_ROUTE } from '../cookies/helpers/constants.js'

const PAGE_HEADING = 'Accessibility statement'
const SERVICE_NAME = 'Manage the nature restoration levy'

describe('Accessibility statement page', () => {
  const getServer = setupTestServer()

  it('should render the page with skeleton content and the service header', async () => {
    const document = await loadPage({
      requestUrl: routePath,
      server: getServer()
    })

    expect(document.title).toBe(
      'Accessibility statement - Nature restoration levy - GOV.UK'
    )
    expect(
      getByRole(document, 'heading', { level: 1, name: PAGE_HEADING })
    ).toBeInTheDocument()
    expect(
      getByRole(document, 'link', { name: SERVICE_NAME })
    ).toBeInTheDocument()
    expect(document.body.textContent).toContain(
      'This accessibility statement applies to the Manage the nature restoration levy service.'
    )
  })

  it('should link to the accessibility statement from the page footer', async () => {
    const document = await loadPage({
      requestUrl: COOKIE_ROUTE,
      server: getServer()
    })

    expect(getByRole(document, 'link', { name: PAGE_HEADING })).toHaveAttribute(
      'href',
      routePath
    )
  })
})
