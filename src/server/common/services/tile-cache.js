import { config } from '../../../config/config.js'
import { createLogger } from '../helpers/logging/logger.js'
import { buildRedisClient } from '../helpers/redis-client.js'

const logger = createLogger()
const keyPrefix = 'tile:'
const tilePathPattern = /^tiles\/[^/]+\/\d+\/\d+\/\d+\.mvt$/

let client

function getClient() {
  if (!client) {
    client = buildRedisClient(config.get('redis'))
  }
  return client
}

export function resetTileCacheClient() {
  client = undefined
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
      config.get('map.tileCacheTtlSeconds')
    )
  } catch (err) {
    logger.error(err, `Tile cache write failed for ${path}`)
  }
}
