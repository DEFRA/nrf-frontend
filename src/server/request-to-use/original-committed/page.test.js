import { getByRole, getByLabelText } from '@testing-library/dom'
import { setupSeededRequestToUseServer } from '../../../test-utils/setup-seeded-request-to-use-server.js'
import { setupTestServer } from '../../../test-utils/setup-test-server.js'
import { getResponse } from '../../../test-utils/get-response.js'
import { loadPage } from '../../../test-utils/load-page.js'
import { submitForm } from '../../../test-utils/submit-form.js'
import { withCompleteQuoteSession } from '../../../test-utils/with-complete-quote-session.js'
import { expectFieldsetError } from '../../../test-utils/assertions.js'

const pagePath = '/request-to-use/original-committed'
const heading =
  'Was the original planning permission committed to using the nature restoration levy?'
const errorMessage =
  'Select yes if the original planning permission was committed to using the nature restoration levy'
const yes = 'Yes'
const no = 'No'

describe('Was the original planning permission committed to using the nature restoration levy page', () => {
  const getServer = setupSeededRequestToUseServer()
  let sessionCookie

  beforeEach(async () => {
    sessionCookie = await withCompleteQuoteSession(getServer())
  })

  const load = (cookie = sessionCookie) =>
    loadPage({ requestUrl: pagePath, server: getServer(), cookie })

  it('should render the heading, title and unselected options', async () => {
    const document = await load()

    expect(document.title).toMatch(
      /^Was the original planning permission committed to using the nature restoration levy\? - /
    )
    expect(getByRole(document, 'heading', { level: 1 })).toHaveTextContent(
      heading
    )
    expect(getByLabelText(document, yes)).not.toBeChecked()
    expect(getByLabelText(document, no)).not.toBeChecked()
  })

  it('should link back to the variation page', async () => {
    const document = await load()

    expect(getByRole(document, 'link', { name: 'Back' })).toHaveAttribute(
      'href',
      '/request-to-use/variation'
    )
  })

  it('should contain a CSRF token in the form', async () => {
    const document = await load()

    expect(
      document.querySelector('form input[name="csrfToken"]')
    ).toBeInTheDocument()
  })

  it.each([
    { answer: 'yes', nextPage: '/request-to-use/original-reference' },
    { answer: 'no', nextPage: '/request-to-use/defra-account-user-type' }
  ])(
    'should redirect to $nextPage when "$answer" is selected',
    async ({ answer, nextPage }) => {
      const { response } = await submitForm({
        requestUrl: pagePath,
        server: getServer(),
        formData: { originalCommitted: answer },
        cookie: sessionCookie
      })

      expect(response.statusCode).toBe(303)
      expect(response.headers.location).toBe(nextPage)
    }
  )

  it.each(['yes', 'no'])(
    'should show the saved "%s" answer selected when the page is revisited',
    async (answer) => {
      const { cookie } = await submitForm({
        requestUrl: pagePath,
        server: getServer(),
        formData: { originalCommitted: answer },
        cookie: sessionCookie
      })

      const document = await load(cookie)

      expect(getByLabelText(document, yes).checked).toBe(answer === 'yes')
      expect(getByLabelText(document, no).checked).toBe(answer === 'no')
    }
  )

  it.each([
    { scenario: 'no option is selected', formData: {} },
    {
      scenario: 'the value is not a recognised option',
      formData: { originalCommitted: 'maybe' }
    }
  ])(
    'should redirect back with a validation error when $scenario',
    async ({ formData }) => {
      const { response, cookie } = await submitForm({
        requestUrl: pagePath,
        server: getServer(),
        formData,
        cookie: sessionCookie
      })

      expect(response.statusCode).toBe(303)
      expect(response.headers.location).toBe(pagePath)

      const document = await load(cookie)

      expectFieldsetError({ document, errorMessage })
      expect(
        getByRole(document, 'link', { name: errorMessage })
      ).toHaveAttribute('href', '#originalCommitted')
      expect(document.title).toMatch(
        /^Error: Was the original planning permission committed to using the nature restoration levy\? - /
      )
    }
  )
})

describe('Was the original planning permission committed to using the nature restoration levy page without a session', () => {
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
