import convict from 'convict'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import convictFormatWithValidator from 'convict-format-with-validator'

const dirname = path.dirname(fileURLToPath(import.meta.url))

const fourHoursMs = 14400000
const oneWeekMs = 604800000

const isProduction = process.env.NODE_ENV === 'production'
const isTest = process.env.NODE_ENV === 'test'
const isDevelopment = process.env.NODE_ENV === 'development'

convict.addFormats(convictFormatWithValidator)

export const config = convict({
  serviceVersion: {
    doc: 'The service version, this variable is injected into your docker container in CDP environments',
    format: String,
    nullable: true,
    default: null,
    env: 'SERVICE_VERSION'
  },
  host: {
    doc: 'The IP address to bind',
    format: 'ipaddress',
    default: '0.0.0.0',
    env: 'HOST'
  },
  port: {
    doc: 'The port to bind.',
    format: 'port',
    default: 3000,
    env: 'PORT'
  },
  staticCacheTimeout: {
    doc: 'Static cache timeout in milliseconds',
    format: Number,
    default: oneWeekMs,
    env: 'STATIC_CACHE_TIMEOUT'
  },
  serviceName: {
    doc: 'Applications Service Name',
    format: String,
    default: 'Nature Restoration Fund'
  },
  root: {
    doc: 'Project root',
    format: String,
    default: path.resolve(dirname, '../..')
  },
  assetPath: {
    doc: 'Asset path',
    format: String,
    default: '/public',
    env: 'ASSET_PATH'
  },
  isProduction: {
    doc: 'If this application running in the production environment',
    format: Boolean,
    default: isProduction
  },
  isDevelopment: {
    doc: 'If this application running in the development environment',
    format: Boolean,
    default: isDevelopment
  },
  isTest: {
    doc: 'If this application running in the test environment',
    format: Boolean,
    default: isTest
  },
  log: {
    enabled: {
      doc: 'Is logging enabled',
      format: Boolean,
      default: process.env.NODE_ENV !== 'test',
      env: 'LOG_ENABLED'
    },
    level: {
      doc: 'Logging level',
      format: ['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'],
      default: 'info',
      env: 'LOG_LEVEL'
    },
    format: {
      doc: 'Format to output logs in.',
      format: ['ecs', 'pino-pretty'],
      default: isProduction ? 'ecs' : 'pino-pretty',
      env: 'LOG_FORMAT'
    },
    redact: {
      doc: 'Log paths to redact',
      format: Array,
      default: isProduction
        ? ['req.headers.authorization', 'req.headers.cookie', 'res.headers']
        : []
    }
  },
  httpProxy: {
    doc: 'HTTP Proxy',
    format: String,
    nullable: true,
    default: null,
    env: 'HTTP_PROXY'
  },
  httpsProxy: {
    doc: 'HTTPS Proxy',
    format: String,
    nullable: true,
    default: null,
    env: 'HTTPS_PROXY'
  },
  isSecureContextEnabled: {
    doc: 'Enable Secure Context',
    format: Boolean,
    default: isProduction,
    env: 'ENABLE_SECURE_CONTEXT'
  },
  isMetricsEnabled: {
    doc: 'Enable metrics reporting',
    format: Boolean,
    default: isProduction,
    env: 'ENABLE_METRICS'
  },
  session: {
    cache: {
      engine: {
        doc: 'backend cache is written to',
        format: ['redis', 'memory'],
        default: 'redis',
        env: 'SESSION_CACHE_ENGINE'
      },
      name: {
        doc: 'server side session cache name',
        format: String,
        default: 'session',
        env: 'SESSION_CACHE_NAME'
      },
      ttl: {
        doc: 'server side session cache ttl',
        format: Number,
        default: fourHoursMs,
        env: 'SESSION_CACHE_TTL'
      }
    },
    cookie: {
      ttl: {
        doc: 'Session cookie ttl',
        format: Number,
        default: fourHoursMs,
        env: 'SESSION_COOKIE_TTL'
      },
      password: {
        doc: 'session cookie password',
        format: String,
        default: 'the-password-must-be-at-least-32-characters-long',
        env: 'SESSION_COOKIE_PASSWORD',
        sensitive: true
      },
      secure: {
        doc: 'set secure flag on cookie',
        format: Boolean,
        default: isProduction,
        env: 'SESSION_COOKIE_SECURE'
      }
    }
  },
  redis: {
    host: {
      doc: 'Redis cache host',
      format: String,
      default: '127.0.0.1',
      env: 'REDIS_HOST'
    },
    port: {
      doc: 'Redis cache port',
      format: String,
      default: isTest ? '6380' : '6379',
      env: 'REDIS_PORT'
    },
    username: {
      doc: 'Redis cache username',
      format: String,
      default: '',
      env: 'REDIS_USERNAME'
    },
    password: {
      doc: 'Redis cache password',
      format: '*',
      default: '',
      sensitive: true,
      env: 'REDIS_PASSWORD'
    },
    keyPrefix: {
      doc: 'Redis cache key prefix name used to isolate the cached results across multiple clients',
      format: String,
      default: 'nrf-frontend:',
      env: 'REDIS_KEY_PREFIX'
    },
    useSingleInstanceCache: {
      doc: 'Connect to a single instance of redis instead of a cluster.',
      format: Boolean,
      default: !isProduction,
      env: 'USE_SINGLE_INSTANCE_CACHE'
    },
    useTLS: {
      doc: 'Connect to redis using TLS',
      format: Boolean,
      default: isProduction,
      env: 'REDIS_TLS'
    }
  },
  nunjucks: {
    watch: {
      doc: 'Reload templates when they are changed.',
      format: Boolean,
      default: isDevelopment
    },
    noCache: {
      doc: 'Use a cache and recompile templates each time',
      format: Boolean,
      default: isDevelopment
    }
  },
  tracing: {
    header: {
      doc: 'Which header to track',
      format: String,
      default: 'x-cdp-request-id',
      env: 'TRACING_HEADER'
    }
  },
  defraId: {
    enabled: {
      doc: 'Enable DEFRA Customer Identity authentication',
      format: Boolean,
      default: true,
      env: 'ENABLE_DEFRA_ID'
    },
    wellKnownUrl: {
      doc: 'OIDC well-known configuration URL',
      format: String,
      default:
        'http://localhost:3200/cdp-defra-id-stub/.well-known/openid-configuration',
      env: 'DEFRA_ID_WELL_KNOWN_URL'
    },
    clientId: {
      doc: 'OAuth client ID',
      format: String,
      default: 'client-test',
      env: 'DEFRA_ID_CLIENT_ID'
    },
    clientSecret: {
      doc: 'OAuth client secret',
      format: String,
      default: 'test_value',
      sensitive: true,
      env: 'DEFRA_ID_CLIENT_SECRET'
    },
    redirectUrl: {
      doc: 'OAuth callback URL',
      format: String,
      default: 'http://localhost:3000/login/return',
      env: 'DEFRA_ID_REDIRECT_URL'
    },
    serviceId: {
      doc: 'Service ID for DEFRA Identity',
      format: String,
      default: 'service-test',
      env: 'DEFRA_ID_SERVICE_ID'
    },
    refreshTokens: {
      doc: 'Enable automatic token refresh',
      format: Boolean,
      default: true,
      env: 'DEFRA_ID_REFRESH_TOKENS'
    },
    scopes: {
      doc: 'Defra ID Scopes',
      format: Array,
      env: 'DEFRA_ID_SCOPES',
      default: ['openid', 'offline_access']
    }
  },
  cookie: {
    password: {
      doc: 'Cookie encryption password (32+ characters)',
      format: String,
      default: 'your-secure-cookie-password-at-least-32-characters-long-abc123',
      sensitive: true,
      env: 'COOKIE_PASSWORD'
    },
    isSecure: {
      doc: 'Use secure cookies (HTTPS only)',
      format: Boolean,
      default: isProduction,
      env: 'COOKIE_IS_SECURE'
    }
  },
  backend: {
    apiUrl: {
      doc: 'Endpoint for the backend API service',
      format: String,
      nullable: true,
      default: 'http://localhost:4001',
      env: 'NRF_BACKEND_API_URL'
    },
    optional: {
      doc: 'When true, log backend connectivity failures as warnings instead of blocking startup',
      format: Boolean,
      default: false,
      env: 'NRF_BACKEND_OPTIONAL'
    }
  },
  useSwagger: {
    doc: 'Enable Swagger API documentation at /docs',
    format: Boolean,
    default: false,
    env: 'USE_SWAGGER'
  },
  map: {
    osApiKey: {
      doc: 'Ordnance Survey Vector Tile API key for the OS Vector Tile API base map.',
      format: String,
      default: '',
      env: 'OS_API_KEY'
    }
  },
  cdpUploader: {
    url: {
      doc: 'Browser-facing base URL for the CDP uploader form action. Required locally where the frontend and uploader are on different origins. Not needed in CDP cloud where the platform proxy routes /upload-and-scan/* requests.',
      format: String,
      default: null,
      nullable: true,
      env: 'CDP_UPLOADER_URL'
    },
    bucket: {
      doc: 'S3 bucket for file uploads',
      format: String,
      default: 'boundaries',
      env: 'CDP_UPLOADER_BUCKET'
    },
    s3Path: {
      doc: 'Path prefix within the S3 bucket for uploads',
      format: String,
      default: 'boundaries/',
      env: 'CDP_UPLOADER_S3_PATH'
    }
  }
})

config.validate({ allowed: 'strict' })
