import path from 'path'
import hapi from '@hapi/hapi'
import Scooter from '@hapi/scooter'

import { router } from './router.js'
import { config } from '../config/config.js'
import { pulse } from './common/helpers/pulse.js'
import { catchAll } from './common/helpers/errors.js'
import { nunjucksConfig } from '../config/nunjucks/nunjucks.js'
import { setupProxy } from './common/helpers/proxy/setup-proxy.js'
import { requestTracing } from './common/helpers/request-tracing.js'
import { requestLogger } from './common/helpers/logging/request-logger.js'
import { sessionCache } from './common/helpers/session-cache/session-cache.js'
import { getCacheEngine } from './common/helpers/session-cache/cache-engine.js'
import { secureContext } from '@defra/hapi-secure-context'
import { contentSecurityPolicy } from './common/helpers/content-security-policy.js'
import { defraIdentity } from './plugins/defra-identity.js'
import { createLogger } from './common/helpers/logging/logger.js'
import Bell from '@hapi/bell'

const logger = createLogger()

export async function createServer() {
  setupProxy()
  const server = hapi.server({
    host: config.get('host'),
    port: config.get('port'),
    routes: {
      validate: {
        options: {
          abortEarly: false
        }
      },
      files: {
        relativeTo: path.resolve(config.get('root'), '.public')
      },
      security: {
        hsts: {
          maxAge: 31536000,
          includeSubDomains: true,
          preload: false
        },
        xss: 'enabled',
        noSniff: true,
        xframe: true
      }
    },
    router: {
      stripTrailingSlash: true
    },
    cache: [
      {
        name: config.get('session.cache.name'),
        engine: getCacheEngine(config.get('session.cache.engine'))
      }
    ],
    state: {
      strictHeader: false
    }
  })
  await server.register([
    requestLogger,
    requestTracing,
    secureContext,
    pulse,
    sessionCache,
    nunjucksConfig,
    Scooter,
    contentSecurityPolicy
  ])

  // Store session cache on server app for auth plugin access
  server.app.sessionCache = server.cache({
    cache: config.get('session.cache.name'),
    segment: 'sessions',
    expiresIn: 24 * 60 * 60 * 1000 // 24 hours
  })

  // Register DEFRA Identity authentication if enabled
  server.app.authEnabled = false
  if (config.get('defraId.enabled')) {
    try {
      // Register Bell for OAuth authentication
      // Note: Yar is already registered via sessionCache plugin above
      await server.register(Bell)

      // Register DEFRA Identity plugin to configure auth strategies
      await server.register({
        plugin: defraIdentity,
        options: {
          sessionCache: server.app.sessionCache
        }
      })
      server.app.authEnabled = true
      logger.info('DEFRA Identity authentication enabled')
    } catch (error) {
      logger.error('Failed to register DEFRA Identity plugin:', error)
      logger.warn(
        'Server will start without authentication. Check network connectivity and DEFRA_ID configuration.'
      )
      // Don't throw - allow server to start without auth for debugging
    }
  }

  // Register routes after auth is configured
  await server.register(router)

  server.ext('onPreResponse', catchAll)

  return server
}
