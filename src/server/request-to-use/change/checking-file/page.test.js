import { http, HttpResponse } from 'msw'
import { routePath } from './routes.js'
import { routePath as changeUploadBoundaryPath } from '../upload-boundary/route-path.js'
import { routePath as changeFilePreviewPath } from '../file-preview/route-path.js'
import { config } from '../../../../config/config.js'
import { setupTestServer } from '../../../../test-utils/setup-test-server.js'
import { setupSeededRequestToUseServer } from '../../../../test-utils/setup-seeded-request-to-use-server.js'
import { setupMswServer } from '../../../../test-utils/setup-msw-server.js'
import { getResponse } from '../../../../test-utils/get-response.js'
import { withCompleteQuoteSession } from '../../../../test-utils/with-complete-quote-session.js'
import { boundaryGeojson } from '../../../../test-utils/fixtures/boundary-geojson.js'

const uploadId = '22222222-2222-2222-2222-222222222222'

const mswServer = setupMswServer()

// Stub the backend upload endpoints so the boundary check succeeds, driving
// the full upload → check → preview redirect flow through real HTTP.
const stubSuccessfulCheck = () => {
  const backendUrl = config.get('backend').apiUrl
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
      HttpResponse.json(boundaryGeojson)
    )
  )
}

// Prime a review session and visit the change upload page so a CDP Uploader
// session is minted and the pending upload id is stored against the session,
// exactly as a real user changing their boundary would.
const primeChangeUploadSession = async (server) => {
  const cookie = await withCompleteQuoteSession(server)
  const uploadPage = await server.inject({
    method: 'GET',
    url: changeUploadBoundaryPath,
    headers: { cookie }
  })
  return []
    .concat(uploadPage.headers['set-cookie'] ?? cookie)
    .map((c) => c.split(';')[0])
    .join('; ')
}

describe('Change checking file page', () => {
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

  it('should redirect to the change upload boundary page when there is no pending upload', async () => {
    const response = await getResponse({
      server: getSeededServer(),
      requestUrl: routePath,
      cookie: await withCompleteQuoteSession(getSeededServer())
    })

    expect(response.statusCode).toBe(302)
    expect(response.headers.location).toBe(changeUploadBoundaryPath)
  })

  it('should redirect to the change file preview once the boundary check succeeds', async () => {
    stubSuccessfulCheck()
    const cookie = await primeChangeUploadSession(getSeededServer())

    const response = await getSeededServer().inject({
      method: 'GET',
      url: routePath,
      headers: { cookie }
    })

    expect(response.statusCode).toBe(303)
    expect(response.headers.location).toBe(changeFilePreviewPath)
  })
})
