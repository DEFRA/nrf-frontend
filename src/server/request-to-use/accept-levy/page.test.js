import { getByRole, getByLabelText, getByText } from '@testing-library/dom'
import { routePath } from './routes.js'
import getViewModel from './get-view-model.js'
import { routePath as reviewQuoteDetailsPath } from '../review-quote-details/route-path.js'
import { acceptLevySession } from '../../../test-utils/fixtures/session.js'
import { statusCodes } from '../../common/constants/status-codes.js'
import { setupSeededRequestToUseServer } from '../../../test-utils/setup-seeded-request-to-use-server.js'
import { setupMswServer } from '../../../test-utils/setup-msw-server.js'
import { mockRecalculateLevy } from '../../../test-utils/mock-recalculate-levy.js'
import { setupTestServer } from '../../../test-utils/setup-test-server.js'
import { getResponse } from '../../../test-utils/get-response.js'
import { loadPage } from '../../../test-utils/load-page.js'
import { submitForm } from '../../../test-utils/submit-form.js'
import { withCompleteQuoteSession } from '../../../test-utils/with-complete-quote-session.js'
import { expectFieldsetError } from '../../../test-utils/assertions.js'

const mswServer = setupMswServer()

const errorMessage =
  'Select yes if you accept the nature restoration levy amount'

describe('Do you accept this nature restoration levy amount page', () => {
  const getServer = setupSeededRequestToUseServer()
  let sessionCookie

  beforeEach(async () => {
    mockRecalculateLevy(mswServer)
    const { cookie } = await submitForm({
      requestUrl: reviewQuoteDetailsPath,
      server: getServer(),
      formData: {},
      cookie: await withCompleteQuoteSession(getServer())
    })
    sessionCookie = cookie
  })

  const load = (cookie = sessionCookie) =>
    loadPage({ requestUrl: routePath, server: getServer(), cookie })

  it('should render the heading, title and content', async () => {
    const document = await load()

    const { pageTitle, pageHeading } = getViewModel(
      acceptLevySession.requestToUse
    )
    expect(document.title).toBe(pageTitle)
    expect(getByRole(document, 'heading', { level: 1 })).toHaveTextContent(
      pageHeading
    )
    expect(
      getByRole(document, 'heading', { name: 'Details of the levy amount' })
    ).toBeInTheDocument()
    expect(
      getByRole(document, 'heading', {
        name: 'When to pay the nature restoration levy'
      })
    ).toBeInTheDocument()
    expect(
      getByLabelText(document, 'Yes, accept this amount')
    ).not.toBeChecked()
    expect(
      getByLabelText(document, 'No, delete my quote details')
    ).not.toBeChecked()
  })

  it('should link back to the review and amend your quote details page', async () => {
    const document = await load()

    expect(getByRole(document, 'link', { name: 'Back' })).toHaveAttribute(
      'href',
      '/request-to-use/review-quote-details'
    )
  })

  it('should show the latest provisional and inflation-adjusted levy amounts', async () => {
    const document = await load()

    expect(
      getByRole(document, 'heading', {
        name: 'Provisional nature restoration levy amount: £26,750 (excluding VAT)'
      })
    ).toBeInTheDocument()
    expect(
      getByRole(document, 'heading', {
        name: 'Inflation-adjusted nature restoration levy amount: £27,123.50 (excluding VAT)'
      })
    ).toBeInTheDocument()
  })

  it('should name the EDP the development is planned in', async () => {
    const document = await load()

    expect(
      getByText(
        document,
        'Your relevant development is planned in: Norfolk: Broads Special Area of Conservation (SAC) (Yare and Bure), Broadland Ramsar and River Wensum SAC Environmental Delivery Plan addressing nutrient pollution (2027 to 2037).'
      )
    ).toBeInTheDocument()
  })

  it('should link to the charging schedule for the EDP in a new tab', async () => {
    const document = await load()

    const link = getByRole(document, 'link', {
      name: 'Read about the charging schedule for the EDP (opens in new tab)'
    })
    expect(link).toHaveAttribute('href', '#')
    expect(link).toHaveAttribute('target', '_blank')
  })

  it('should contain a CSRF token in the form', async () => {
    const document = await load()

    expect(
      document.querySelector('form input[name="csrfToken"]')
    ).toBeInTheDocument()
  })

  it.each([
    { answer: 'yes', nextPage: '/request-to-use/enter-address' },
    { answer: 'no', nextPage: '/request-to-use/delete-quote' }
  ])(
    'should redirect to $nextPage when "$answer" is selected',
    async ({ answer, nextPage }) => {
      const { response } = await submitForm({
        requestUrl: routePath,
        server: getServer(),
        formData: { acceptLevy: answer },
        cookie: sessionCookie
      })

      expect(response.statusCode).toBe(statusCodes.redirectAfterPost)
      expect(response.headers.location).toBe(nextPage)
    }
  )

  it.each([
    { scenario: 'no option is selected', formData: {} },
    {
      scenario: 'the value is not a recognised option',
      formData: { acceptLevy: 'maybe' }
    }
  ])(
    'should redirect back with a validation error when $scenario',
    async ({ formData }) => {
      const { response, cookie } = await submitForm({
        requestUrl: routePath,
        server: getServer(),
        formData,
        cookie: sessionCookie
      })

      expect(response.statusCode).toBe(statusCodes.redirectAfterPost)
      expect(response.headers.location).toBe('/request-to-use/accept-levy')

      const document = await load(cookie)
      expectFieldsetError({ document, errorMessage })
      expect(
        getByRole(document, 'link', { name: errorMessage })
      ).toHaveAttribute('href', '#acceptLevy')
      expect(document.title).toBe(
        `Error: ${getViewModel(acceptLevySession.requestToUse).pageTitle}`
      )
    }
  )
})

describe('Do you accept this nature restoration levy amount page without a session', () => {
  const getServer = setupTestServer()

  it('should redirect to the start page when there is no session', async () => {
    const response = await getResponse({
      server: getServer(),
      requestUrl: '/request-to-use/accept-levy'
    })

    expect(response.statusCode).toBe(302)
    expect(response.headers.location).toBe('/manage/start-page')
  })
})

describe('Do you accept this nature restoration levy amount page without a levy', () => {
  const getServer = setupSeededRequestToUseServer()

  it('should show a server error when the levy has not been calculated', async () => {
    const response = await getResponse({
      server: getServer(),
      requestUrl: '/request-to-use/accept-levy',
      cookie: await withCompleteQuoteSession(getServer())
    })

    expect(response.statusCode).toBe(500)
  })
})
