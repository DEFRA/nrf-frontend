import { http, HttpResponse } from 'msw'
import { config } from '../config/config.js'

/**
 * Stub the backend upload endpoints so the boundary check fails with the
 * given error code, exercising the full upload → check → rejection flow.
 * @param {object} params
 * @param {object} params.mswServer
 * @param {string} params.uploadId
 * @param {string} params.errorCode
 * @param {number} params.status
 */
export function stubUploadFlow({ mswServer, uploadId, errorCode, status }) {
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
      HttpResponse.json({ error: errorCode }, { status })
    )
  )
}
