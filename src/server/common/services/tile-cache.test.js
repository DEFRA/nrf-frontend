import { afterEach, describe, expect, it, vi } from 'vitest'

const mockClient = vi.hoisted(() => ({
  getBuffer: vi.fn(),
  set: vi.fn()
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
      return null
    })
  }
}))

const mockLogger = vi.hoisted(() => ({ error: vi.fn() }))
vi.mock('../helpers/logging/logger.js', () => ({
  createLogger: () => mockLogger
}))

const {
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

      expect(buildRedisClient).toHaveBeenCalledWith({ host: 'localhost' })
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
})
