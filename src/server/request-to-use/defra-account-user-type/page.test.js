import { getByRole, getByLabelText } from '@testing-library/dom'
import { routePath } from './routes.js'
import {
  seedRequestToUseSession,
  setupSeededRequestToUseServer
} from '../../../test-utils/setup-seeded-request-to-use-server.js'
import { setupTestServer } from '../../../test-utils/setup-test-server.js'
import { setupSignedInTestServer } from '../../../test-utils/setup-signed-in-test-server.js'
import { getResponse } from '../../../test-utils/get-response.js'
import { loadPage } from '../../../test-utils/load-page.js'
import { submitForm } from '../../../test-utils/submit-form.js'
import { withCompleteQuoteSession } from '../../../test-utils/with-complete-quote-session.js'
import { expectFieldsetError } from '../../../test-utils/assertions.js'

const errorMessage =
  'Select who you are requesting to use the nature restoration levy for'

const enterAddressPath = '/request-to-use/enter-address'

const individual = 'Yourself, as an individual'

describe('Who are you requesting to use the nature restoration levy for page', () => {
  const getServer = setupSeededRequestToUseServer()
  let sessionCookie

  beforeEach(async () => {
    sessionCookie = await withCompleteQuoteSession(getServer())
  })

  const load = (cookie = sessionCookie) =>
    loadPage({ requestUrl: routePath, server: getServer(), cookie })

  it('should render the heading, title and options', async () => {
    const document = await load()

    expect(document.title).toMatch(
      /^Who are you requesting to use the nature restoration levy for\? - /
    )
    expect(getByRole(document, 'heading', { level: 1 })).toHaveTextContent(
      'Who are you requesting to use the nature restoration levy for?'
    )
    expect(getByLabelText(document, individual)).not.toBeChecked()
    expect(
      getByLabelText(document, 'The business or organisation you work for')
    ).not.toBeChecked()
    expect(
      getByLabelText(
        document,
        'A client you act for as an agent or third party'
      )
    ).not.toBeChecked()
  })

  it('should link back to the variation page by default', async () => {
    const document = await load()

    expect(getByRole(document, 'link', { name: 'Back' })).toHaveAttribute(
      'href',
      '/request-to-use/variation'
    )
  })

  it.each([
    {
      scenario: 'the development is not a variation',
      answers: [
        { path: '/request-to-use/variation', formData: { variation: 'no' } }
      ],
      expected: '/request-to-use/variation'
    },
    {
      scenario: 'the original was not committed to the levy',
      answers: [
        { path: '/request-to-use/variation', formData: { variation: 'yes' } },
        {
          path: '/request-to-use/original-committed',
          formData: { originalCommitted: 'no' }
        }
      ],
      expected: '/request-to-use/original-committed'
    },
    {
      scenario: 'the original reference was entered',
      answers: [
        { path: '/request-to-use/variation', formData: { variation: 'yes' } },
        {
          path: '/request-to-use/original-committed',
          formData: { originalCommitted: 'yes' }
        },
        {
          path: '/request-to-use/original-reference',
          formData: { originalReference: 'NRL-123456' }
        }
      ],
      expected: '/request-to-use/original-reference'
    },
    {
      scenario:
        'variation was changed to "no" after the original was committed',
      answers: [
        { path: '/request-to-use/variation', formData: { variation: 'yes' } },
        {
          path: '/request-to-use/original-committed',
          formData: { originalCommitted: 'yes' }
        },
        { path: '/request-to-use/variation', formData: { variation: 'no' } }
      ],
      expected: '/request-to-use/variation'
    }
  ])(
    'should link back to $expected when $scenario',
    async ({ answers, expected }) => {
      let cookie = sessionCookie
      for (const { path, formData } of answers) {
        ;({ cookie } = await submitForm({
          requestUrl: path,
          server: getServer(),
          formData,
          cookie
        }))
      }

      const document = await load(cookie)

      expect(getByRole(document, 'link', { name: 'Back' })).toHaveAttribute(
        'href',
        expected
      )
    }
  )

  it('should describe each option with its hint', async () => {
    const document = await load()

    expect(getByLabelText(document, individual)).toHaveAccessibleDescription(
      'You are requesting to use the nature restoration levy for yourself'
    )
  })

  it('should contain a CSRF token in the form', async () => {
    const document = await load()

    expect(
      document.querySelector('form input[name="csrfToken"]')
    ).toBeInTheDocument()
  })

  it('should redirect to the individual Defra account page when "individual" is selected', async () => {
    const { response } = await submitForm({
      requestUrl: routePath,
      server: getServer(),
      formData: { defraAccountUserType: 'individual' },
      cookie: sessionCookie
    })

    expect(response.statusCode).toBe(303)
    expect(response.headers.location).toBe(
      '/request-to-use/defra-account-individual'
    )
  })

  it('should redirect to the organisation Defra account page when "organisation" is selected', async () => {
    const { response } = await submitForm({
      requestUrl: routePath,
      server: getServer(),
      formData: { defraAccountUserType: 'organisation' },
      cookie: sessionCookie
    })

    expect(response.statusCode).toBe(303)
    expect(response.headers.location).toBe(
      '/request-to-use/defra-account-organisation'
    )
  })

  it('should redirect to the agent Defra account page when "agent" is selected', async () => {
    const { response } = await submitForm({
      requestUrl: routePath,
      server: getServer(),
      formData: { defraAccountUserType: 'agent' },
      cookie: sessionCookie
    })

    expect(response.statusCode).toBe(303)
    expect(response.headers.location).toBe(
      '/request-to-use/defra-account-agent'
    )
  })

  it.each([
    { scenario: 'no option is selected', formData: {} },
    {
      scenario: 'the value is not a recognised option',
      formData: { defraAccountUserType: 'someone-else' }
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

      expect(response.statusCode).toBe(303)
      expect(response.headers.location).toBe(
        '/request-to-use/defra-account-user-type'
      )

      const document = await load(cookie)
      expectFieldsetError({ document, errorMessage })
      expect(
        getByRole(document, 'link', { name: errorMessage })
      ).toHaveAttribute('href', '#defraAccountUserType')
      expect(document.title).toMatch(
        /^Error: Who are you requesting to use the nature restoration levy for\? - /
      )
    }
  )

  it.each([
    { answer: 'individual', label: individual },
    {
      answer: 'organisation',
      label: 'The business or organisation you work for'
    },
    {
      answer: 'agent',
      label: 'A client you act for as an agent or third party'
    }
  ])(
    'should show the previous answer of "$answer" when returning to the page',
    async ({ answer, label }) => {
      const { cookie } = await submitForm({
        requestUrl: routePath,
        server: getServer(),
        formData: { defraAccountUserType: answer },
        cookie: sessionCookie
      })

      const document = await load(cookie)

      expect(getByLabelText(document, label)).toBeChecked()
    }
  )
})

describe('Who are you requesting to use the nature restoration levy for page without a session', () => {
  const getServer = setupTestServer()

  it('should redirect to the start page when there is no session', async () => {
    const response = await getResponse({
      server: getServer(),
      requestUrl: routePath
    })

    expect(response.statusCode).toBe(302)
    expect(response.headers.location).toBe('/manage/start-page')
  })
})

describe('Who are you requesting to use the nature restoration levy for page when signed in', () => {
  const { getServer, signIn } = setupSignedInTestServer()
  let saveCookie

  beforeAll(() => {
    getServer().ext('onPostHandler', seedRequestToUseSession)
  })

  beforeEach(async () => {
    saveCookie = await withCompleteQuoteSession(getServer())
  })

  it('should redirect to enter address instead of showing the page', async () => {
    const { cookie } = await signIn({ cookie: saveCookie })

    const response = await getResponse({
      server: getServer(),
      requestUrl: routePath,
      cookie
    })

    expect(response.statusCode).toBe(302)
    expect(response.headers.location).toBe(enterAddressPath)
  })

  it('should redirect to enter address when the user signed in after loading the page', async () => {
    const { cookie } = await signIn({ cookie: saveCookie })

    const { response } = await submitForm({
      requestUrl: routePath,
      server: getServer(),
      formData: { defraAccountUserType: 'individual' },
      cookie
    })

    expect(response.statusCode).toBe(303)
    expect(response.headers.location).toBe(enterAddressPath)
  })
})
