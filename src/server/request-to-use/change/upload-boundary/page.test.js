import { http, HttpResponse } from 'msw'
import { getByRole } from '@testing-library/dom'
import { routePath } from './routes.js'
import { config } from '../../../../config/config.js'
import { setupTestServer } from '../../../../test-utils/setup-test-server.js'
import { setupSeededRequestToUseServer } from '../../../../test-utils/setup-seeded-request-to-use-server.js'
import { setupMswServer } from '../../../../test-utils/setup-msw-server.js'
import { getResponse } from '../../../../test-utils/get-response.js'
import { loadPage } from '../../../../test-utils/load-page.js'
import { submitForm } from '../../../../test-utils/submit-form.js'
import { withCompleteQuoteSession } from '../../../../test-utils/with-complete-quote-session.js'

const uploadId = '22222222-2222-2222-2222-222222222222'

const mswServer = setupMswServer()

const stubInitiateUpload = () => {
  const backendUrl = config.get('backend').apiUrl
  mswServer.use(
    http.post(`${backendUrl}/upload/initiate`, () =>
      HttpResponse.json({
        uploadId,
        uploadUrl: `/upload-and-scan/${uploadId}`
      })
    )
  )
}

describe('Change upload boundary page', () => {
  const getServer = setupTestServer()
  const getSeededServer = setupSeededRequestToUseServer()

  it('should redirect to the start page when there is no request to use session', async () => {
    const response = await getResponse({
      server: getServer(),
      requestUrl: routePath,
      cookie: await withCompleteQuoteSession(getServer())
    })

    expect(response.statusCode).toBe(302)
    expect(response.headers.location).toBe('/manage/start-page')
  })

  it('should render the upload form and bake the change checking file path into the uploader session', async () => {
    // Capture the body sent to the backend so the test can assert the return
    // URL baked into the CDP uploader session.
    let initiateBody
    const backendUrl = config.get('backend').apiUrl
    mswServer.use(
      http.post(`${backendUrl}/upload/initiate`, async ({ request }) => {
        initiateBody = await request.json()
        return HttpResponse.json({
          uploadId,
          uploadUrl: `/upload-and-scan/${uploadId}`
        })
      })
    )

    const cookie = await withCompleteQuoteSession(getSeededServer())
    const document = await loadPage({
      requestUrl: routePath,
      server: getSeededServer(),
      cookie
    })

    expect(getByRole(document, 'heading', { level: 1 })).toHaveTextContent(
      'Upload a red line boundary file'
    )
    expect(document.querySelector('main form')).toHaveAttribute(
      'action',
      expect.stringContaining(uploadId)
    )
    expect(getByRole(document, 'link', { name: 'Back' })).toHaveAttribute(
      'href',
      '/request-to-use/change/boundary-type'
    )
    expect(initiateBody).toEqual({
      redirect: '/request-to-use/change/checking-file'
    })
  })

  it('should stay reachable after choosing a different boundary entry type', async () => {
    // The saved quote was drawn; choosing upload clears the boundary until
    // the new file is checked, so this page must not require a complete quote.
    stubInitiateUpload()
    const cookie = await withCompleteQuoteSession(getSeededServer())
    await submitForm({
      requestUrl: '/request-to-use/change/boundary-type',
      server: getSeededServer(),
      formData: { boundaryEntryType: 'upload' },
      cookie
    })

    const response = await getResponse({
      server: getSeededServer(),
      requestUrl: routePath,
      cookie
    })

    expect(response.statusCode).toBe(200)
  })
})
