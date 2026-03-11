import { Redis } from 'ioredis'
import { config } from '../config/config.js'
import { createServer } from '../server/server.js'
import { ensureRedis } from './ensure-redis.js'

async function waitForRedisReady(retries = 20, intervalMs = 50) {
  const client = new Redis({
    host: config.get('redis.host'),
    port: config.get('redis.port'),
    lazyConnect: true
  })
  try {
    for (let i = 0; i < retries; i++) {
      try {
        await client.ping()
        return
      } catch {
        await new Promise((resolve) => setTimeout(resolve, intervalMs))
      }
    }
    throw new Error('Redis did not become ready in time')
  } finally {
    await client.quit()
  }
}

let sharedServer = null
let initPromise = null

async function getSharedServer() {
  if (sharedServer) return sharedServer
  if (initPromise) return initPromise

  initPromise = (async () => {
    await ensureRedis()
    const server = await createServer()
    await server.initialize()
    await waitForRedisReady()
    sharedServer = server
    return sharedServer
  })()

  return initPromise
}

export const setupTestServer = () => {
  let server

  beforeAll(async () => {
    server = await getSharedServer()
  })

  return () => server
}
