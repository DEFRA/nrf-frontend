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
import defraIdentityPlugin from '@envage/defra-identity-hapi-plugin'

function getIdentityPluginOptions(config) {
  if (!config.get('identityProvider.enabled')) {
    return null
  }

  return {
    identityAppUrl: config.get('identityProvider.appUrl'),
    serviceId: config.get('identityProvider.serviceId'),
    clientId: config.get('identityProvider.clientId'),
    clientSecret: config.get('identityProvider.clientSecret'),
    defaultJourney: config.get('identityProvider.authenticationPath'),
    defaultPolicy: config.get('identityProvider.b2cPolicy'),

    // Azure AD configuration
    aad: {
      authHost: config.get('aad.authHost'),
      tenantName: config.get('aad.tenantName')
    },

    // Dynamics CRM integration
    dynamics: {
      endpointBase: config.get('dynamics.endpointBase'),
      clientId: config.get('dynamics.clientId'),
      clientSecret: config.get('dynamics.clientSecret'),
      resourceUrl: config.get('dynamics.resourceUrl')
    },

    // Application domain for OAuth redirect URI
    appDomain: `http://localhost:${config.get('port')}`,

    // Session/cookie settings
    cookiePassword: config.get('session.cookie.password'),
    isSecure: config.get('session.cookie.secure'),
    cacheCookieTtlMs: config.get('session.cache.ttl'),

    // Route paths
    outboundPath: '/login/out',
    redirectUri: '/login/return',
    logoutPath: '/logout',

    // Authentication settings
    onByDefault: false // Set to true to require auth on all routes by default
  }
}

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

  // Build plugin registration array
  const identityPluginOptions = getIdentityPluginOptions(config)
  const pluginsToRegister = [
    requestLogger,
    requestTracing,
    secureContext,
    pulse,
    sessionCache,
    nunjucksConfig,
    Scooter,
    contentSecurityPolicy
  ]

  // Add identity plugin if enabled
  if (identityPluginOptions) {
    pluginsToRegister.push({
      plugin: defraIdentityPlugin,
      options: identityPluginOptions
    })
  }

  // Always add router last
  pluginsToRegister.push(router)

  await server.register(pluginsToRegister)

  // Add auth error handling extension
  server.ext('onPostAuth', (request, h) => {
    // Redirect unauthenticated users to login for protected routes
    if (request.response && request.response.isBoom) {
      const statusCode = request.response.output.statusCode

      if (statusCode === 401 && !request.path.startsWith('/login')) {
        return h.redirect('/login/out').takeover()
      }
    }

    return h.continue
  })

  server.ext('onPreResponse', catchAll)

  return server
}
