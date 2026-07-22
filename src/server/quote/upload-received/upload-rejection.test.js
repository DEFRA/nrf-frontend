import { JSDOM } from 'jsdom'
import { http, HttpResponse } from 'msw'
import { getAllByText, getByRole } from '@testing-library/dom'
import { config } from '../../../config/config.js'
import { routePath } from './routes.js'
import { routePath as uploadBoundaryPath } from '../upload-boundary/routes.js'
import { setupTestServer } from '../../../test-utils/setup-test-server.js'
import { setupMswServer } from '../../../test-utils/setup-msw-server.js'
import { withValidQuoteSession } from '../../../test-utils/with-valid-quote-session.js'

const backendUrl = config.get('backend').apiUrl
const uploadId = '11111111-1111-1111-1111-111111111111'

const mswServer = setupMswServer()

describe('Upload rejected before geometry parsing', () => {
  const getServer = setupTestServer()

  const stubUploadFlow = (errorCode, status) => {
    mswServer.use(
      http.post(`${backendUrl}/upload/initiate`, () =>
        HttpResponse.json({
          uploadId,
          uploadUrl: `/upload-and-scan/${uploadId}`
        })
      ),
      http.get(`${backendUrl}/upload/${uploadId}/status`, () =>
        HttpResponse.json({ uploadStatus: 'ready' })
      ),
      http.post(`${backendUrl}/boundary/check/${uploadId}`, () =>
        HttpResponse.json({ error: errorCode }, { status })
      )
    )
  }

  const primeUploadSession = async () => {
    const cookie = await withValidQuoteSession(getServer())
    // Visiting the upload page mints a CDP Uploader session and stores the
    // pending upload id against the session, exactly as a real user would.
    const uploadPage = await getServer().inject({
      method: 'GET',
      url: uploadBoundaryPath,
      headers: { cookie }
    })
    return []
      .concat(uploadPage.headers['set-cookie'] ?? cookie)
      .map((c) => c.split(';')[0])
      .join('; ')
  }

  const followRejection = async (cookie) => {
    await getServer().inject({
      method: 'GET',
      url: routePath,
      headers: { cookie }
    })
    const followed = await getServer().inject({
      method: 'GET',
      url: uploadBoundaryPath,
      headers: { cookie }
    })
    return new JSDOM(followed.result).window.document
  }

  it.each([
    'file_size_too_large',
    'file_contains_virus',
    'file_rejected_by_uploader'
  ])(
    'redirects to the upload page with an error summary for %s',
    async (errorCode) => {
      stubUploadFlow(errorCode, 400)

      const cookie = await primeUploadSession()

      const redirect = await getServer().inject({
        method: 'GET',
        url: routePath,
        headers: { cookie }
      })
      expect(redirect.statusCode).toBe(303)
      expect(redirect.headers.location).toBe(uploadBoundaryPath)

      const followed = await getServer().inject({
        method: 'GET',
        url: uploadBoundaryPath,
        headers: { cookie }
      })
      const { document } = new JSDOM(followed.result).window

      expect(
        getByRole(document, 'heading', { name: 'There is a problem' })
      ).toBeInTheDocument()
    }
  )

  it('shows the too-large message in the summary and against the file field', async () => {
    stubUploadFlow('file_size_too_large', 413)
    const document = await followRejection(await primeUploadSession())

    // The message appears twice: in the error summary and against the field.
    expect(
      getAllByText(document, /The selected file must be smaller than/)
    ).toHaveLength(2)
  })

  it('shows a virus message when the file contains a virus', async () => {
    stubUploadFlow('file_contains_virus', 400)
    const document = await followRejection(await primeUploadSession())

    expect(
      getAllByText(document, 'The selected file contains a virus')
    ).toHaveLength(2)
  })
})
