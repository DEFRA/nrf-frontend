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
  // KEYS is blocked in managed Redis environments (e.g. ElastiCache) due to
  // missing permissions. Use SCAN instead — it is non-blocking and permitted.
  // On a Cluster client, fan out across master nodes and delete via the same
  // node that returned the keys — avoids CROSSSLOT errors.
  // Node clients from cluster.nodes() are raw connections with no keyPrefix
  // option, so SCAN returns and DEL must use the full key names as-is.
  // On a single-node client the keyPrefix option is active, so DEL must
  // receive un-prefixed keys and lets ioredis re-apply the prefix.
  const redisPrefix = config.get('redis.keyPrefix')
  const fullPattern = `${redisPrefix}${keyPrefix}*`
  const isCluster = Boolean(redisClient.nodes)
  const counts = await scanAndDelete(
    redisClient,
    fullPattern,
    redisPrefix,
    isCluster
  )
  const total = counts.reduce((sum, n) => sum + n, 0)
  if (total > 0) {
    logger.info({ keyCount: total }, 'Tile cache cleared')
  }
  return total
}

async function scanAndDelete(redisClient, pattern, redisPrefix, isCluster) {
  // Cluster clients don't have scanStream — fan out across each master node.
  const nodes = isCluster ? redisClient.nodes('master') : [redisClient]
  return Promise.all(
    nodes.map(async (node) => {
      const rawKeys = await scanNode(node, pattern)
      if (rawKeys.length === 0) {
        return 0
      }
      // Cluster node clients have no keyPrefix — pass raw keys directly.
      // Single-node client has keyPrefix set — strip it so ioredis re-applies it.
      const keysForDel = isCluster
        ? rawKeys
        : rawKeys.map((k) => k.slice(redisPrefix.length))
      await node.del(keysForDel)
      return rawKeys.length
    })
  )
}

function scanNode(node, pattern) {
  return new Promise((resolve, reject) => {
    const keys = []
    const stream = node.scanStream({ match: pattern, count: 100 })
    stream.on('data', (batch) => keys.push(...batch))
    stream.on('end', () => resolve(keys))
    stream.on('error', reject)
  })
}
