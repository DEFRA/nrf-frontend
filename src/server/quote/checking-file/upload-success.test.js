import { http, HttpResponse } from 'msw'
import { routePath } from './routes.js'
import { routePath as filePreviewPath } from '../file-preview/routes.js'
import { statusCodes } from '../../common/constants/status-codes.js'
import { config } from '../../../config/config.js'
import { setupTestServer } from '../../../test-utils/setup-test-server.js'
import { setupMswServer } from '../../../test-utils/setup-msw-server.js'
import { primeUploadSession } from '../../../test-utils/prime-upload-session.js'
import { boundaryGeojson } from '../../../test-utils/fixtures/boundary-geojson.js'

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

describe('Upload checked successfully', () => {
  const getServer = setupTestServer()

  it('redirects to the file preview once the boundary check succeeds', async () => {
    stubSuccessfulCheck()
    const cookie = await primeUploadSession(getServer())

    const response = await getServer().inject({
      method: 'GET',
      url: routePath,
      headers: { cookie }
    })

    expect(response.statusCode).toBe(statusCodes.redirectAfterPost)
    expect(response.headers.location).toBe(filePreviewPath)
  })

  it('carries change=true on the redirect in change mode', async () => {
    stubSuccessfulCheck()
    const cookie = await primeUploadSession(getServer())

    const response = await getServer().inject({
      method: 'GET',
      url: `${routePath}?change=true`,
      headers: { cookie }
    })

    expect(response.statusCode).toBe(statusCodes.redirectAfterPost)
    expect(response.headers.location).toBe(`${filePreviewPath}?change=true`)
  })
})
