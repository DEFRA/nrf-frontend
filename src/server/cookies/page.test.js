import { queryByTestId } from '@testing-library/dom'
import { setupTestServer } from '../../test-utils/setup-test-server.js'
import { loadPage } from '../../test-utils/load-page.js'
import { submitForm } from '../../test-utils/submit-form.js'
import { COOKIE_ROUTE } from './helpers/constants.js'

describe('Analytics script tag rendering', () => {
  const getServer = setupTestServer()

  it('renders the analytics script when the user accepts analytics cookies', async () => {
    const { cookie } = await submitForm({
      requestUrl: COOKIE_ROUTE,
      server: getServer(),
      formData: { analytics: 'yes', source: 'page' }
    })
    const document = await loadPage({
      requestUrl: COOKIE_ROUTE,
      server: getServer(),
      cookie
    })

    expect(queryByTestId(document, 'script-analytics')).toBeInTheDocument()
  })

  it('does not render the analytics script when the user rejects analytics cookies', async () => {
    const { cookie } = await submitForm({
      requestUrl: COOKIE_ROUTE,
      server: getServer(),
      formData: { analytics: 'no', source: 'page' }
    })
    const document = await loadPage({
      requestUrl: COOKIE_ROUTE,
      server: getServer(),
      cookie
    })

    expect(queryByTestId(document, 'script-analytics')).not.toBeInTheDocument()
  })
})
