import { getByRole } from '@testing-library/dom'
import { JSDOM } from 'jsdom'
import { setupTestServer } from '../../test-utils/setup-test-server.js'
import { loadPage } from '../../test-utils/load-page.js'
import { statusCodes } from '../common/constants/status-codes.js'
import { ANALYTICS_INTERNAL_ROUTE } from '../cookies/helpers/constants.js'

describe('Error pages', () => {
  const getServer = setupTestServer()

  it('should render a page not found error for an unknown path', async () => {
    const document = await loadPage({
      requestUrl: '/non-existent-path',
      server: getServer()
    })

    expect(document.title).toBe(
      'Page not found - Nature restoration levy - GOV.UK'
    )
    expect(getByRole(document, 'heading', { level: 1 })).toHaveTextContent(
      'Page not found'
    )
    expect(
      getByRole(document, 'link', { name: 'contact Natural England' })
    ).toBeInTheDocument()
  })

  it('should render a bad request error when a form payload fails validation', async () => {
    const { result, statusCode } = await getServer().inject({
      method: 'POST',
      url: ANALYTICS_INTERNAL_ROUTE,
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      payload: 'analyticsEnabled=banana'
    })

    expect(statusCode).toBe(statusCodes.badRequest)

    const { window } = new JSDOM(result)
    expect(window.document.title).toBe(
      'Your details are incomplete - Nature restoration levy - GOV.UK'
    )
    expect(
      getByRole(window.document, 'heading', { level: 1 })
    ).toHaveTextContent('Your details are incomplete')
  })
})
