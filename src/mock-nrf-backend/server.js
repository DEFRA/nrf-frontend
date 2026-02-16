import Hapi from '@hapi/hapi'
import pino from 'pino'

/**
 * Standalone mock nrf-backend server for local development
 * Runs on a separate port (default 3001) to simulate the real backend
 */

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport:
    process.env.NODE_ENV !== 'production'
      ? { target: 'pino-pretty' }
      : undefined
})

/**
 * In-memory store for RLB records
 * Maps sessionId -> record data
 */
const records = new Map()

/**
 * Creates and configures the mock backend server
 */
async function createServer() {
  const port = process.env.MOCK_BACKEND_PORT || 3001

  const server = Hapi.server({
    port,
    host: '0.0.0.0',
    routes: {
      cors: {
        origin: ['*'],
        credentials: true
      }
    }
  })

  // Health check endpoint
  server.route({
    method: 'GET',
    path: '/health',
    handler() {
      return { status: 'ok' }
    }
  })

  // POST /api/rlb - Create or update RLB record
  server.route({
    method: 'POST',
    path: '/api/rlb',
    options: {
      payload: {
        parse: true,
        allow: 'application/json'
      }
    },
    handler(request, h) {
      const { sessionId, uploadId } = request.payload || {}

      if (!sessionId) {
        return h.response({ error: 'sessionId is required' }).code(400)
      }

      const now = new Date().toISOString()
      const existing = records.get(sessionId)

      const record = {
        sessionId,
        uploadId,
        status: 'pending',
        createdAt: existing?.createdAt || now,
        updatedAt: now
      }

      records.set(sessionId, record)

      logger.info({ sessionId, uploadId }, 'Created/updated RLB record')

      return h.response(record).code(existing ? 200 : 201)
    }
  })

  // GET /api/rlb/session/{sessionId} - Get RLB status
  server.route({
    method: 'GET',
    path: '/api/rlb/session/{sessionId}',
    handler(request, h) {
      const { sessionId } = request.params
      const record = records.get(sessionId)

      if (!record) {
        return h.response({ error: 'Record not found' }).code(404)
      }

      return record
    }
  })

  // PUT /api/rlb/session/{sessionId} - Update RLB record
  server.route({
    method: 'PUT',
    path: '/api/rlb/session/{sessionId}',
    options: {
      payload: {
        parse: true,
        allow: 'application/json'
      }
    },
    handler(request, h) {
      const { sessionId } = request.params
      const updates = request.payload || {}
      const record = records.get(sessionId)

      if (!record) {
        return h.response({ error: 'Record not found' }).code(404)
      }

      // Apply updates
      const updatedRecord = {
        ...record,
        ...updates,
        sessionId, // Ensure sessionId can't be changed
        updatedAt: new Date().toISOString()
      }

      // If s3Key and filename are provided without explicit status, mark as complete
      // This simulates the backend doing a spatial check and it passing
      if (updates.s3Key && updates.filename && !updates.status) {
        updatedRecord.status = 'complete'
      }

      records.set(sessionId, updatedRecord)

      logger.info(
        { sessionId, status: updatedRecord.status },
        'Updated RLB record'
      )

      return updatedRecord
    }
  })

  // GET /api/rlb/records - Debug endpoint to list all records
  server.route({
    method: 'GET',
    path: '/api/rlb/records',
    handler() {
      return Array.from(records.values())
    }
  })

  // DELETE /api/rlb/records - Debug endpoint to clear all records
  server.route({
    method: 'DELETE',
    path: '/api/rlb/records',
    handler(request, h) {
      records.clear()
      logger.info('Cleared all RLB records')
      return h.response().code(204)
    }
  })

  return server
}

/**
 * Starts the mock backend server
 */
async function start() {
  const server = await createServer()

  await server.start()
  logger.info(`Mock nrf-backend running at ${server.info.uri}`)

  // Handle shutdown gracefully
  const shutdown = async () => {
    logger.info('Shutting down mock backend...')
    await server.stop({ timeout: 5000 })
    process.exit(0)
  }

  process.on('SIGINT', shutdown)
  process.on('SIGTERM', shutdown)
}

start().catch((err) => {
  logger.error(err, 'Failed to start mock backend')
  process.exit(1)
})
