import { http, HttpResponse } from 'msw'
import { getByLabelText, getByRole } from '@testing-library/dom'
import { routePath } from './routes.js'
import { config } from '../../../../config/config.js'
import { setupTestServer } from '../../../../test-utils/setup-test-server.js'
import { setupSeededRequestToUseServer } from '../../../../test-utils/setup-seeded-request-to-use-server.js'
import { setupMswServer } from '../../../../test-utils/setup-msw-server.js'
import { getResponse } from '../../../../test-utils/get-response.js'
import { loadPage } from '../../../../test-utils/load-page.js'
import { submitForm } from '../../../../test-utils/submit-form.js'
import { withCompleteQuoteSession } from '../../../../test-utils/with-complete-quote-session.js'
import { expectFieldsetError } from '../../../../test-utils/assertions.js'
import {
  mockReadQuote,
  mockRedeemToken
} from '../../../../test-utils/mock-get-quote.js'
import { savedQuote } from '../../../../test-utils/fixtures/saved-quote.js'
import { magicLinkToken } from '../../../../test-utils/fixtures/magic-link-token.js'
import { uploadId } from '../../../../test-utils/fixtures/upload-id.js'
import { getYarCookie } from '../../../../test-utils/yar-cookie.js'

const mswServer = setupMswServer()

describe('Change boundary type page', () => {
  const getServer = setupTestServer()
  const getSeededServer = setupSeededRequestToUseServer()
  const reviewQuoteDetailsPath = '/request-to-use/review-quote-details'

  it('should redirect to the start page when there is no request to use session', async () => {
    const response = await getResponse({
      server: getServer(),
      requestUrl: routePath,
      cookie: await withCompleteQuoteSession(getServer())
    })

    expect(response.statusCode).toBe(302)
    expect(response.headers.location).toBe('/manage/start-page')
  })

  it('should show the boundary entry type question with the saved answer and a back link to the review page', async () => {
    const cookie = await withCompleteQuoteSession(getSeededServer())

    const document = await loadPage({
      requestUrl: routePath,
      server: getSeededServer(),
      cookie
    })

    expect(getByRole(document, 'heading', { level: 1 })).toHaveTextContent(
      'Choose how you would like to show us the boundary of your development'
    )
    expect(getByLabelText(document, 'Draw on a map')).toBeChecked()
    expect(getByRole(document, 'link', { name: 'Back' })).toHaveAttribute(
      'href',
      reviewQuoteDetailsPath
    )
    expect(
      document.querySelector('input[name="csrfToken"]')
    ).toBeInTheDocument()
  })

  it.each([
    ['draw', '/request-to-use/change/draw-boundary'],
    ['upload', '/request-to-use/change/upload-boundary']
  ])(
    'should continue to the change %s boundary page when %s is submitted',
    async (boundaryEntryType, expectedLocation) => {
      const { response } = await submitForm({
        requestUrl: routePath,
        server: getSeededServer(),
        formData: { boundaryEntryType },
        cookie: await withCompleteQuoteSession(getSeededServer())
      })

      expect(response.statusCode).toBe(303)
      expect(response.headers.location).toBe(expectedLocation)
    }
  )

  it('should continue to the change upload page when upload is chosen again for an uploaded quote', async () => {
    // The quote was made by uploading a file, so redeeming its magic link
    // seeds the session with the uploaded filename: choosing upload again must
    // still open the upload page — the preview page's "Upload a new file or
    // draw on a map" link sends the user back through here, and landing them
    // on the existing file's preview again would make a new upload impossible.
    const backendUrl = config.get('backend').apiUrl
    mswServer.use(
      http.post(`${backendUrl}/upload/initiate`, () =>
        HttpResponse.json({
          uploadId,
          uploadUrl: `/upload-and-scan/${uploadId}`
        })
      )
    )
    mockRedeemToken(mswServer)
    mockReadQuote(mswServer, savedQuote)
    const redeem = await getServer().inject({
      method: 'GET',
      url: `/request-to-use/retrieve/${savedQuote.reference}/${magicLinkToken}`
    })
    const cookie = getYarCookie(redeem)

    const { response } = await submitForm({
      requestUrl: routePath,
      server: getServer(),
      formData: { boundaryEntryType: 'upload' },
      cookie
    })

    expect(response.statusCode).toBe(303)
    expect(response.headers.location).toBe(
      '/request-to-use/change/upload-boundary'
    )

    const document = await loadPage({
      requestUrl: '/request-to-use/change/upload-boundary',
      server: getServer(),
      cookie
    })

    expect(getByRole(document, 'heading', { level: 1 })).toHaveTextContent(
      'Upload a red line boundary file'
    )
  })

  it('should keep the saved boundary when the entry type changes and changes back', async () => {
    // The quote journey clears the boundary when the entry type changes, so a
    // user who looks at upload and comes back to draw would otherwise find an
    // empty map. In the change flow the saved boundary survives the browse;
    // only a newly drawn or uploaded boundary replaces it.
    const cookie = await withCompleteQuoteSession(getSeededServer())

    for (const boundaryEntryType of ['upload', 'draw']) {
      await submitForm({
        requestUrl: routePath,
        server: getSeededServer(),
        formData: { boundaryEntryType },
        cookie
      })
    }

    const document = await loadPage({
      requestUrl: '/request-to-use/change/draw-boundary',
      server: getSeededServer(),
      cookie
    })

    expect(
      document
        .getElementById('draw-boundary-map')
        .getAttribute('data-existing-boundary-geojson')
    ).not.toBe('null')
  })

  it('should show a validation error and keep the review back link when a change is submitted with no answer', async () => {
    const { response, cookie } = await submitForm({
      requestUrl: routePath,
      server: getSeededServer(),
      formData: {},
      cookie: await withCompleteQuoteSession(getSeededServer())
    })

    expect(response.statusCode).toBe(303)
    expect(response.headers.location).toBe(routePath)

    const document = await loadPage({
      requestUrl: routePath,
      server: getSeededServer(),
      cookie
    })

    expectFieldsetError({
      document,
      errorMessage: 'Select how you would like to show your red line boundary'
    })
    expect(getByRole(document, 'link', { name: 'Back' })).toHaveAttribute(
      'href',
      reviewQuoteDetailsPath
    )
  })
})
