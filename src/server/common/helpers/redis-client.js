import { Cluster, Redis } from 'ioredis'

import { createLogger } from './logging/logger.js'

/**
 * Setup Redis and provide a redis client
 *
 * Local development - 1 Redis instance
 * Environments - Elasticache / Redis Cluster with username and password
 */
export function buildRedisClient(redisConfig) {
  const logger = createLogger()
  const port = redisConfig.port
  const db = 0
  const keyPrefix = redisConfig.keyPrefix
  const host = redisConfig.host
  let redisClient

  const credentials =
    redisConfig.username === ''
      ? {}
      : {
          username: redisConfig.username,
          password: redisConfig.password
        }
  const tls = redisConfig.useTLS ? { tls: {} } : {}

  if (redisConfig.useSingleInstanceCache) {
    redisClient = new Redis({
      port,
      host,
      db,
      keyPrefix,
      ...credentials,
      ...tls
    })
  } else {
    redisClient = new Cluster(
      [
        {
          host,
          port
        }
      ],
      {
        keyPrefix,
        slotsRefreshTimeout: 10000,
        dnsLookup: (address, callback) => callback(null, address),
        redisOptions: {
          db,
          ...credentials,
          ...tls
        }
      }
    )
  }

  redisClient.on('connect', () => {
    logger.info('Connected to Redis server')
  })

  redisClient.on('error', (error) => {
    logger.error(error, `Redis connection error`)
  })

  return redisClient
}

/**
 * Resolves once the ioredis client has connected and is ready to serve
 * commands, or rejects if it is not ready within the timeout. ioredis retries
 * connections internally, so transient errors are ignored until the deadline.
 * @param {import('ioredis').Redis | import('ioredis').Cluster} client
 * @param {number} [timeoutMs]
 * @returns {Promise<void>}
 */
export function waitForRedisClientReady(client, timeoutMs = 10000) {
  if (client.status === 'ready') {
    return Promise.resolve()
  }

  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      client.removeListener('ready', onReady)
      reject(new Error(`Redis client not ready within ${timeoutMs}ms`))
    }, timeoutMs)

    const onReady = () => {
      clearTimeout(timer)
      resolve()
    }

    client.once('ready', onReady)
  })
}
