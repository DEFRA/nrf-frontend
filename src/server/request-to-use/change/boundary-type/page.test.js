import { getByLabelText, getByRole, getByText } from '@testing-library/dom'
import { routePath } from './routes.js'
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

  it('should show the existing uploaded file preview when upload is chosen again for an uploaded quote', async () => {
    // The quote was made by uploading a file, so redeeming its magic link
    // seeds the session with the uploaded filename: choosing upload again
    // previews that file instead of starting a fresh upload.
    mockRedeemToken(mswServer)
    mockReadQuote(mswServer, savedQuote)
    const redeem = await getServer().inject({
      method: 'GET',
      url: `/request-to-use/retrieve/${savedQuote.reference}/abc123_TOKEN-xyz`
    })
    const cookie = []
      .concat(redeem.headers['set-cookie'] ?? [])
      .map((c) => c.split(';')[0])
      .join('; ')

    const { response } = await submitForm({
      requestUrl: routePath,
      server: getServer(),
      formData: { boundaryEntryType: 'upload' },
      cookie
    })

    expect(response.statusCode).toBe(303)
    expect(response.headers.location).toBe(
      '/request-to-use/change/file-preview'
    )

    const document = await loadPage({
      requestUrl: '/request-to-use/change/file-preview',
      server: getServer(),
      cookie
    })

    expect(getByRole(document, 'heading', { level: 1 })).toHaveTextContent(
      'Your uploaded red line boundary file'
    )
    // The EDP list is rebuilt from the saved quote's own EDPs, so the preview
    // renders without a fresh boundary check.
    expect(getByText(document, 'Norfolk Fens East')).toBeInTheDocument()

    // Accepting the existing file keeps it and returns to the review page
    const { response: saveResponse } = await submitForm({
      requestUrl: '/request-to-use/change/file-preview',
      server: getServer(),
      formData: {},
      cookie
    })

    expect(saveResponse.statusCode).toBe(303)
    expect(saveResponse.headers.location).toBe(reviewQuoteDetailsPath)
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
