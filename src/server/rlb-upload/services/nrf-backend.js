import Wreck from '@hapi/wreck'
import { config } from '../../../config/config.js'

/**
 * nrf-backend API service for RLB records
 *
 * Endpoints:
 * - POST /api/rlb - Create or update (overwrite) RLB record
 * - GET /api/rlb/session/{sessionId} - Get RLB status by sessionId
 * - PUT /api/rlb/session/{sessionId} - Update record (file info, status, email)
 */

const getApiUrl = () => config.get('backend.apiUrl')

/**
 * Creates or updates an RLB record in nrf-backend
 * @param {object} data - Record data
 * @param {string} data.sessionId - Session ID (primary key)
 * @param {string} data.uploadId - Upload ID from cdp-uploader
 * @returns {Promise<object>} Created/updated record
 */
export async function createRlbRecord({ sessionId, uploadId }) {
  const apiUrl = getApiUrl()

  const { payload } = await Wreck.post(`${apiUrl}/api/rlb`, {
    payload: JSON.stringify({ sessionId, uploadId }),
    headers: {
      'Content-Type': 'application/json'
    },
    json: true
  })

  return payload
}

/**
 * Gets the RLB status by session ID
 * @param {string} sessionId - Session ID to look up
 * @returns {Promise<object>} RLB record with status
 */
export async function getRlbStatus(sessionId) {
  const apiUrl = getApiUrl()

  const { payload } = await Wreck.get(
    `${apiUrl}/api/rlb/session/${encodeURIComponent(sessionId)}`,
    {
      json: true
    }
  )

  return payload
}

/**
 * Updates an RLB record in nrf-backend
 * @param {string} sessionId - Session ID to update
 * @param {object} data - Fields to update
 * @param {string} [data.status] - New status (pending/complete/rejected)
 * @param {string} [data.reason] - Rejection reason (if status is rejected)
 * @param {string} [data.s3Bucket] - S3 bucket where file is stored
 * @param {string} [data.s3Key] - S3 key for the file
 * @param {string} [data.filename] - Original filename
 * @param {string} [data.email] - User email address
 * @returns {Promise<object>} Updated record
 */
export async function updateRlbRecord(sessionId, data) {
  const apiUrl = getApiUrl()

  const { payload } = await Wreck.put(
    `${apiUrl}/api/rlb/session/${encodeURIComponent(sessionId)}`,
    {
      payload: JSON.stringify(data),
      headers: {
        'Content-Type': 'application/json'
      },
      json: true
    }
  )

  return payload
}
