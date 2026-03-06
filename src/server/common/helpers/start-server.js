import Wreck from '@hapi/wreck'

import { createServer } from '../../server.js'
import { config } from '../../../config/config.js'
import { getCdpUploaderUrl } from '../services/cdp-uploader.js'

async function checkCdpUploaderConnectivity(logger) {
  const baseUrl = getCdpUploaderUrl()
  const bucket = config.get('cdpUploader.bucket')

  logger.info({ baseUrl, bucket }, 'CDP Uploader configuration')

  try {
    await Wreck.get(baseUrl, { timeout: 5000 })
    logger.info({ baseUrl }, 'CDP Uploader is reachable')
  } catch (error) {
    logger.warn(
      {
        baseUrl,
        statusCode: error?.output?.statusCode,
        message: error?.message
      },
      'CDP Uploader connectivity check failed'
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

  // Fire-and-forget connectivity check — does not block startup
  checkCdpUploaderConnectivity(server.logger)

  return server
}

export { startServer }
