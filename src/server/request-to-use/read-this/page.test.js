import { getByRole } from '@testing-library/dom'
import { setupSeededRequestToUseServer } from '../../../test-utils/setup-seeded-request-to-use-server.js'
import { setupTestServer } from '../../../test-utils/setup-test-server.js'
import { setupMswServer } from '../../../test-utils/setup-msw-server.js'
import { mockRecalculateLevy } from '../../../test-utils/mock-recalculate-levy.js'
import { getResponse } from '../../../test-utils/get-response.js'
import { loadPage } from '../../../test-utils/load-page.js'
import { submitForm } from '../../../test-utils/submit-form.js'
import { withCompleteQuoteSession } from '../../../test-utils/with-complete-quote-session.js'
import { assertContactDetails } from '../../../test-utils/assert-contact-details.js'

const pageHeading =
  'Details to read before you request to use the nature restoration levy'

const pagePath = '/request-to-use/read-this'
const reviewQuoteDetailsPath = '/request-to-use/review-quote-details'
const startPath = '/manage/start-page'

const mswServer = setupMswServer()

describe('Details to read before you request to use the nature restoration levy page', () => {
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

  const load = () =>
    loadPage({
      requestUrl: pagePath,
      server: getServer(),
      cookie: sessionCookie
    })

  it('should render the heading and title', async () => {
    const document = await load()

    expect(document.title).toBe(
      'Details to read before you request to use the nature restoration levy - Nature restoration levy - GOV.UK'
    )
    expect(getByRole(document, 'heading', { level: 1 })).toHaveTextContent(
      pageHeading
    )
  })

  it('should link back to the review details page', async () => {
    const document = await load()

    expect(getByRole(document, 'link', { name: 'Back' })).toHaveAttribute(
      'href',
      '/request-to-use/review-details'
    )
  })

  it('should link continue to check your answers', async () => {
    const document = await load()

    expect(getByRole(document, 'button', { name: 'Continue' })).toHaveAttribute(
      'href',
      '/request-to-use/check-your-answers'
    )
  })

  it('should show the recalculated levy amounts', async () => {
    const document = await load()

    expect(
      getByRole(document, 'heading', {
        level: 3,
        name: 'Provisional nature restoration levy amount: £26,750 (excluding VAT)'
      })
    ).toBeInTheDocument()
    expect(
      getByRole(document, 'heading', {
        level: 3,
        name: 'Inflation-adjusted nature restoration levy amount: £27,123.50 (excluding VAT)'
      })
    ).toBeInTheDocument()
  })

  it('should open the habitats regulations assessment guidance in a new tab', async () => {
    const document = await load()

    const link = getByRole(document, 'link', {
      name: 'habitats regulations assessment (opens in new tab)'
    })
    expect(link).toHaveAttribute(
      'href',
      'https://www.gov.uk/guidance/habitats-regulations-assessments-protecting-a-european-site'
    )
    expect(link).toHaveAttribute('target', '_blank')
  })

  it('should show the contact details with the NRL reference as the email subject', async () => {
    const document = await load()

    assertContactDetails(document, { mailtoSubject: 'NRL-123456' })
  })

  it('should use placeholder links for the guidance that is not published yet', async () => {
    const document = await load()

    const placeholderLinks = [
      'Read about the charging schedule for the EDP (opens in new tab)',
      'more information on handling commitments through the planning process (opens in new tab)',
      'Learn more about paying the nature restoration levy (opens in new tab)',
      'Read about nature restoration levy instalment plans (opens in new tab)'
    ]
    for (const name of placeholderLinks) {
      expect(getByRole(document, 'link', { name })).toHaveAttribute('href', '#')
    }
  })
})

describe('Details to read before you request to use the nature restoration levy page without a session', () => {
  const getServer = setupTestServer()

  it('should redirect to the start page when there is no session', async () => {
    const response = await getResponse({
      server: getServer(),
      requestUrl: pagePath
    })

    expect(response.statusCode).toBe(302)
    expect(response.headers.location).toBe(startPath)
  })
})
