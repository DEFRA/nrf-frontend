import { within } from '@testing-library/dom'
import { ANALYTICS_INTERNAL_ROUTE } from '../cookies/helpers/constants.js'
import { config } from '../../config/config.js'
import { setupTestServer } from '../../test-utils/setup-test-server.js'
import { loadPage } from '../../test-utils/load-page.js'
import { submitForm } from '../../test-utils/submit-form.js'

describe('Analytics internal page', () => {
  const getServer = setupTestServer()

  it('renders the page heading and radios', async () => {
    const document = await loadPage({
      requestUrl: ANALYTICS_INTERNAL_ROUTE,
      server: getServer()
    })

    const main = document.querySelector('main')
    const { getAllByRole, getByRole } = within(main)
    const headings = getAllByRole('heading', { level: 1 })
    expect(
      headings.some(
        (h) => h.textContent.trim() === 'Enable analytics and audit events'
      )
    ).toBe(true)
    expect(getByRole('radio', { name: 'Yes' })).toBeTruthy()
    expect(getByRole('radio', { name: 'No' })).toBeTruthy()
  })

  it('pre-selects Yes when disable cookie is absent', async () => {
    const document = await loadPage({
      requestUrl: ANALYTICS_INTERNAL_ROUTE,
      server: getServer()
    })

    const { getByRole } = within(document.querySelector('main'))
    expect(getByRole('radio', { name: 'Yes' }).checked).toBe(true)
    expect(getByRole('radio', { name: 'No' }).checked).toBe(false)
  })

  it('pre-selects No when disable cookie is present', async () => {
    const { cookie } = await submitForm({
      requestUrl: ANALYTICS_INTERNAL_ROUTE,
      server: getServer(),
      formData: { analyticsEnabled: 'no' }
    })

    const document = await loadPage({
      requestUrl: ANALYTICS_INTERNAL_ROUTE,
      server: getServer(),
      cookie
    })

    const { getByRole } = within(document.querySelector('main'))
    expect(getByRole('radio', { name: 'No' }).checked).toBe(true)
    expect(getByRole('radio', { name: 'Yes' }).checked).toBe(false)
  })

  it('sets disable cookie when No is submitted', async () => {
    const { response } = await submitForm({
      requestUrl: ANALYTICS_INTERNAL_ROUTE,
      server: getServer(),
      formData: { analyticsEnabled: 'no' }
    })

    expect(response.statusCode).toBe(303)
    const setCookie = [].concat(response.headers['set-cookie'] ?? [])
    expect(
      setCookie.some((c) => c.startsWith('disable_analytics_audit=1'))
    ).toBe(true)
  })

  it('clears disable cookie when Yes is submitted', async () => {
    const { cookie } = await submitForm({
      requestUrl: ANALYTICS_INTERNAL_ROUTE,
      server: getServer(),
      formData: { analyticsEnabled: 'no' }
    })

    const { response } = await submitForm({
      requestUrl: ANALYTICS_INTERNAL_ROUTE,
      server: getServer(),
      formData: { analyticsEnabled: 'yes' },
      cookie
    })

    expect(response.statusCode).toBe(303)
    const setCookie = [].concat(response.headers['set-cookie'] ?? [])
    expect(setCookie.some((c) => c.includes('disable_analytics_audit='))).toBe(
      true
    )
    expect(
      setCookie.some(
        (c) => c.includes('Max-Age=0') || c.includes('Expires=Thu, 01 Jan 1970')
      )
    ).toBe(true)
  })

  it('shows the analytics disabled banner when disable cookie is set', async () => {
    const { cookie } = await submitForm({
      requestUrl: ANALYTICS_INTERNAL_ROUTE,
      server: getServer(),
      formData: { analyticsEnabled: 'no' }
    })

    const document = await loadPage({
      requestUrl: '/',
      server: getServer(),
      cookie
    })

    const { queryByTestId } = within(document.documentElement)
    expect(queryByTestId('analytics-disabled-banner')).toBeTruthy()
  })

  it('does not show the analytics disabled banner when disable cookie is absent', async () => {
    const document = await loadPage({
      requestUrl: '/',
      server: getServer()
    })

    const { queryByTestId } = within(document.documentElement)
    expect(queryByTestId('analytics-disabled-banner')).toBeNull()
  })
})

describe('GTM suppression via disable_analytics_audit cookie', () => {
  const getServer = setupTestServer()
  const TEST_GTM_ID = 'GTM-TEST123'

  beforeEach(() => {
    config.set('gtmId', TEST_GTM_ID)
  })

  afterEach(() => {
    config.set('gtmId', null)
  })

  it('suppresses GTM scripts when disable cookie is set', async () => {
    const { cookie } = await submitForm({
      requestUrl: ANALYTICS_INTERNAL_ROUTE,
      server: getServer(),
      formData: { analyticsEnabled: 'no' }
    })

    const document = await loadPage({
      requestUrl: '/',
      server: getServer(),
      cookie
    })

    const { queryByTestId } = within(document.documentElement)
    expect(queryByTestId('gtm-head')).toBeNull()
    expect(queryByTestId('gtm-body')).toBeNull()
  })

  it('renders GTM scripts when disable cookie is absent', async () => {
    const { cookie } = await submitForm({
      requestUrl: ANALYTICS_INTERNAL_ROUTE,
      server: getServer(),
      formData: { analyticsEnabled: 'yes' }
    })

    const document = await loadPage({
      requestUrl: '/',
      server: getServer(),
      cookie
    })

    const { getByTestId } = within(document.documentElement)
    expect(getByTestId('gtm-head')).toBeTruthy()
  })
})
