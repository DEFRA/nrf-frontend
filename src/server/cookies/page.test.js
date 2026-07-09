import { within } from '@testing-library/dom'
import { setupTestServer } from '../../test-utils/setup-test-server.js'
import { submitForm } from '../../test-utils/submit-form.js'
import { loadPage } from '../../test-utils/load-page.js'
import { COOKIE_ROUTE } from './helpers/constants.js'
import { config } from '../../config/config.js'

describe('Cookie form validation', () => {
  const getServer = setupTestServer()

  it('shows an error when submitted without selecting a radio button', async () => {
    const { response, cookie } = await submitForm({
      requestUrl: COOKIE_ROUTE,
      server: getServer(),
      formData: { source: 'page' }
    })

    expect(response.statusCode).toBe(303)
    expect(response.headers.location).toBe(COOKIE_ROUTE)

    const document = await loadPage({
      requestUrl: COOKIE_ROUTE,
      server: getServer(),
      cookie
    })
    const { getByText } = within(document.documentElement)
    expect(getByText('There is a problem')).toBeTruthy()
  })
})

describe('Cookie form persistence', () => {
  const getServer = setupTestServer()

  it.each([
    { analytics: 'yes', label: 'Yes' },
    { analytics: 'no', label: 'No' }
  ])(
    'persists "$analytics" choice when page is reloaded',
    async ({ analytics, label }) => {
      const { cookie } = await submitForm({
        requestUrl: COOKIE_ROUTE,
        server: getServer(),
        formData: { analytics, source: 'page' }
      })

      const document = await loadPage({
        requestUrl: COOKIE_ROUTE,
        server: getServer(),
        cookie
      })

      const { getByRole } = within(document.documentElement)
      const radio = getByRole('radio', { name: label })
      expect(radio.checked).toBe(true)
    }
  )
})

describe('Analytics cookie table', () => {
  const getServer = setupTestServer()

  it('lists the GA cookie names _ga, _gid and _ga_*', async () => {
    const document = await loadPage({
      requestUrl: COOKIE_ROUTE,
      server: getServer()
    })

    const body = document.documentElement.textContent
    expect(body).toContain('_ga')
    expect(body).toContain('_gid')
    expect(body).toContain('_ga_*')
  })
})

describe('GA cookie clearing script', () => {
  const getServer = setupTestServer()

  it('renders GA cookie clearing script when analytics rejected', async () => {
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
    const { getByTestId } = within(document.documentElement)
    expect(getByTestId('ga-cookie-clear')).toBeTruthy()
  })

  it('renders GA cookie clearing script when no cookie preference is set', async () => {
    const document = await loadPage({
      requestUrl: COOKIE_ROUTE,
      server: getServer()
    })
    const { getByTestId } = within(document.documentElement)
    expect(getByTestId('ga-cookie-clear')).toBeTruthy()
  })

  it('does not render GA cookie clearing script when analytics accepted', async () => {
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
    expect(queryByTestId('ga-cookie-clear')).toBeNull()
  })
})

describe('Google consent mode', () => {
  const getServer = setupTestServer()
  const TEST_GTM_ID = 'GTM-TEST123'

  beforeEach(() => {
    config.set('gtmId', TEST_GTM_ID)
  })

  afterEach(() => {
    config.set('gtmId', null)
  })

  it('sets analytics_storage to denied when no cookie preference is set', async () => {
    const document = await loadPage({
      requestUrl: COOKIE_ROUTE,
      server: getServer()
    })
    const body = document.documentElement.innerHTML
    expect(body).toContain("'analytics_storage': 'denied'")
    expect(body).not.toContain("'analytics_storage': 'granted'")
  })

  it('sets analytics_storage to denied when analytics rejected', async () => {
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
    const body = document.documentElement.innerHTML
    expect(body).toContain("'analytics_storage': 'denied'")
    expect(body).not.toContain("'analytics_storage': 'granted'")
  })

  it('sets analytics_storage to granted when analytics accepted', async () => {
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
    const body = document.documentElement.innerHTML
    expect(body).toContain("'analytics_storage': 'granted'")
  })
})

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

  it('renders GTM scripts with analytics_storage denied when analytics rejected', async () => {
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
    const { getByTestId } = within(document.documentElement)

    expect(getByTestId('gtm-head')).toBeTruthy()
    expect(getByTestId('gtm-body')).toBeTruthy()
    expect(document.documentElement.innerHTML).not.toContain(
      "'analytics_storage': 'granted'"
    )
  })

  it('renders GTM scripts with analytics_storage denied when no cookie preference is set', async () => {
    const document = await loadPage({
      requestUrl: COOKIE_ROUTE,
      server: getServer()
    })
    const { getByTestId } = within(document.documentElement)

    expect(getByTestId('gtm-head')).toBeTruthy()
    expect(getByTestId('gtm-body')).toBeTruthy()
    expect(document.documentElement.innerHTML).not.toContain(
      "'analytics_storage': 'granted'"
    )
  })

  it('does not render GTM scripts when x-nrf-profile header is prod on prod environment', async () => {
    config.set('cdpEnvironment', 'prod')

    const { cookie } = await submitForm({
      requestUrl: COOKIE_ROUTE,
      server: getServer(),
      formData: { analytics: 'yes', source: 'page' }
    })

    const document = await loadPage({
      requestUrl: COOKIE_ROUTE,
      server: getServer(),
      cookie,
      headers: { 'x-nrf-profile': 'prod' }
    })
    const { queryByTestId } = within(document.documentElement)

    expect(queryByTestId('gtm-head')).toBeNull()
    expect(queryByTestId('gtm-body')).toBeNull()

    config.set('cdpEnvironment', 'local')
  })

  it('renders GTM scripts when x-nrf-profile header is prod but environment is not prod', async () => {
    const { cookie } = await submitForm({
      requestUrl: COOKIE_ROUTE,
      server: getServer(),
      formData: { analytics: 'yes', source: 'page' }
    })

    const document = await loadPage({
      requestUrl: COOKIE_ROUTE,
      server: getServer(),
      cookie,
      headers: { 'x-nrf-profile': 'prod' }
    })
    const { getByTestId } = within(document.documentElement)

    expect(getByTestId('gtm-head')).toBeTruthy()
    expect(getByTestId('gtm-body')).toBeTruthy()
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
