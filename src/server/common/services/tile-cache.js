import { config } from '../../../config/config.js'
import { createLogger } from '../helpers/logging/logger.js'
import { buildRedisClient } from '../helpers/redis-client.js'

const logger = createLogger()
const keyPrefix = 'tile:'
const tilePathPattern = /^tiles\/edp_boundaries\/\d+\/\d+\/\d+\.mvt$/

let client = null

function getClient() {
  if (!client) {
    client = buildRedisClient(config.get('redis'))
  }
  return client
}

export function resetTileCacheClient() {
  client = null
}

export function isCacheableTilePath(path) {
  return tilePathPattern.test(path)
}

export async function getCachedTile(path) {
  try {
    return await getClient().getBuffer(`${keyPrefix}${path}`)
  } catch (err) {
    logger.error(err, `Tile cache read failed for ${path}`)
    return null
  }
}

export async function setCachedTile(path, buffer) {
  try {
    await getClient().set(
      `${keyPrefix}${path}`,
      buffer,
      'EX',
      config.get('map.tileRedisCacheTtlSeconds')
    )
  } catch (err) {
    logger.error(err, `Tile cache write failed for ${path}`)
  }
}

export async function clearTileCache() {
  const redisClient = getClient()
  // ioredis does not apply keyPrefix to KEYS pattern arguments — supply the
  // full prefixed pattern explicitly, then strip the prefix from returned keys
  // before passing to DEL (which would otherwise double-prefix them).
  const redisPrefix = config.get('redis.keyPrefix')
  const fullPattern = `${redisPrefix}${keyPrefix}*`
  const rawKeys = await redisClient.keys(fullPattern)
  if (rawKeys.length === 0) {
    return 0
  }
  const unprefixedKeys = rawKeys.map((k) => k.slice(redisPrefix.length))
  await redisClient.del(unprefixedKeys)
  logger.info({ keyCount: rawKeys.length }, 'Tile cache cleared')
  return rawKeys.length
}
