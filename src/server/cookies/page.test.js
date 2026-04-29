import { within } from '@testing-library/dom'
import { setupTestServer } from '../../test-utils/setup-test-server.js'
import { submitForm } from '../../test-utils/submit-form.js'
import { loadPage } from '../../test-utils/load-page.js'
import { COOKIE_ROUTE } from './helpers/constants.js'
import { config } from '../../config/config.js'

describe('GTM script rendering', () => {
  const getServer = setupTestServer()
  const TEST_GTM_ID = 'GTM-TEST123'

  beforeEach(() => {
    config.set('gtmId', TEST_GTM_ID)
  })

  afterEach(() => {
    config.set('gtmId', null)
  })

  it('renders GTM scripts when analytics accepted and gtmId is set', async () => {
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
    const { getByTestId } = within(document.documentElement)

    const gtmHead = getByTestId('gtm-head')
    expect(gtmHead).toBeTruthy()
    expect(gtmHead.getAttribute('nonce')).toBeTruthy()
    expect(getByTestId('gtm-body')).toBeTruthy()
  })

  it('does not render GTM scripts when analytics rejected', async () => {
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
    const { queryByTestId } = within(document.documentElement)

    expect(queryByTestId('gtm-head')).toBeNull()
    expect(queryByTestId('gtm-body')).toBeNull()
  })

  it('does not render GTM scripts when no cookie preference is set', async () => {
    const document = await loadPage({
      requestUrl: COOKIE_ROUTE,
      server: getServer()
    })
    const { queryByTestId } = within(document.documentElement)

    expect(queryByTestId('gtm-head')).toBeNull()
    expect(queryByTestId('gtm-body')).toBeNull()
  })

  it('does not render GTM scripts when gtmId is not set', async () => {
    config.set('gtmId', null)

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
    const { queryByTestId } = within(document.documentElement)

    expect(queryByTestId('gtm-head')).toBeNull()
    expect(queryByTestId('gtm-body')).toBeNull()
  })
})
