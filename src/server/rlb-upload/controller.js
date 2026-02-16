import { initiateUpload } from './services/cdp-uploader.js'
import {
  createRlbRecord,
  getRlbStatus,
  updateRlbRecord
} from './services/nrf-backend.js'
import { config } from '../../config/config.js'

const breadcrumbs = [
  {
    text: 'Home',
    href: '/'
  },
  {
    text: 'RLB Upload'
  }
]

/**
 * Gets the session ID from the request.
 * Uses yar session ID as the primary identifier.
 * @param {object} request - Hapi request object
 * @returns {string} Session ID
 */
function getSessionId(request) {
  return request.yar.id
}

/**
 * Builds the callback URL for cdp-uploader to call when scan completes
 * @param {object} request - Hapi request object
 * @returns {string} Callback URL
 */
function buildCallbackUrl(request) {
  const protocol = config.get('isProduction') ? 'https' : 'http'
  const host = request.info.host
  return `${protocol}://${host}/rlb-upload/callback`
}

/**
 * GET /rlb-upload - Renders the upload form
 * Does not initiate upload - that's done via POST /rlb-upload/initiate
 */
export const rlbUploadController = {
  handler(request, h) {
    return h.view('rlb-upload/index', {
      pageTitle: 'RLB Upload',
      heading: 'RLB Upload',
      breadcrumbs
    })
  }
}

/**
 * POST /rlb-upload/initiate - Initiates an upload session
 *
 * Flow (from design):
 * 1. Extract sessionId from cookie
 * 2. Call cdp-uploader POST /initiate with {s3Bucket, callback, metadata: {sessionId}}
 * 3. cdp-uploader returns {uploadUrl, statusUrl, uploadId}
 * 4. Call nrf-backend POST /api/rlb {sessionId, uploadId}
 * 5. Store uploadId in session
 * 6. Return {uploadUrl} to browser
 */
export const rlbUploadInitiateController = {
  async handler(request, h) {
    const sessionId = getSessionId(request)

    try {
      // Step 2-3: Initiate upload with cdp-uploader
      const callbackUrl = buildCallbackUrl(request)
      const response = await initiateUpload({
        redirect: '/rlb-upload/status',
        callback: callbackUrl,
        metadata: {
          sessionId,
          source: 'rlb-upload'
        }
      })

      const { uploadId, uploadUrl } = response

      // Step 4: Create record in nrf-backend
      try {
        await createRlbRecord({ sessionId, uploadId })
      } catch (backendErr) {
        request.logger.error(
          { err: backendErr },
          'Failed to create RLB record in backend'
        )
        // Continue anyway - the upload can still proceed
        // Backend record can be created via callback
      }

      // Step 5: Store uploadId in session for reference
      request.yar.set('uploadId', uploadId)

      // Step 6: Return uploadUrl to browser
      return h
        .response({
          uploadUrl
        })
        .code(200)
    } catch (err) {
      request.logger.error({ err }, 'Failed to initiate upload')
      return h
        .response({
          error:
            'The upload service is currently unavailable. Please try again later.'
        })
        .code(503)
    }
  },
  options: {
    payload: {
      parse: true,
      allow: 'application/json'
    }
  }
}

/**
 * GET /rlb-upload/status - Shows upload status
 *
 * Flow (from design):
 * 1. Get sessionId from cookie
 * 2. Call nrf-backend GET /api/rlb/session/{sessionId}
 * 3. Return status to browser
 */
export const rlbUploadStatusController = {
  async handler(request, h) {
    const sessionId = getSessionId(request)
    let status = null
    let error = null

    try {
      // Get status from nrf-backend
      status = await getRlbStatus(sessionId)
    } catch (err) {
      request.logger.error({ err }, 'Failed to get RLB status from backend')
      error = 'Failed to retrieve upload status'
    }

    return h.view('rlb-upload/status', {
      pageTitle: 'Upload Status',
      heading: 'Upload Status',
      breadcrumbs: [
        ...breadcrumbs.slice(0, -1),
        { text: 'RLB Upload', href: '/rlb-upload' },
        { text: 'Status' }
      ],
      status,
      error,
      sessionId
    })
  }
}

/**
 * GET /rlb-upload/status/poll - API endpoint for polling status
 * Returns JSON for AJAX polling
 */
export const rlbUploadStatusPollController = {
  async handler(request, h) {
    const sessionId = getSessionId(request)

    try {
      const status = await getRlbStatus(sessionId)
      return h.response(status).code(200)
    } catch (err) {
      request.logger.error({ err }, 'Failed to get RLB status')
      return h
        .response({
          error: 'Failed to retrieve upload status'
        })
        .code(500)
    }
  }
}

/**
 * POST /rlb-upload/callback - Callback from cdp-uploader when scan completes
 *
 * Flow (from design):
 * 1. Receive {s3Key, filename, fileStatus, metadata} from cdp-uploader
 * 2. Extract sessionId from metadata
 * 3. If fileStatus is 'rejected' (virus detected):
 *    - Call nrf-backend PUT /api/rlb/session/{sessionId} {status: 'rejected', reason: 'virus'}
 * 4. If fileStatus is 'complete' (scan passed):
 *    - Call nrf-backend PUT /api/rlb/session/{sessionId} {s3Key, filename}
 *    - nrf-backend will do spatial check and set final status
 */
export const rlbUploadCallbackController = {
  async handler(request, h) {
    const payload = request.payload || {}
    const {
      s3Key,
      s3Bucket,
      filename,
      fileStatus,
      metadata = {},
      detectedContentType,
      contentLength
    } = payload

    const { sessionId } = metadata

    if (!sessionId) {
      request.logger.error(
        { payload },
        'Callback missing sessionId in metadata'
      )
      return h.response({ error: 'Missing sessionId in metadata' }).code(400)
    }

    request.logger.info(
      { sessionId, fileStatus, filename },
      'Received upload callback'
    )

    try {
      if (fileStatus === 'rejected') {
        // Virus detected or file rejected
        await updateRlbRecord(sessionId, {
          status: 'rejected',
          reason: payload.rejectionReason || 'virus detected'
        })
      } else if (fileStatus === 'complete') {
        // Scan passed - update with file info
        // nrf-backend will perform spatial check and set final status
        await updateRlbRecord(sessionId, {
          s3Key,
          s3Bucket,
          filename,
          detectedContentType,
          contentLength
        })
      } else {
        // Unexpected status - log but don't fail
        request.logger.warn({ fileStatus, sessionId }, 'Unexpected file status')
      }

      return h.response({ received: true }).code(200)
    } catch (err) {
      request.logger.error({ err, sessionId }, 'Failed to process callback')
      return h.response({ error: 'Failed to process callback' }).code(500)
    }
  },
  options: {
    payload: {
      parse: true,
      allow: 'application/json'
    }
  }
}
