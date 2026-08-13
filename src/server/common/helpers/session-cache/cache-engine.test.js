import { vi } from 'vitest'

import { Cluster, Redis } from 'ioredis'
import { Engine as CatboxRedis } from '@hapi/catbox-redis'

import { getCacheEngine } from './cache-engine.js'

const mockLoggerInfo = vi.fn()

vi.mock('ioredis', () => ({
  ...vi.importActual('ioredis'),
  Cluster: vi.fn(),
  Redis: vi.fn()
}))
vi.mock('@hapi/catbox-redis')
vi.mock('../logging/logger.js', () => ({
  createLogger: () => ({
    info: (...args) => mockLoggerInfo(...args)
  })
}))

describe('#getCacheEngine', () => {
  beforeEach(() => {
    Redis.mockImplementation(function () {
      return { on: () => ({}) }
    })
    Cluster.mockImplementation(function () {
      return { on: () => ({}) }
    })

    getCacheEngine()
  })

  test('Should setup Redis cache', () => {
    expect(CatboxRedis).toHaveBeenCalledWith(expect.any(Object))
  })

  test('Should log expected Redis message', () => {
    expect(mockLoggerInfo).toHaveBeenCalledWith('Using Redis session cache')
  })
})
