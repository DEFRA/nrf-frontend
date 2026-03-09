import { randomUUID } from 'node:crypto'
import Hapi from '@hapi/hapi'

const port = process.env.PORT ?? 3098
const scanDelayMs = parseInt(process.env.SCAN_DELAY_MS ?? '8000', 10)

const server = Hapi.server({
  port,
  host: '0.0.0.0',
  routes: {
    payload: {
      maxBytes: 100 * 1024 * 1024 // 100MB
    }
  }
})

// In-memory store for uploads
const uploads = new Map()

/**
 * Compute the current status based on when the file was uploaded.
 * Returns 'initiated' until scanDelayMs has elapsed, then 'ready'.
 */
function getStatus(upload) {
  if (!upload.uploadedAt) {
    return upload.uploadStatus
  }
  const elapsed = Date.now() - upload.uploadedAt
  return elapsed >= scanDelayMs ? 'ready' : 'initiated'
}

server.route({
  method: 'GET',
  path: '/health',
  handler: () => ({ message: 'success' })
})

server.route({
  method: 'POST',
  path: '/upload/initiate',
  handler: (request) => {
    const { redirect, s3Bucket, s3Path, metadata } = request.payload
    const uploadId = randomUUID()

    uploads.set(uploadId, {
      redirect,
      s3Bucket,
      s3Path,
      metadata,
      uploadStatus: 'pending',
      uploadedAt: null
    })

    console.log(
      `Upload initiated - uploadId: ${uploadId}, redirect: ${redirect}`
    )

    return {
      uploadId,
      uploadUrl: `/upload-and-scan/${uploadId}`
    }
  }
})

server.route({
  method: 'POST',
  path: '/upload-and-scan/{uploadId}',
  options: {
    payload: {
      multipart: true,
      maxBytes: 100 * 1024 * 1024,
      output: 'stream',
      parse: true
    }
  },
  handler: (request, h) => {
    const { uploadId } = request.params
    const upload = uploads.get(uploadId)

    if (!upload) {
      return h.response({ error: 'Upload not found' }).code(404)
    }

    upload.uploadStatus = 'initiated'
    upload.uploadedAt = Date.now()
    console.log(
      `File uploaded - uploadId: ${uploadId}, will be ready in ${scanDelayMs}ms`
    )

    return h.redirect(upload.redirect)
  }
})

server.route({
  method: 'GET',
  path: '/upload/{uploadId}/status',
  handler: (request, h) => {
    const { uploadId } = request.params
    const upload = uploads.get(uploadId)

    if (!upload) {
      return h.response({ uploadStatus: 'unknown' }).code(404)
    }

    const status = getStatus(upload)
    console.log(`Status check - uploadId: ${uploadId}, status: ${status}`)
    return { uploadStatus: status }
  }
})

await server.start()
console.log(`nrf-backend-stub running on port ${port}`)
console.log(`Scan delay: ${scanDelayMs}ms`)
