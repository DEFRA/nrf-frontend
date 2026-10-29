import { getByRole, getByText } from '@testing-library/dom'
import { setupSeededRequestToUseServer } from '../../../test-utils/setup-seeded-request-to-use-server.js'
import { setupTestServer } from '../../../test-utils/setup-test-server.js'
import { setupSignedInTestServer } from '../../../test-utils/setup-signed-in-test-server.js'
import { getResponse } from '../../../test-utils/get-response.js'
import { loadPage } from '../../../test-utils/load-page.js'
import { withCompleteQuoteSession } from '../../../test-utils/with-complete-quote-session.js'

const pageHeading =
  "You'll need to create or join a Defra account for your business or organisation"

const pagePath = '/request-to-use/defra-account-organisation'
const enterAddressPath = '/request-to-use/enter-address'

describe('You will need to create or join a Defra account for your business or organisation page', () => {
  const getServer = setupSeededRequestToUseServer()
  let sessionCookie

  beforeEach(async () => {
    sessionCookie = await withCompleteQuoteSession(getServer())
  })

  const load = () =>
    loadPage({
      requestUrl: pagePath,
      server: getServer(),
      cookie: sessionCookie
    })

  it('should render the heading and title', async () => {
    const document = await load()

    expect(document.title).toMatch(
      /^You'll need to create or join a Defra account for your business or organisation - /
    )
    expect(getByRole(document, 'heading', { level: 1 })).toHaveTextContent(
      pageHeading
    )
  })

  it('should link back to the who are you requesting page', async () => {
    const document = await load()

    expect(getByRole(document, 'link', { name: 'Back' })).toHaveAttribute(
      'href',
      '/request-to-use/defra-account-user-type'
    )
  })

  it('should link continue to enter address', async () => {
    const document = await load()

    expect(getByRole(document, 'button', { name: 'Continue' })).toHaveAttribute(
      'href',
      enterAddressPath
    )
  })

  it('should warn that an organisation account is needed', async () => {
    const document = await load()

    expect(
      getByText(
        document,
        /If you are creating a Defra account for the organisation you work for, you need to create an organisation account\./
      )
    ).toBeInTheDocument()
  })

  it('should explain how to join an existing account and invite other people', async () => {
    const document = await load()

    expect(
      getByRole(document, 'heading', {
        level: 2,
        name: 'If your organisation already has a Defra account'
      })
    ).toBeInTheDocument()
    expect(
      getByText(document, 'How to request to join the existing account')
    ).toBeInTheDocument()
    expect(
      getByRole(document, 'heading', {
        level: 2,
        name: 'Inviting other people to the Defra account'
      })
    ).toBeInTheDocument()
    expect(
      getByText(document, 'How to invite other people to join a Defra account')
    ).toBeInTheDocument()
  })

  it('should list what is needed to create a Defra account', async () => {
    const document = await load()

    expect(
      getByRole(document, 'heading', { level: 2, name: 'Before you start' })
    ).toBeInTheDocument()
    const items = [...document.querySelectorAll('.govuk-list--bullet li')].map(
      (li) => li.textContent.trim()
    )
    expect(items).toEqual([
      'email address, phone number and postal address',
      'One Login or Government Gateway user ID and password. If you do not have a One Login or Government Gateway account, you can create one in the next step.',
      'main contact details for your business or organisation (for example, head office contact details)',
      'Companies House number if the business or organisation is a limited company'
    ])
  })
})

describe('You will need to create or join a Defra account for your business or organisation page without a session', () => {
  const getServer = setupTestServer()

  it('should redirect to the start page when there is no session', async () => {
    const response = await getResponse({
      server: getServer(),
      requestUrl: pagePath
    })

    expect(response.statusCode).toBe(302)
    expect(response.headers.location).toBe('/manage/start-page')
  })
})

describe('You will need to create or join a Defra account for your business or organisation page when signed in', () => {
  const { getServer, signIn } = setupSignedInTestServer({
    seedRequestToUse: true
  })
  let saveCookie

  beforeEach(async () => {
    saveCookie = await withCompleteQuoteSession(getServer())
  })

  it('should redirect to enter address instead of showing the page', async () => {
    const { cookie } = await signIn({ cookie: saveCookie })

    const response = await getResponse({
      server: getServer(),
      requestUrl: pagePath,
      cookie
    })

    expect(response.statusCode).toBe(302)
    expect(response.headers.location).toBe(enterAddressPath)
  })
})
