// @vitest-environment jsdom
import { JSDOM } from 'jsdom'
import { setupTestServer } from '../../test-utils/setup-test-server.js'
import { loadPage } from '../../test-utils/load-page.js'
import { runAxeChecks } from '../../test-utils/axe-helper.js'
import { ANALYTICS_INTERNAL_ROUTE } from '../cookies/helpers/constants.js'

describe('Error page accessibility checks', () => {
  const getServer = setupTestServer()

  it('should have no HTML accessibility issues on the page not found error', async () => {
    const document = await loadPage({
      requestUrl: '/non-existent-path',
      server: getServer()
    })

    await runAxeChecks(document.documentElement)
  })

  it('should have no HTML accessibility issues on the bad request error', async () => {
    const { result } = await getServer().inject({
      method: 'POST',
      url: ANALYTICS_INTERNAL_ROUTE,
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      payload: 'analyticsEnabled=banana'
    })

    const { window } = new JSDOM(result)
    await runAxeChecks(window.document.documentElement)
  })
})
