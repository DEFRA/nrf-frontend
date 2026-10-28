import { getByRole, getByText } from '@testing-library/dom'
import { setupSeededRequestToUseServer } from '../../../test-utils/setup-seeded-request-to-use-server.js'
import { setupTestServer } from '../../../test-utils/setup-test-server.js'
import { setupSignedInTestServer } from '../../../test-utils/setup-signed-in-test-server.js'
import { getResponse } from '../../../test-utils/get-response.js'
import { loadPage } from '../../../test-utils/load-page.js'
import { withCompleteQuoteSession } from '../../../test-utils/with-complete-quote-session.js'

const pageHeading =
  "You'll need to create or sign in to a Defra account as an individual"

const pagePath = '/request-to-use/defra-account-individual'
const enterAddressPath = '/request-to-use/enter-address'

describe('You will need to create or sign in to a Defra account as an individual page', () => {
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
      /^You'll need to create or sign in to a Defra account as an individual - /
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

  it('should warn that the account is for personal use only', async () => {
    const document = await load()

    expect(
      getByText(
        document,
        /You should only create a Defra account as an individual if the account is for your personal use\./
      )
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
      'One Login or Government Gateway user ID and password. If you do not have a One Login or Government Gateway account, you can create one in the next step.'
    ])
  })

  it('should explain what to do if the user already has a Defra account', async () => {
    const document = await load()

    expect(
      getByRole(document, 'heading', {
        level: 2,
        name: 'If you already have a Defra account'
      })
    ).toBeInTheDocument()
    expect(document.body).toHaveTextContent(
      'Sign in with the One Login or Government Gateway details you used to create it. You do not need to create a new account.'
    )
  })
})

describe('You will need to create or sign in to a Defra account as an individual page without a session', () => {
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

describe('You will need to create or sign in to a Defra account as an individual page when signed in', () => {
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
