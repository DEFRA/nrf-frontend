import { describe, expect, it, vi } from 'vitest'
import { createServer } from '../server.js'

const mockClearTileCache = vi.hoisted(() => vi.fn())
vi.mock('../common/services/tile-cache.js', () => ({
  clearTileCache: mockClearTileCache,
  getCachedTile: vi.fn(),
  setCachedTile: vi.fn(),
  isCacheableTilePath: vi.fn(),
  resetTileCacheClient: vi.fn()
}))

const API_KEY = 'test-admin-key'

vi.mock('../../config/config.js', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    config: {
      ...actual.config,
      get: vi.fn((key) => {
        if (key === 'adminApiKey') return API_KEY
        return actual.config.get(key)
      })
    }
  }
})

describe('DELETE /admin/tile-cache', () => {
  const getServer = async () => {
    const server = await createServer()
    return server
  }

  it('returns 401 when x-api-key header is missing', async () => {
    const server = await getServer()
    const res = await server.inject({
      method: 'DELETE',
      url: '/admin/tile-cache'
    })
    expect(res.statusCode).toBe(401)
    await server.stop()
  })

  it('returns 401 when x-api-key header is wrong', async () => {
    const server = await getServer()
    const res = await server.inject({
      method: 'DELETE',
      url: '/admin/tile-cache',
      headers: { 'x-api-key': 'wrong-key' }
    })
    expect(res.statusCode).toBe(401)
    await server.stop()
  })

  it('calls clearTileCache and returns count on valid key', async () => {
    mockClearTileCache.mockResolvedValue(6)
    const server = await getServer()
    const res = await server.inject({
      method: 'DELETE',
      url: '/admin/tile-cache',
      headers: { 'x-api-key': API_KEY }
    })
    expect(res.statusCode).toBe(200)
    expect(JSON.parse(res.payload)).toEqual({ count: 6 })
    await server.stop()
  })

  it('returns count of 0 when cache is already empty', async () => {
    mockClearTileCache.mockResolvedValue(0)
    const server = await getServer()
    const res = await server.inject({
      method: 'DELETE',
      url: '/admin/tile-cache',
      headers: { 'x-api-key': API_KEY }
    })
    expect(res.statusCode).toBe(200)
    expect(JSON.parse(res.payload)).toEqual({ count: 0 })
    await server.stop()
  })
})
