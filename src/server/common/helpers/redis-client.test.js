import { vi } from 'vitest'
import { EventEmitter } from 'node:events'

import { Cluster, Redis } from 'ioredis'

import { config } from '../../../config/config.js'
import { buildRedisClient, waitForRedisClientReady } from './redis-client.js'

vi.mock('ioredis', () => ({
  ...vi.importActual('ioredis'),
  Cluster: vi.fn(),
  Redis: vi.fn()
}))

describe('#buildRedisClient', () => {
  beforeEach(() => {
    Redis.mockImplementation(function () {
      return { on: () => ({}) }
    })
    Cluster.mockImplementation(function () {
      return { on: () => ({}) }
    })
  })

  describe('When Redis Single InstanceCache is requested', () => {
    beforeEach(() => {
      buildRedisClient(config.get('redis'))
    })

    test('Should instantiate a single Redis client', () => {
      expect(Redis).toHaveBeenCalledWith({
        db: 0,
        host: '127.0.0.1',
        keyPrefix: 'nrf-frontend:',
        port: config.get('redis.port')
      })
    })
  })

  describe('When a Redis Cluster is requested', () => {
    beforeEach(() => {
      buildRedisClient({
        ...config.get('redis'),
        useSingleInstanceCache: false,
        useTLS: true,
        username: 'user',
        password: 'pass'
      })
    })

    test('Should instantiate a Redis Cluster client', () => {
      expect(Cluster).toHaveBeenCalledWith(
        [{ host: '127.0.0.1', port: config.get('redis.port') }],
        {
          dnsLookup: expect.any(Function),
          keyPrefix: 'nrf-frontend:',
          redisOptions: { db: 0, password: 'pass', tls: {}, username: 'user' },
          slotsRefreshTimeout: 10000
        }
      )
    })
  })
})

describe('#waitForRedisClientReady', () => {
  const createClient = (status) => Object.assign(new EventEmitter(), { status })

  test('resolves immediately when the client is already ready', async () => {
    await expect(
      waitForRedisClientReady(createClient('ready'))
    ).resolves.toBeUndefined()
  })

  test('resolves once the client emits ready', async () => {
    const client = createClient('connecting')
    const promise = waitForRedisClientReady(client)
    client.emit('ready')
    await expect(promise).resolves.toBeUndefined()
  })

  test('rejects when the client is not ready within the timeout', async () => {
    vi.useFakeTimers()
    try {
      const client = createClient('connecting')
      const assertion = expect(
        waitForRedisClientReady(client, 5000)
      ).rejects.toThrow('Redis client not ready within 5000ms')
      await vi.advanceTimersByTimeAsync(5000)
      await assertion
    } finally {
      vi.useRealTimers()
    }
  })
})
