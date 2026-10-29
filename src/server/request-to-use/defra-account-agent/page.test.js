import { getByRole, getByText } from '@testing-library/dom'
import { setupSeededRequestToUseServer } from '../../../test-utils/setup-seeded-request-to-use-server.js'
import { setupTestServer } from '../../../test-utils/setup-test-server.js'
import { setupSignedInTestServer } from '../../../test-utils/setup-signed-in-test-server.js'
import { getResponse } from '../../../test-utils/get-response.js'
import { loadPage } from '../../../test-utils/load-page.js'
import { withCompleteQuoteSession } from '../../../test-utils/with-complete-quote-session.js'

const pageHeading =
  'Your client will need to create a Defra account and invite you as an agent or third party'

const pagePath = '/request-to-use/defra-account-agent'
const enterAddressPath = '/request-to-use/enter-address'

describe('Your client will need to create a Defra account and invite you as an agent or third party page', () => {
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
      /^Your client will need to create a Defra account and invite you as an agent or third party - /
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

  it('should warn that the account must belong to the client', async () => {
    const document = await load()

    expect(
      getByText(
        document,
        /The Defra account must belong to the organisation you are representing\./
      )
    ).toBeInTheDocument()
  })

  it('should list what the client needs to do', async () => {
    const document = await load()

    expect(
      getByRole(document, 'heading', {
        level: 2,
        name: 'What your client needs to do'
      })
    ).toBeInTheDocument()
    const steps = [...document.querySelectorAll('.govuk-list--number li')].map(
      (li) => li.textContent.trim()
    )
    expect(steps).toEqual([
      'They sign in to, or create, a Defra account using GOV.UK One Login or Government Gateway.',
      "They invite you to the account as an intermediary in the 'Manage account users' section.",
      'They give you access to the nature restoration levy service.'
    ])
  })

  it('should explain how to invite other people to the account', async () => {
    const document = await load()

    expect(
      getByText(document, 'How to invite other people to join a Defra account')
    ).toBeInTheDocument()
  })

  it('should explain how the agent signs in once invited', async () => {
    const document = await load()

    expect(
      getByRole(document, 'heading', { level: 2, name: 'Before you start' })
    ).toBeInTheDocument()
    expect(document.body).toHaveTextContent(
      'Once you have been invited, you sign in with your own One Login or Government Gateway user ID and password.'
    )
  })
})

describe('Your client will need to create a Defra account and invite you as an agent or third party page without a session', () => {
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

describe('Your client will need to create a Defra account and invite you as an agent or third party page when signed in', () => {
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
