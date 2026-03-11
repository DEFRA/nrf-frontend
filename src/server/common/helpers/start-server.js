import Wreck from '@hapi/wreck'

import { createServer } from '../../server.js'
import { config } from '../../../config/config.js'

async function checkBackendConnectivity(logger) {
  const backendUrl = config.get('backend.apiUrl')

  logger.info(`Backend configuration - apiUrl: ${backendUrl}`)

  const healthUrl = `${backendUrl}/health`

  try {
    const { payload } = await Wreck.get(healthUrl, {
      json: true,
      timeout: 5000
    })
    logger.info(
      `Backend is reachable - apiUrl: ${backendUrl}, response: ${JSON.stringify(payload)}`
    )
  } catch (error) {
    const ignoreErrors = config.get('backend.optional')

    logger.error(
      `Backend connectivity check failed - apiUrl: ${backendUrl}, healthUrl: ${healthUrl}, statusCode: ${error?.output?.statusCode}, message: ${error?.message}`
    )

    if (ignoreErrors) {
      logger.warn('NRF_BACKEND_OPTIONAL is set — continuing without backend')
      return
    }

    throw new Error(
      `Backend is not reachable at ${healthUrl} - ${error?.message}`
    )
  }
}

async function startServer() {
  const server = await createServer()
  await server.start()

  server.logger.info('Server started successfully')
  server.logger.info(
    `Access your frontend on http://localhost:${config.get('port')}`
  )

  await checkBackendConnectivity(server.logger)

  return server
}

export { startServer, checkBackendConnectivity }
