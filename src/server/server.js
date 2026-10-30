import path from 'path'
import hapi from '@hapi/hapi'
import Scooter from '@hapi/scooter'

import { router } from './router.js'
import { config } from '../config/config.js'
import { pulse } from './common/helpers/pulse.js'
import { catchAll } from './common/helpers/errors.js'
import { applyCacheControlHeaders } from './common/helpers/cache-control-headers.js'
import { nunjucksConfig } from '../config/nunjucks/nunjucks.js'
import { requestTracing } from './common/helpers/request-tracing.js'
import { requestLogger } from './common/helpers/logging/request-logger.js'
import { sessionCache } from './common/helpers/session-cache/session-cache.js'
import { getCacheEngine } from './common/helpers/session-cache/cache-engine.js'
import { waitForRedisClientReady } from './common/helpers/redis-client.js'
import { secureContext } from '@defra/hapi-secure-context'
import { contentSecurityPolicy } from './common/helpers/content-security-policy.js'
import { applySecurityHeaders } from './common/helpers/security-headers.js'
import { defraIdentity } from './plugins/defra-identity.js'
import { registerAuthRules } from './auth/auth-rules.js'
import { cookies } from './plugins/cookies.js'
import { analyticsCookieMetrics } from './plugins/analytics-cookie-metrics.js'
import { csrf } from './common/helpers/csrf.js'

export async function createServer() {
  const { engine: sessionCacheEngine, client: redisClient } = getCacheEngine()
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
        engine: sessionCacheEngine
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
    csrf,
    nunjucksConfig,
    Scooter,
    contentSecurityPolicy,
    cookies
  ])

  if (config.get('isMetricsEnabled')) {
    await server.register(analyticsCookieMetrics)
  }

  // Store session cache on server app for auth plugin access
  server.app.sessionCache = server.cache({
    cache: config.get('session.cache.name'),
    segment: 'sessions',
    expiresIn: 24 * 60 * 60 * 1000 // 24 hours
  })

  await server.register({
    plugin: defraIdentity,
    options: {
      sessionCache: server.app.sessionCache
    }
  })

  registerAuthRules(server)

  // Register routes after auth is configured
  await server.register(router)

  // Sessions are required for core functionality (e.g. persisting quote-journey
  // answers), so refuse to start unless the session store (Redis) is connected.
  server.ext('onPreStart', () => waitForRedisClientReady(redisClient))

  server.ext('onPreResponse', catchAll)
  server.ext('onPreResponse', applyCacheControlHeaders)
  server.ext('onPreResponse', applySecurityHeaders)

  return server
}
