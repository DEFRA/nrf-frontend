import { within } from '@testing-library/dom'
import { setupTestServer } from '../../test-utils/setup-test-server.js'
import { submitForm } from '../../test-utils/submit-form.js'
import { loadPage } from '../../test-utils/load-page.js'
import { COOKIE_ROUTE } from './helpers/constants.js'
import { unsafeRedirectUrls } from '../../test-utils/fixtures/unsafe-redirect-urls.js'
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

  it('lists the GA cookie names _ga and _ga_*', async () => {
    const document = await loadPage({
      requestUrl: COOKIE_ROUTE,
      server: getServer()
    })

    const body = document.documentElement.textContent
    expect(body).toContain('_ga')
    expect(body).toContain('_ga_*')
  })
})

describe('GA cookie clearing script', () => {
  const getServer = setupTestServer()

  it.each([
    {
      label: 'analytics rejected',
      setup: async () => {
        const { cookie } = await submitForm({
          requestUrl: COOKIE_ROUTE,
          server: getServer(),
          formData: { analytics: 'no', source: 'page' }
        })
        return { cookie }
      }
    },
    {
      label: 'no cookie preference set',
      setup: async () => ({})
    }
  ])('renders GA cookie clearing script when $label', async ({ setup }) => {
    const { cookie } = await setup()
    const document = await loadPage({
      requestUrl: COOKIE_ROUTE,
      server: getServer(),
      cookie
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

    expect(gtmHead.textContent).toContain("gtag('consent', 'default'")
    expect(gtmHead.textContent).toContain("'ad_storage': 'denied'")
    expect(gtmHead.textContent).toContain("'ad_user_data': 'denied'")
    expect(gtmHead.textContent).toContain("'ad_personalization': 'denied'")
    expect(gtmHead.textContent).toContain("'analytics_storage': 'granted'")
  })

  it('does not render GTM scripts when analytics is rejected', async () => {
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

describe('Cookie redirect safety', () => {
  const getServer = setupTestServer()

  it('drops an unsafe redirectUrl from the page submit success redirect', async () => {
    const { response } = await submitForm({
      requestUrl: COOKIE_ROUTE,
      server: getServer(),
      formData: {
        analytics: 'yes',
        source: 'page',
        redirectUrl: '/\\evil.example.com'
      }
    })

    expect(response.statusCode).toBe(303)
    expect(response.headers.location).toBe('/cookies?success=true')
  })

  it.each(unsafeRedirectUrls)(
    'redirects a banner submit with %s back to the start page',
    async (_, redirectUrl) => {
      const { response } = await submitForm({
        requestUrl: COOKIE_ROUTE,
        server: getServer(),
        formData: { analytics: 'yes', source: 'banner', redirectUrl }
      })

      expect(response.statusCode).toBe(303)
      expect(response.headers.location).toBe(
        '/manage/start-page?cookies_updated=1'
      )
    }
  )

  it('links back to a safe redirectUrl from the success banner', async () => {
    const document = await loadPage({
      requestUrl: `${COOKIE_ROUTE}?success=true&redirectUrl=/quote/boundary-type`,
      server: getServer()
    })

    const bannerLink = within(document.documentElement).getByRole('link', {
      name: 'Go back to the previous page'
    })
    expect(bannerLink.getAttribute('href')).toBe('/quote/boundary-type')
  })

  it('links back to the start page from the success banner when redirectUrl hides a tab', async () => {
    const document = await loadPage({
      requestUrl: `${COOKIE_ROUTE}?success=true&redirectUrl=/%09/evil.example.com`,
      server: getServer()
    })

    const bannerLink = within(document.documentElement).getByRole('link', {
      name: 'Go back to the previous page'
    })
    expect(bannerLink.getAttribute('href')).toBe('/manage/start-page')
  })
})
