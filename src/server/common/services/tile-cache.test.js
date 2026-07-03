import { EventEmitter } from 'node:events'
import { afterEach, describe, expect, it, vi } from 'vitest'

function makeScanStream(batches, error) {
  const emitter = new EventEmitter()
  process.nextTick(() => {
    if (error) {
      emitter.emit('error', error)
      return
    }
    for (const batch of batches) {
      emitter.emit('data', batch)
    }
    emitter.emit('end')
  })
  return emitter
}

const mockClient = vi.hoisted(() => ({
  getBuffer: vi.fn(),
  set: vi.fn(),
  scanStream: vi.fn(),
  del: vi.fn()
}))

const buildRedisClient = vi.hoisted(() => vi.fn(() => mockClient))

vi.mock('../helpers/redis-client.js', () => ({ buildRedisClient }))

vi.mock('../../../config/config.js', () => ({
  config: {
    get: vi.fn((key) => {
      if (key === 'redis') {
        return { host: 'localhost' }
      }
      if (key === 'map.tileRedisCacheTtlSeconds') {
        return 86400
      }
      if (key === 'redis.keyPrefix') {
        return 'nrf-frontend:'
      }
      return null
    })
  }
}))

const mockLogger = vi.hoisted(() => ({ error: vi.fn(), info: vi.fn() }))
vi.mock('../helpers/logging/logger.js', () => ({
  createLogger: () => mockLogger
}))

const {
  clearTileCache,
  getCachedTile,
  isCacheableTilePath,
  resetTileCacheClient,
  setCachedTile
} = await import('./tile-cache.js')

describe('tile-cache', () => {
  afterEach(() => {
    resetTileCacheClient()
  })

  describe('isCacheableTilePath', () => {
    it.each(['tiles/edp_boundaries/8/130/85.mvt'])(
      'accepts tile path %s',
      (path) => {
        expect(isCacheableTilePath(path)).toBe(true)
      }
    )

    it.each([
      '',
      'boundary-validation',
      'tiles/edp_boundaries/8/130/85.json',
      'tiles/edp_boundaries/8/130.mvt',
      'tiles/lpa_boundaries/12/2048/1361.mvt'
    ])('rejects non-tile path %s', (path) => {
      expect(isCacheableTilePath(path)).toBe(false)
    })
  })

  describe('getCachedTile', () => {
    it('reads the prefixed key as a buffer', async () => {
      const buffer = Buffer.from('tile')
      mockClient.getBuffer.mockResolvedValue(buffer)

      const result = await getCachedTile('tiles/edp_boundaries/8/130/85.mvt')

      expect(buildRedisClient).toHaveBeenCalledWith({
        host: 'localhost'
      })
      expect(mockClient.getBuffer).toHaveBeenCalledWith(
        'tile:tiles/edp_boundaries/8/130/85.mvt'
      )
      expect(result).toBe(buffer)
    })

    it('reuses a single redis client across calls', async () => {
      await getCachedTile('tiles/edp_boundaries/8/130/85.mvt')
      await getCachedTile('tiles/edp_boundaries/8/130/86.mvt')

      expect(buildRedisClient).toHaveBeenCalledTimes(1)
    })

    it('returns null and logs when redis throws', async () => {
      const err = new Error('down')
      mockClient.getBuffer.mockRejectedValue(err)

      const result = await getCachedTile('tiles/edp_boundaries/8/130/85.mvt')

      expect(result).toBeNull()
      expect(mockLogger.error).toHaveBeenCalledWith(err, expect.any(String))
    })
  })

  describe('setCachedTile', () => {
    it('writes the buffer with the configured TTL', async () => {
      const buffer = Buffer.from('tile')

      await setCachedTile('tiles/edp_boundaries/8/130/85.mvt', buffer)

      expect(mockClient.set).toHaveBeenCalledWith(
        'tile:tiles/edp_boundaries/8/130/85.mvt',
        buffer,
        'EX',
        86400
      )
    })

    it('swallows and logs redis write errors', async () => {
      const err = new Error('down')
      mockClient.set.mockRejectedValue(err)

      await expect(
        setCachedTile('tiles/edp_boundaries/8/130/85.mvt', Buffer.from('x'))
      ).resolves.toBeUndefined()
      expect(mockLogger.error).toHaveBeenCalledWith(err, expect.any(String))
    })
  })

  describe('clearTileCache', () => {
    it('returns 0 when no tile keys exist', async () => {
      mockClient.scanStream.mockReturnValue(makeScanStream([]))

      const result = await clearTileCache()

      expect(mockClient.scanStream).toHaveBeenCalledWith({
        match: 'nrf-frontend:tile:*',
        count: 100
      })
      expect(mockClient.del).not.toHaveBeenCalled()
      expect(result).toBe(0)
    })

    it('deletes all tile keys and returns the count', async () => {
      const rawKeys = [
        'nrf-frontend:tile:tiles/edp_boundaries/8/128/84.mvt',
        'nrf-frontend:tile:tiles/edp_boundaries/8/129/84.mvt'
      ]
      mockClient.scanStream.mockReturnValue(makeScanStream([rawKeys]))
      mockClient.del.mockResolvedValue(2)

      const result = await clearTileCache()

      expect(mockClient.del).toHaveBeenCalledWith([
        'tile:tiles/edp_boundaries/8/128/84.mvt',
        'tile:tiles/edp_boundaries/8/129/84.mvt'
      ])
      expect(result).toBe(2)
    })

    it('strips the redis key prefix before calling del', async () => {
      mockClient.scanStream.mockReturnValue(
        makeScanStream([
          ['nrf-frontend:tile:tiles/edp_boundaries/10/512/341.mvt']
        ])
      )
      mockClient.del.mockResolvedValue(1)

      await clearTileCache()

      expect(mockClient.del).toHaveBeenCalledWith([
        'tile:tiles/edp_boundaries/10/512/341.mvt'
      ])
    })

    it('accumulates keys across multiple scan batches', async () => {
      mockClient.scanStream.mockReturnValue(
        makeScanStream([
          ['nrf-frontend:tile:tiles/edp_boundaries/8/128/84.mvt'],
          ['nrf-frontend:tile:tiles/edp_boundaries/8/129/84.mvt']
        ])
      )
      mockClient.del.mockResolvedValue(2)

      const result = await clearTileCache()

      expect(mockClient.del).toHaveBeenCalledWith([
        'tile:tiles/edp_boundaries/8/128/84.mvt',
        'tile:tiles/edp_boundaries/8/129/84.mvt'
      ])
      expect(result).toBe(2)
    })

    it('logs the count of deleted keys', async () => {
      mockClient.scanStream.mockReturnValue(
        makeScanStream([
          ['nrf-frontend:tile:tiles/edp_boundaries/8/128/84.mvt']
        ])
      )
      mockClient.del.mockResolvedValue(1)

      await clearTileCache()

      expect(mockLogger.info).toHaveBeenCalledWith(
        { keyCount: 1 },
        'Tile cache cleared'
      )
    })
  })
})
